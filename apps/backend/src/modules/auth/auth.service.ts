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

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

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

      return user;
    });

    // Générer les tokens
    const tokens = await this.generateTokens(result.id, result.email, [
      result.roles,
    ]);

    return {
      ...tokens,
      user: {
        id: result.id,
        email: result.email,
        displayName: result.displayName,
        avatarUrl: result.avatarUrl,
        roles: [result.roles],
        createdAt: result.createdAt,
      },
    };
  }

  async login(input: AuthLoginInput): Promise<TokenResponse> {
    const { email, password } = input;

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const tokens = await this.generateTokens(user.id, user.email, [user.roles]);

    return {
      ...tokens,
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
    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
      [tokenRecord.user.roles],
    );

    // Révoquer l'ancien refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return tokens;
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

  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenPayload = { sub: userId, email, roles };
    const refreshTokenPayload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('security.jwtAccessSecret'),
        expiresIn: this.configService.get<string>(
          'security.jwtAccessExpiresIn',
        ),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('security.jwtRefreshSecret'),
        expiresIn: this.configService.get<string>(
          'security.jwtRefreshExpiresIn',
        ),
      }),
    ]);

    // Stocker le refresh token en base
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
    );
    const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
