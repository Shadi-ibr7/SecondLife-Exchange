/**
 * FICHIER: jwt-access.strategy.ts
 *
 * DESCRIPTION:
 * Cette stratégie Passport valide les access tokens JWT.
 * Elle est utilisée par JwtAccessGuard pour protéger les routes.
 *
 * FONCTIONNEMENT:
 * 1. Extrait le token JWT depuis le header Authorization (format: "Bearer <token>")
 * 2. Vérifie la signature du token avec le secret
 * 3. Vérifie que le token n'est pas expiré
 * 4. Extrait le payload (données du token)
 * 5. Valide que l'utilisateur existe toujours dans la base de données
 * 6. Retourne l'utilisateur qui sera ajouté à request.user
 *
 * UTILISATION:
 * - Utilisée automatiquement par JwtAccessGuard
 * - S'applique à toutes les routes protégées avec @UseGuards(JwtAccessGuard)
 */

// Import des classes et exceptions NestJS
import { Injectable, UnauthorizedException } from '@nestjs/common';

// Import de Passport pour l'authentification
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Import des services nécessaires
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * INTERFACE: JwtAccessPayload
 *
 * Définit la structure du payload (contenu) d'un access token JWT.
 *
 * PROPRIÉTÉS:
 * - sub: Subject (ID de l'utilisateur)
 * - email: Email de l'utilisateur
 * - roles: Rôles de l'utilisateur (pour les permissions)
 * - iat: Issued At (timestamp de création du token)
 * - exp: Expiration (timestamp d'expiration du token)
 */
export interface JwtAccessPayload {
  sub: string; // userId (Subject)
  email: string;
  roles: string[];
  iat: number; // Issued At (timestamp)
  exp: number; // Expiration (timestamp)
}

/**
 * STRATÉGIE: JwtAccessStrategy
 *
 * Cette stratégie étend PassportStrategy pour valider les access tokens JWT.
 * Le nom 'jwt-access' est utilisé par JwtAccessGuard pour identifier cette stratégie.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access', // Nom de la stratégie (utilisé par JwtAccessGuard)
) {
  /**
   * CONSTRUCTEUR
   *
   * Configure la stratégie JWT avec:
   * - Comment extraire le token depuis la requête
   * - Le secret pour vérifier la signature
   * - Les options de validation
   */
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extraire le token depuis le header Authorization
      // Format attendu: "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Ne pas ignorer l'expiration (vérifier que le token n'est pas expiré)
      ignoreExpiration: false,

      // Secret utilisé pour vérifier la signature du token
      // Doit correspondre au secret utilisé pour signer le token
      secretOrKey: configService.get<string>('security.jwtAccessSecret'),
    });
  }

  // ============================================
  // MÉTHODE: validate
  // ============================================

  /**
   * Cette méthode est appelée automatiquement après que Passport ait validé
   * la signature et l'expiration du token.
   *
   * Elle vérifie que l'utilisateur existe toujours dans la base de données
   * et retourne les informations de l'utilisateur.
   *
   * Ces informations seront ajoutées à request.user et seront disponibles
   * dans les contrôleurs et les guards.
   *
   * @param payload - Le payload du token JWT (données décodées)
   * @returns Les informations de l'utilisateur (seront dans request.user)
   * @throws UnauthorizedException si l'utilisateur n'existe plus
   */
  async validate(payload: JwtAccessPayload) {
    // Chercher l'utilisateur dans la base de données avec l'ID du token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }, // payload.sub contient l'ID de l'utilisateur
      select: {
        // Sélectionner uniquement les champs nécessaires (sécurité)
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        createdAt: true,
      },
    });

    // Si l'utilisateur n'existe plus (supprimé entre-temps), rejeter le token
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Retourner l'utilisateur (sera ajouté à request.user)
    return user;
  }
}
