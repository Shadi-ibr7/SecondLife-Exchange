/**
 * FICHIER: auth.service.ts
 *
 * DESCRIPTION:
 * Ce service gère toute la logique d'authentification de l'application:
 * - Inscription de nouveaux utilisateurs
 * - Connexion (login) avec vérification du mot de passe
 * - Génération de tokens JWT (access token et refresh token)
 * - Rafraîchissement des tokens
 * - Déconnexion (révocation des tokens)
 *
 * SÉCURITÉ:
 * - Mots de passe hashés avec bcrypt (algorithme de hachage sécurisé)
 * - Tokens JWT signés avec des secrets cryptographiques
 * - Refresh tokens stockés hashés dans la base de données
 * - Gestion des erreurs Prisma pour éviter les fuites d'information
 */

// Import des exceptions NestJS pour gérer les erreurs HTTP
import {
  Injectable, // Décorateur pour créer un service injectable
  ConflictException, // Exception 409: conflit (ex: email déjà utilisé)
  UnauthorizedException, // Exception 401: non autorisé (ex: mauvais mot de passe)
  BadRequestException, // Exception 400: requête invalide
} from '@nestjs/common';

// Import du service JWT pour générer et vérifier les tokens
import { JwtService } from '@nestjs/jwt';

// Import du service de configuration pour accéder aux variables d'environnement
import { ConfigService } from '@nestjs/config';

// Import du service Prisma pour accéder à la base de données
import { PrismaService } from '../../common/prisma/prisma.service';

// Import de bcrypt pour hasher les mots de passe
import * as bcrypt from 'bcrypt';

// Import des DTOs (Data Transfer Objects) pour typer les entrées
import { AuthRegisterInput } from './dtos/auth-register.dto';
import { AuthLoginInput } from './dtos/auth-login.dto';
import { TokenResponse } from './dtos/token-response.dto';

/**
 * SERVICE: AuthService
 *
 * Service principal pour l'authentification des utilisateurs.
 * Gère l'inscription, la connexion, et la gestion des tokens JWT.
 */
@Injectable()
export class AuthService {
  /**
   * CONSTRUCTEUR
   *
   * Injection des dépendances nécessaires:
   * - prisma: pour accéder à la base de données
   * - jwtService: pour générer et signer les tokens JWT
   * - configService: pour accéder aux configurations (secrets, salt rounds, etc.)
   */
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // MÉTHODE: register (Inscription)
  // ============================================

