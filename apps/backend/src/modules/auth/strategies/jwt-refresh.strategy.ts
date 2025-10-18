import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtRefreshPayload {
  sub: string; // userId
  tokenHash: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('security.jwtRefreshSecret'),
    });
  }

  async validate(payload: JwtRefreshPayload) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: payload.tokenHash },
      include: { user: true },
    });

    if (
      !refreshToken ||
      refreshToken.revokedAt ||
      refreshToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Vérifier que le hash correspond
    const isValid = await bcrypt.compare(
      payload.tokenHash,
      refreshToken.tokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    return {
      userId: payload.sub,
      refreshToken,
      user: refreshToken.user,
    };
  }
}
