/**
 * FICHIER: admin-query.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour les paramètres de requête (query params) des endpoints admin.
 * Tous les query params sont validés pour éviter les payloads malformés.
 *
 * SÉCURITÉ:
 * - Validation stricte des types
 * - Limites de pagination pour éviter les surcharges
 * - Transformation automatique des strings en numbers
 */

import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

// ============================================
// DTOs pour les utilisateurs
// ============================================

/**
 * DTO: AdminGetUsersQueryDto
 *
 * Paramètres de requête pour GET /admin/users
 */
export class AdminGetUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

// ============================================
// DTOs pour les items
// ============================================

/**
 * DTO: AdminGetItemsQueryDto
 *
 * Paramètres de requête pour GET /admin/items
 */
export class AdminGetItemsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

// ============================================
// DTOs pour les reports
// ============================================

/**
 * DTO: AdminGetReportsQueryDto
 *
 * Paramètres de requête pour GET /admin/reports
 */
export class AdminGetReportsQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  resolved?: boolean;
}

// ============================================
// DTOs pour les suggestions de thèmes
// ============================================

/**
 * DTO: AdminGetThemeSuggestionsQueryDto
 *
 * Paramètres de requête pour GET /admin/themes/:id/suggestions
 */
export class AdminGetThemeSuggestionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sort?: string;
}

// ============================================
// DTOs pour le contenu éco
// ============================================

/**
 * DTO: AdminGetEcoContentQueryDto
 *
 * Paramètres de requête pour GET /admin/eco
 */
export class AdminGetEcoContentQueryDto extends PaginationDto {}

// ============================================
// DTOs pour les échanges
// ============================================

/**
 * DTO: AdminGetExchangesQueryDto
 *
 * Paramètres de requête pour GET /admin/exchanges
 */
export class AdminGetExchangesQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  requesterId?: string;

  @IsOptional()
  @IsString()
  responderId?: string;
}

// ============================================
// DTOs pour les threads communautaires
// ============================================

/**
 * DTO: AdminGetThreadsQueryDto
 *
 * Paramètres de requête pour GET /admin/community/threads
 */
export class AdminGetThreadsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  scope?: string;
}

// ============================================
// DTOs pour les posts communautaires
// ============================================

/**
 * DTO: AdminGetPostsQueryDto
 *
 * Paramètres de requête pour GET /admin/community/posts
 */
export class AdminGetPostsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  authorId?: string;
}

// ============================================
// DTOs pour les analytics
// ============================================

/**
 * DTO: AdminGetAnalyticsQueryDto
 *
 * Paramètres de requête pour GET /admin/analytics/overview
 */
export class AdminGetAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

// ============================================
// DTOs pour les logs
// ============================================

/**
 * DTO: AdminGetLogsQueryDto
 *
 * Paramètres de requête pour GET /admin/logs
 */
export class AdminGetLogsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  adminId?: string;
}
