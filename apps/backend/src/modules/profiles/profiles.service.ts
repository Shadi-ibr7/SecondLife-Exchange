/**
 * FICHIER: profiles.service.ts
 *
 * DESCRIPTION:
 * Ce service gère la logique métier pour les profils utilisateurs.
 * Il permet de récupérer, mettre à jour et supprimer les profils.
 *
 * FONCTIONNALITÉS:
 * - Récupérer le profil d'un utilisateur
 * - Mettre à jour le profil (bio, location, préférences)
 * - Supprimer le profil
 *
 * NOTE:
 * Ce service est utilisé par UsersService pour gérer les profils.
 * Il peut aussi être utilisé directement par d'autres modules si nécessaire.
 */

// Import des décorateurs NestJS
import { Injectable } from '@nestjs/common';

// Import du service Prisma
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * SERVICE: ProfilesService
 *
 * Service pour la gestion des profils utilisateurs.
 */
@Injectable()
export class ProfilesService {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service Prisma
   */
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MÉTHODE: getProfile (Récupérer un profil)
  // ============================================

  /**
   * Récupère le profil d'un utilisateur.
   *
   * @param userId - ID de l'utilisateur
   * @returns Profil utilisateur (bio, location, préférences) ou null si inexistant
   */
  async getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  // ============================================
  // MÉTHODE: updateProfile (Mettre à jour un profil)
  // ============================================

  /**
   * Met à jour ou crée le profil d'un utilisateur.
   *
   * FONCTIONNEMENT:
   * - upsert() crée le profil s'il n'existe pas, sinon le met à jour
   * - Seules les propriétés fournies sont mises à jour (mise à jour partielle)
   *
   * @param userId - ID de l'utilisateur
   * @param data - Données à mettre à jour (bio, location, preferencesJson)
   * @returns Profil mis à jour ou créé
   */
  async updateProfile(
    userId: string,
    data: {
      bio?: string | null;
      location?: string | null;
      preferencesJson?: Record<string, any> | null;
    },
  ) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: data, // Mettre à jour si existe
      create: {
        userId,
        ...data, // Créer si n'existe pas
      },
    });
  }

  // ============================================
  // MÉTHODE: deleteProfile (Supprimer un profil)
  // ============================================

  /**
   * Supprime le profil d'un utilisateur.
   *
   * @param userId - ID de l'utilisateur
   * @returns Profil supprimé
   */
  async deleteProfile(userId: string) {
    return this.prisma.userProfile.delete({
      where: { userId },
    });
  }
}
