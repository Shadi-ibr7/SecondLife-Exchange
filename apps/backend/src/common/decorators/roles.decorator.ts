/**
 * FICHIER: roles.decorator.ts
 *
 * DESCRIPTION:
 * Décorateur pour définir les rôles requis pour accéder à une route.
 * Utilisé avec RolesGuard pour implémenter le RBAC (Role Based Access Control).
 *
 * UTILISATION:
 * @Roles(UserRole.ADMIN)
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 *
 * EXEMPLE:
 * @UseGuards(JwtAccessGuard, RolesGuard)
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 * @Get('sensitive-data')
 * getSensitiveData() { ... }
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Clé de métadonnée pour stocker les rôles requis.
 * Utilisée par RolesGuard pour récupérer les rôles depuis les métadonnées.
 */
export const ROLES_KEY = 'roles';

/**
 * DÉCORATEUR: Roles
 *
 * Définit les rôles autorisés à accéder à une route.
 * Un utilisateur doit avoir AU MOINS UN des rôles spécifiés.
 *
 * @param roles - Liste des rôles autorisés (UserRole enum)
 * @returns Décorateur de métadonnées
 *
 * @example
 * // Route accessible uniquement aux ADMIN
 * @Roles(UserRole.ADMIN)
 *
 * @example
 * // Route accessible aux ADMIN et MODERATOR
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
