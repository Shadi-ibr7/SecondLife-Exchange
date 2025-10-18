import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  rateLimitTtl: 60, // 1 minute
  rateLimitLimit: 100, // 100 requests per minute
  loginRateLimitTtl: 60, // 1 minute
  loginRateLimitLimit: 5, // 5 login attempts per minute
}));
