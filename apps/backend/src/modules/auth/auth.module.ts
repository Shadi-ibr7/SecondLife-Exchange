/**
 * FICHIER: auth.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe toutes les fonctionnalités d'authentification.
 * Il configure JWT, Passport, et exporte les services et stratégies nécessaires
 * pour que les autres modules puissent utiliser l'authentification.
 *
 * COMPOSANTS:
 * - AuthController: Routes HTTP pour l'authentification
 * - AuthService: Logique métier de l'authentification
 * - JwtAccessStrategy: Stratégie pour valider les access tokens
 * - JwtRefreshStrategy: Stratégie pour valider les refresh tokens
 *
 * CONFIGURATION:
 * - JwtModule: Configuré avec les secrets et options depuis les variables d'environnement
 * - PassportModule: Module de base pour l'authentification
 */

// Import des modules et décorateurs NestJS
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // Module pour gérer les tokens JWT
import { PassportModule } from '@nestjs/passport'; // Module de base pour l'authentification
import { ConfigModule, ConfigService } from '@nestjs/config'; // Module de configuration

// Import des composants du module auth
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthAdminController } from './auth-admin.controller';
import { AuthAdminService } from './auth-admin.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

/**
 * MODULE: AuthModule
 *
 * Ce module configure et exporte toutes les fonctionnalités d'authentification.
 */
@Module({
  // ============================================
  // IMPORTS: Modules nécessaires
  // ============================================
  imports: [
    // PassportModule: Module de base pour l'authentification
    // Utilisé par les stratégies JWT
    PassportModule,

    // JwtModule: Module pour générer et vérifier les tokens JWT
    // registerAsync permet de charger la configuration depuis ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // Nécessaire pour utiliser ConfigService
      useFactory: async (configService: ConfigService) => ({
        // Secret utilisé pour signer les tokens (depuis les variables d'environnement)
        secret: configService.get<string>('security.jwtAccessSecret'),
        signOptions: {
          // Durée de vie par défaut des access tokens (depuis la config)
          expiresIn: configService.get<string>('security.jwtAccessExpiresIn'),
        },
      }),
      inject: [ConfigService], // Injecter ConfigService dans la factory
    }),
  ],

  // ============================================
  // CONTROLLERS: Routes HTTP exposées
  // ============================================
  controllers: [AuthController, AuthAdminController],

  // ============================================
  // PROVIDERS: Services et stratégies fournis
  // ============================================
  providers: [
    AuthService, // Service principal d'authentification
    JwtAccessStrategy, // Stratégie pour valider les access tokens
    JwtRefreshStrategy, // Stratégie pour valider les refresh tokens
    AuthAdminService, // Service d'authentification admin
    AdminJwtStrategy, // Stratégie JWT pour les admins
  ],

  // ============================================
  // EXPORTS: Services exportés pour les autres modules
  // ============================================
  exports: [
    AuthService, // Exporté pour que d'autres modules puissent l'utiliser
    JwtAccessStrategy, // Exporté pour que les guards puissent l'utiliser
  ],
})
export class AuthModule {}
