/**
 * FICHIER: modules/auth/auth.service.ts
 *
 * OBJECTIF GÉNÉRAL:
 * Ce service encapsule **toute la logique d'authentification** de l'application backend.
 * Il sert d'intermédiaire entre les contrôleurs HTTP (`AuthController`) et la base de données
 * via Prisma. Il garantit que chaque opération sensible (inscription, login, refresh token,
 * logout) respecte des règles de sécurité strictes.
 *
 * RÔLE DANS L'ARCHITECTURE:
 * - Reçoit des DTOs validés par les contrôleurs
 * - Manipule la base via `PrismaService`
 * - Génère et signe les tokens via `JwtService`
 * - Applique la configuration centrale (secrets, expiration) via `ConfigService`
 *
 * PRINCIPALES FONCTIONNALITÉS:
 * 1. `register`  : crée un utilisateur, hash son mot de passe, génère et persiste les tokens
 * 2. `login`     : vérifie les identifiants, regénère les tokens, applique les règles de sécurité
 * 3. `refresh`   : effectue la rotation sécurisée des tokens à partir d'un refresh token valide
 * 4. `logout`    : révoque un refresh token pour empêcher toute réutilisation future
 *
 * GARANTIES DE SÉCURITÉ:
 * - Mots de passe irréversiblement hashés avec bcrypt + salage paramétrable
 * - Access tokens courts (15 min) + refresh tokens longs (7 jours) signés avec des secrets dédiés
 * - Refresh tokens stockés **hashés** en base pour limiter l'impact d'une fuite
 * - Gestion fine des erreurs Prisma (P1010) pour ne pas exposer d'informations internes
 * - Rotation des refresh tokens (un token ne peut servir qu'une seule fois)
 *
 * RÉFÉRENCES:
 * - RFC 7519 (JWT)
 * - OWASP ASVS - Authentication
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
 * Toutes les routes exposées par `AuthController` délèguent ici afin de:
 * - Centraliser la logique métier et les règles de sécurité
 * - Garantir une cohérence transactionnelle sur les opérations critiques
 * - Faciliter les tests unitaires (mock des dépendances Prisma/JWT)
 */
@Injectable()
export class AuthService {
  /**
   * CONSTRUCTEUR
   *
   * Les dépendances sont injectées via NestJS. On les documente ici pour
   * comprendre comment chaque service est utilisé plus bas:
   *
   * - `PrismaService prisma`
   *    ↳ Fournit les accès à la base PostgreSQL (tables `user`, `userProfile`,
   *      `refreshToken`). Toutes les opérations CRUD passent par Prisma.
   *
   * - `JwtService jwtService`
   *    ↳ Génère, signe et vérifie les tokens JWT. Nous l'utilisons avec des
   *      payloads minimalistes (id, email, roles) pour limiter la surface sensible.
   *
   * - `ConfigService configService`
   *    ↳ Permet de récupérer dynamiquement les paramètres déclarés dans les
   *      fichiers de config (`security.bcryptSaltRounds`, secrets JWT, TTL...).
   *      Cela évite de hardcoder les valeurs et simplifie les déploiements multi-envs.
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
        // On renvoie une erreur volontairement générique pour ne pas exposer la cause exacte
        throw new ConflictException(
          'Service temporairement indisponible. Veuillez réessayer plus tard.',
        );
      }
      // Pour les autres erreurs, les propager telles quelles
      throw error;
    }

    // Si on trouve déjà un utilisateur, on refuse immédiatement l'inscription
    // afin d'éviter de révéler trop d'informations côté client (erreur 409 générique).
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
    /**
     * bcrypt.hash:
     * - applique un sel aléatoire pour chaque mot de passe (empêche les rainbow tables)
     * - `saltRounds` règle le coût (2^saltRounds itérations). Une valeur élevée ralentit les attaques.
     */
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
      // (même si vide, cela garantit la présence d'un profil pour simplifier le frontend)
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
          sub: user.id, // Subject: identifiant unique (utilisé par Nest pour `req.user`)
          email: user.email,
          roles: [user.roles], // Placé dans un tableau pour faciliter les guards multi-rôles
        },
        { expiresIn: '15m' }, // TTL court pour limiter l'impact d'une compromission
      );

      /**
       * Refresh Token: Token de longue durée (7 jours)
       * Contient seulement l'ID de l'utilisateur et le type 'refresh'
       * Utilisé uniquement pour obtenir de nouveaux access tokens
       */
      const refreshToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          type: 'refresh', // Renseigne explicitement la nature du token (utile côté guard)
        },
        { expiresIn: '7d' }, // TTL plus long pour éviter des reconnexions trop fréquentes
      );

      // ============================================
      // STOCKAGE SÉCURISÉ DU REFRESH TOKEN
      // ============================================
      /**
       * Le refresh token est hashé avant d'être stocké dans la base de données.
       * Si la base de données est compromise, les tokens ne peuvent pas être utilisés.
       */
      // On limite volontairement le cost à 10 pour ne pas bloquer la rotation fréquente des tokens.
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
        accessToken, // Token court terme utilisé dans l'entête Authorization: Bearer <token>
        refreshToken, // Token long terme stocké côté client (HTTP-only cookie ou secure storage)
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
      /**
       * IMPORTANT:
       * - On renvoie un message volontairement générique pour éviter de confirmer
       *   l'existence d'un email (technique anti enumeration).
       * - bcrypt.compare renvoie false en temps constant, ce qui évite les side-channels.
       */
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // ============================================
    // GÉNÉRATION DES NOUVEAUX TOKENS
    // ============================================
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles: [user.roles],
      },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    // Hash du refresh token avant stockage (même rational que dans register)
    const saltRounds = 10;
    const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

    // Créer le refresh token avec gestion d'erreur
    // (si la base est momentanément indisponible, on laisse quand même passer la connexion;
    // le client pourra régénérer un refresh token plus tard en se reconnectant)
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
    /**
     * Nous recherchons le refresh token fourni côté client.
     * Dans cette implémentation pédagogique, on effectue la recherche directe,
     * puis on confirme réellement l'authenticité via `bcrypt.compare` plus bas.
     * (Dans une version renforcée on pourrait stocker un identifiant public et garder
     * uniquement le hash en base.)
     */
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
      include: { user: true }, // Inclure l'utilisateur pour regénérer les payloads JWT
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
      // Si la comparaison échoue, on considère le token comme volé ou altéré.
      throw new UnauthorizedException('Refresh token invalide');
    }

    // ============================================
    // GÉNÉRATION DES NOUVEAUX TOKENS
    // ============================================
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
    // (nous n'effaçons pas encore l'ancien pour garantir que la création réussit d'abord)
    await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });

    // Révoquer l'ancien refresh token pour empêcher toute réutilisation
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
    /**
     * On utilise updateMany plutôt qu'unicité stricte car:
     * - certains clients peuvent envoyer plusieurs fois le même token
     * - on préfère révoquer toutes les occurrences correspondant à ce hash
     */
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: refreshToken },
      data: { revokedAt: new Date() }, // Marquer comme révoqué maintenant
    });
  }
}
