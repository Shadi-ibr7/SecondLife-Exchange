/**
 * FICHIER: modules/users/users.service.ts
 *
 * OBJECTIF:
 * Fournir toutes les opérations métier liées aux utilisateurs authentifiés côté backend.
 * Il sert d’interface entre les contrôleurs REST (ex: `/users/me`) et la base de données Prisma.
 *
 * RESPONSABILITÉS:
 * 1. `getMe`    → récupérer les informations complètes d’un utilisateur (profil inclus)
 * 2. `updateMe` → mettre à jour les informations personnelles + profil dans une transaction
 * 3. `deleteMe` → effectuer une suppression en cascade (tokens, profil, utilisateur)
 *
 * SÉCURITÉ ET CONTRAINTES:
 * - Toutes les méthodes prennent un `userId` provenant du token JWT → impossible d’accéder
 *   ou de modifier un autre utilisateur.
 * - Les transactions Prisma (`$transaction`) garantissent que les données restent cohérentes
 *   même en cas d’erreur en cours de route.
 * - La suppression supprime également les refresh tokens pour empêcher toute reconnexion future.
 *
 * STYLE:
 * Commentaires détaillés (façon `MessageBubble.tsx`) pour expliquer la logique, les raisons
 * des choix techniques, et les implications côté base de données.
 */

// Import des exceptions NestJS
import { Injectable, NotFoundException } from '@nestjs/common';

// Import du service Prisma pour accéder à la base de données
import { PrismaService } from '../../common/prisma/prisma.service';

// Import du DTO pour la mise à jour du profil
import { UpdateProfileInput } from './dtos/update-profile.dto';

/**
 * SERVICE: UsersService
 *
 * Service pour gérer les opérations sur les utilisateurs.
 */
@Injectable()
export class UsersService {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service Prisma
   */
  constructor(private prisma: PrismaService) {
    // PrismaService centralise les accès DB (user, userProfile, refreshToken, etc.)
    // Pas d'autres dépendances ici ⇒ service facilement testable
  }

  // ============================================
  // MÉTHODE: getMe (Récupérer mes informations)
  // ============================================

  /**
   * Récupère les informations de l'utilisateur connecté.
   *
   * @param userId - ID de l'utilisateur connecté (depuis le token JWT)
   * @returns Informations de l'utilisateur avec son profil
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  async getMe(userId: string) {
    // Chercher l'utilisateur avec son profil associé
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true, // On inclut le profil pour éviter de faire deux requêtes côté contrôleur
      },
    });

    // Vérifier que l'utilisateur existe
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Retourner les informations formatées
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roles: [user.roles], // Converti en tableau pour être cohérent avec la couche frontend
      createdAt: user.createdAt,
      profile: user.profile, // Profil avec bio, location, préférences
    };
  }

  // ============================================
  // MÉTHODE: updateMe (Mettre à jour mon profil)
  // ============================================

  /**
   * Met à jour les informations de l'utilisateur connecté.
   *
   * @param userId - ID de l'utilisateur connecté
   * @param input - Données à mettre à jour (displayName, avatarUrl, bio, location, preferencesJson)
   * @returns Informations mises à jour de l'utilisateur avec son profil
   *
   * NOTE:
   * - Utilise une transaction pour garantir la cohérence des données
   * - upsert() crée le profil s'il n'existe pas, sinon le met à jour
   * - Seules les propriétés fournies sont mises à jour (mise à jour partielle)
   */
  async updateMe(userId: string, input: UpdateProfileInput) {
    // Extraire les données à mettre à jour
    const { displayName, avatarUrl, bio, location, preferencesJson } = input;

    // Transaction = garantit que user + userProfile restent synchronisés (tout passe ou rien)
    return this.prisma.$transaction(async (tx) => {
      // ============================================
      // MISE À JOUR DE L'UTILISATEUR
      // ============================================
      /**
       * Mettre à jour les champs de la table User.
       * Le spread operator (...) permet de n'inclure que les propriétés définies.
       *
       * displayName: mis à jour seulement si fourni
       * avatarUrl: mis à jour même si null (pour permettre la suppression de l'avatar)
       */
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(displayName && { displayName }), // Mettre à jour seulement si défini
          ...(avatarUrl !== undefined && { avatarUrl }), // Permet de mettre null
        },
        select: {
          // Sélectionner uniquement les champs nécessaires
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          roles: true,
          createdAt: true,
        },
      });

      // ============================================
      // MISE À JOUR DU PROFIL
      // ============================================
      /**
       * upsert() = update or insert
       * - Si le profil existe: le met à jour
       * - Si le profil n'existe pas: le crée
       *
       * Cela garantit qu'un utilisateur a toujours un profil.
       */
      await tx.userProfile.upsert({
        where: { userId },
        update: {
          // Mettre à jour seulement les champs fournis
          ...(bio !== undefined && { bio }),
          ...(location !== undefined && { location }),
          ...(preferencesJson !== undefined && { preferencesJson }),
        },
        create: {
          // Créer le profil s'il n'existe pas
          userId,
          bio,
          location,
          preferencesJson,
        },
      });

      // ============================================
      // RÉCUPÉRATION DU PROFIL MIS À JOUR
      // ============================================
      // Récupérer le profil complet après la mise à jour
      const profile = await tx.userProfile.findUnique({
        where: { userId },
      });

      // Retourner les informations complètes
      return {
        ...user,
        roles: [user.roles], // Convertir en tableau
        profile, // Profil mis à jour
      };
    });
  }

  // ============================================
  // MÉTHODE: deleteMe (Supprimer mon compte)
  // ============================================

  /**
   * Supprime le compte de l'utilisateur connecté.
   *
   * PROCESSUS DE SUPPRESSION EN CASCADE:
   * 1. Supprime tous les refresh tokens de l'utilisateur
   * 2. Supprime le profil utilisateur
   * 3. Supprime l'utilisateur lui-même
   *
   * IMPORTANT:
   * - Utilise une transaction pour garantir que tout est supprimé ou rien
   * - L'ordre de suppression est important (dépendances d'abord)
   * - Les items, échanges, etc. peuvent être gérés séparément selon les besoins
   *
   * @param userId - ID de l'utilisateur à supprimer
   */
  async deleteMe(userId: string) {
    // Suppression en cascade : RefreshToken + UserProfile + User
    // Transaction obligatoire pour éviter de laisser des données orphelines en cas d'erreur
    await this.prisma.$transaction(async (tx) => {
      // ============================================
      // ÉTAPE 1: Supprimer les refresh tokens
      // ============================================
      /**
       * Supprimer tous les refresh tokens de l'utilisateur.
       * Cela empêche l'utilisateur de se reconnecter avec d'anciens tokens.
       */
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // ============================================
      // ÉTAPE 2: Supprimer le profil
      // ============================================
      /**
       * Supprimer le profil utilisateur.
       * deleteMany() est utilisé car il peut y avoir plusieurs profils
       * (bien que normalement il n'y en ait qu'un).
       */
      await tx.userProfile.deleteMany({
        where: { userId },
      });

      // ============================================
      // ÉTAPE 3: Supprimer l'utilisateur
      // ============================================
      /**
       * Supprimer l'utilisateur lui-même.
       * Cette opération supprime aussi automatiquement:
       * - Les items créés par l'utilisateur (si cascade configurée)
       * - Les échanges où l'utilisateur est participant
       * - Les messages de chat
       * - Etc. (selon la configuration Prisma)
       */
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
