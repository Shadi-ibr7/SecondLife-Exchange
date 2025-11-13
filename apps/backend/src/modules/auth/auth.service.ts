import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthRegisterInput } from './dtos/auth-register.dto';
import { AuthLoginInput } from './dtos/auth-login.dto';
import { TokenResponse } from './dtos/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(input: AuthRegisterInput): Promise<TokenResponse> {
    const { email, password, displayName } = input;

    // Vérifier si l'utilisateur existe déjà avec gestion d'erreur
    let existingUser;
    try {
      existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      if (error.code === 'P1010' || error.message?.includes('denied access')) {
        console.error('Erreur Prisma P1010 dans register:', error.message);
        throw new ConflictException(
          'Service temporairement indisponible. Veuillez réessayer plus tard.',
        );
      }
      throw error;
    }

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
    );
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur et son profil en transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
        },
      });

      // Générer les tokens dans la transaction
      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, roles: [user.roles] },
        { expiresIn: '15m' },
      );

      const refreshToken = await this.jwtService.signAsync(
        { sub: user.id, type: 'refresh' },
        { expiresIn: '7d' },
      );

      const saltRounds = 10;
      const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

      // Créer le refresh token dans la transaction
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        },
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          roles: [user.roles],
          createdAt: user.createdAt,
        },
      };
    });

    return result;
  }

  async login(input: AuthLoginInput): Promise<TokenResponse> {
    const { email, password } = input;

    // Trouver l'utilisateur avec gestion d'erreur Prisma
    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      if (error.code === 'P1010' || error.message?.includes('denied access')) {
        console.error('Erreur Prisma P1010 dans login:', error.message);
        throw new UnauthorizedException(
          'Service temporairement indisponible. Veuillez réessayer plus tard.',
        );
      }
      throw error;
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, roles: [user.roles] },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const saltRounds = 10;
    const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

    // Créer le refresh token avec gestion d'erreur
    try {
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        },
      });
    } catch (error: any) {
      if (error.code === 'P1010' || error.message?.includes('denied access')) {
        console.error(
          'Erreur Prisma P1010 lors de la création du refresh token:',
          error.message,
        );
        // On continue quand même - le token JWT est déjà généré
      } else {
        throw error;
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        roles: [user.roles],
        createdAt: user.createdAt,
      },
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Vérifier le refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Vérifier que le hash correspond
    const isValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Générer de nouveaux tokens
    // Générer les nouveaux tokens
    const accessToken = await this.jwtService.signAsync(
      {
        sub: tokenRecord.user.id,
        email: tokenRecord.user.email,
        roles: [tokenRecord.user.roles],
      },
      { expiresIn: '15m' },
    );

    const newRefreshToken = await this.jwtService.signAsync(
      { sub: tokenRecord.user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const saltRounds = 10;
    const tokenHash = await bcrypt.hash(newRefreshToken, saltRounds);

    // Créer le nouveau refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });

    // Révoquer l'ancien refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token requis');
    }

    // Révoquer le refresh token
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: refreshToken },
      data: { revokedAt: new Date() },
    });
  }
}