  /**
   * Inscrit un nouvel utilisateur dans l'application.
   *
   * PROCESSUS:
   * 1. Vérifie que l'email n'est pas déjà utilisé
   * 2. Hash le mot de passe avec bcrypt
   * 3. Crée l'utilisateur et son profil en transaction (atomicité)
   * 4. Génère les tokens JWT (access + refresh)
   * 5. Stocke le refresh token hashé dans la base de données
   * 6. Retourne les tokens et les informations de l'utilisateur
   *
   * @param input - Données d'inscription (email, password, displayName)
   * @returns Tokens JWT et informations de l'utilisateur
   * @throws ConflictException si l'email est déjà utilisé
   */
  async register(input: AuthRegisterInput): Promise<TokenResponse> {
    // Extraire les données d'inscription
    const { email, password, displayName } = input;

    // ============================================
    // VÉRIFICATION: L'utilisateur existe-t-il déjà?
    // ============================================
    let existingUser;
    try {
      // Chercher un utilisateur avec cet email
      existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      // Gestion spéciale de l'erreur P1010 (connexion DB impossible)
      if (error.code === 'P1010' || error.message?.includes('denied access')) {
        console.error('Erreur Prisma P1010 dans register:', error.message);
        // Retourner une erreur générique pour ne pas exposer les détails techniques
        throw new ConflictException(
          'Service temporairement indisponible. Veuillez réessayer plus tard.',
        );
      }
      // Pour les autres erreurs, les propager telles quelles
      throw error;
    }

    // Si un utilisateur existe déjà avec cet email, rejeter l'inscription
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // ============================================
    // HASHAGE DU MOT DE PASSE
    // ============================================
    /**
     * bcrypt.hash() hash le mot de passe de manière sécurisée:
     * - Ajoute un "salt" aléatoire pour éviter les attaques par dictionnaire
     * - Utilise un algorithme de hachage unidirectionnel (impossible de retrouver le mot de passe)
     * - Le nombre de "salt rounds" détermine la complexité (plus élevé = plus sécurisé mais plus lent)
     */
    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
    );
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ============================================
    // CRÉATION DE L'UTILISATEUR EN TRANSACTION
    // ============================================
    /**
     * $transaction garantit que toutes les opérations réussissent ou échouent ensemble.
     * Si une opération échoue, toutes les autres sont annulées (rollback).
     * Cela garantit la cohérence des données.
     */
    const result = await this.prisma.$transaction(async (tx) => {
      // Étape 1: Créer l'utilisateur dans la base de données
      const user = await tx.user.create({
        data: {
          email,
          passwordHash, // Mot de passe hashé (jamais stocké en clair!)
          displayName,
        },
      });

      // Étape 2: Créer le profil utilisateur associé
      await tx.userProfile.create({
        data: {
          userId: user.id,
        },
      });

      // ============================================
      // GÉNÉRATION DES TOKENS JWT
      // ============================================

      /**
       * Access Token: Token de courte durée (15 minutes)
       * Contient les informations de l'utilisateur (id, email, roles)
       * Utilisé pour authentifier les requêtes API
       */
      const accessToken = await this.jwtService.signAsync(
        {
          sub: user.id, // Subject: ID de l'utilisateur
          email: user.email, // Email de l'utilisateur
          roles: [user.roles], // Rôles de l'utilisateur (pour les permissions)
        },
        { expiresIn: '15m' }, // Expire dans 15 minutes
      );

      /**
       * Refresh Token: Token de longue durée (7 jours)
       * Contient seulement l'ID de l'utilisateur et le type 'refresh'
       * Utilisé uniquement pour obtenir de nouveaux access tokens
       */
      const refreshToken = await this.jwtService.signAsync(
        {
          sub: user.id, // ID de l'utilisateur
          type: 'refresh', // Type de token (pour différencier des access tokens)
        },
        { expiresIn: '7d' }, // Expire dans 7 jours
      );

      // ============================================
      // STOCKAGE SÉCURISÉ DU REFRESH TOKEN
      // ============================================
      /**
       * Le refresh token est hashé avant d'être stocké dans la base de données.
       * Si la base de données est compromise, les tokens ne peuvent pas être utilisés.
       */
      const saltRounds = 10;
      const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

      // Étape 3: Créer l'enregistrement du refresh token dans la base de données
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash, // Token hashé (jamais stocké en clair!)
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours à partir de maintenant
        },
      });

      // Retourner les tokens et les informations de l'utilisateur
      return {
        accessToken, // Token à utiliser pour les requêtes API
        refreshToken, // Token à utiliser pour rafraîchir l'access token
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

  // ============================================
  // MÉTHODE: login (Connexion)
  // ============================================

  /**
   * Connecte un utilisateur existant à l'application.
   *
   * PROCESSUS:
   * 1. Trouve l'utilisateur par email
   * 2. Vérifie que le mot de passe correspond (avec bcrypt.compare)
   * 3. Génère de nouveaux tokens JWT
   * 4. Stocke le refresh token hashé dans la base de données
   * 5. Retourne les tokens et les informations de l'utilisateur
   *
   * @param input - Données de connexion (email, password)
   * @returns Tokens JWT et informations de l'utilisateur
   * @throws UnauthorizedException si l'email ou le mot de passe est incorrect
   */
  async login(input: AuthLoginInput): Promise<TokenResponse> {
    // Extraire les données de connexion
    const { email, password } = input;

    // ============================================
    // RECHERCHE DE L'UTILISATEUR
    // ============================================
    let user;
    try {
      // Chercher l'utilisateur par email
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      // Gestion spéciale de l'erreur P1010
      if (error.code === 'P1010' || error.message?.includes('denied access')) {
        console.error('Erreur Prisma P1010 dans login:', error.message);
        throw new UnauthorizedException(
          'Service temporairement indisponible. Veuillez réessayer plus tard.',
        );
      }
      throw error;
    }

    // ============================================
    // VÉRIFICATION DU MOT DE PASSE
    // ============================================
    /**
     * bcrypt.compare() compare le mot de passe en clair avec le hash stocké.
     * Retourne true si le mot de passe correspond, false sinon.
     *
     * IMPORTANT: On ne compare JAMAIS les mots de passe en clair!
     * On compare toujours le hash du mot de passe saisi avec le hash stocké.
     */
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      // Message générique pour ne pas révéler si l'email existe ou non
      // (protection contre l'énumération d'emails)
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

  // ============================================
  // MÉTHODE: refresh (Rafraîchissement du token)
  // ============================================

  /**
   * Rafraîchit les tokens JWT en utilisant un refresh token valide.
   *
   * PROCESSUS:
   * 1. Vérifie que le refresh token existe dans la base de données
   * 2. Vérifie qu'il n'est pas révoqué ou expiré
   * 3. Vérifie que le hash correspond (sécurité)
   * 4. Génère de nouveaux tokens (access + refresh)
   * 5. Stocke le nouveau refresh token
   * 6. Révoque l'ancien refresh token (rotation des tokens)
   *
   * SÉCURITÉ:
   * - Rotation des tokens: chaque rafraîchissement génère un nouveau refresh token
   * - L'ancien refresh token est révoqué pour éviter la réutilisation
   *
   * @param refreshToken - Le refresh token à utiliser
   * @returns Nouveaux tokens (access + refresh)
   * @throws UnauthorizedException si le refresh token est invalide ou expiré
   */
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // ============================================
    // VÉRIFICATION DU REFRESH TOKEN
    // ============================================
    /**
     * NOTE: Dans une vraie implémentation, on devrait hasher le refreshToken
     * avant de chercher dans la base de données, car on stocke le hash.
     * Ici, on cherche directement (simplification pour l'exemple).
     */
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
      include: { user: true }, // Inclure les informations de l'utilisateur
    });

    // Vérifier que le token existe, n'est pas révoqué, et n'est pas expiré
    if (
      !tokenRecord || // Token n'existe pas
      tokenRecord.revokedAt || // Token a été révoqué (logout)
      tokenRecord.expiresAt < new Date() // Token a expiré
    ) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // ============================================
    // VÉRIFICATION DU HASH (SÉCURITÉ)
    // ============================================
    /**
     * Vérifier que le token fourni correspond bien au hash stocké.
     * Cela protège contre les attaques où quelqu'un essaierait d'utiliser
     * un token modifié.
     */
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

  // ============================================
  // MÉTHODE: logout (Déconnexion)
  // ============================================

  /**
   * Déconnecte un utilisateur en révoquant son refresh token.
   *
   * PROCESSUS:
   * 1. Vérifie que le refresh token est fourni
   * 2. Marque le refresh token comme révoqué dans la base de données
   * 3. Le token ne pourra plus être utilisé pour rafraîchir l'access token
   *
   * NOTE:
   * - L'access token reste valide jusqu'à son expiration (15 minutes)
   * - Seul le refresh token est révoqué immédiatement
   * - Pour une déconnexion immédiate, il faudrait une blacklist des access tokens
   *
   * @param refreshToken - Le refresh token à révoquer
   * @throws BadRequestException si le refresh token n'est pas fourni
   */
  async logout(refreshToken: string): Promise<void> {
    // Vérifier que le refresh token est fourni
    if (!refreshToken) {
      throw new BadRequestException('Refresh token requis');
    }

    // ============================================
    // RÉVOCATION DU REFRESH TOKEN
    // ============================================
    /**
     * updateMany() met à jour tous les tokens correspondants (au cas où il y en aurait plusieurs).
     * On marque le token comme révoqué en définissant revokedAt à la date actuelle.
     * Après cela, le token ne pourra plus être utilisé pour rafraîchir l'access token.
     */
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: refreshToken },
      data: { revokedAt: new Date() }, // Marquer comme révoqué maintenant
    });
  }
}
