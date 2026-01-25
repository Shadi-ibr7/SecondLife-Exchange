/**
 * FICHIER: list-exchanges-query.dto.ts
 *
 * DESCRIPTION:
 * DTO pour les query params de l'endpoint GET /exchanges/me.
 * Étend PaginationDto avec les filtres spécifiques aux échanges.
 *
 * PARAMÈTRES:
 * - page, limit, sort: hérités de PaginationDto
 * - status: filtre par statut (PENDING, ACCEPTED, etc.)
 * - type: filtre par rôle (sent, received, all)
 */

import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

/**
 * Valeurs autorisées pour le paramètre type
 * - sent: échanges initiés par l'utilisateur
 * - received: échanges reçus par l'utilisateur
 * - all: tous les échanges (comportement par défaut)
 */
const EXCHANGE_TYPES = ['sent', 'received', 'all'] as const;
type ExchangeType = (typeof EXCHANGE_TYPES)[number];

/**
 * Valeurs autorisées pour le paramètre status
 */
const EXCHANGE_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'COMPLETED',
  'CANCELLED',
] as const;
type ExchangeStatus = (typeof EXCHANGE_STATUSES)[number];

/**
 * DTO: ListExchangesQueryDto
 *
 * Valide les query params pour la liste des échanges.
 * Hérite de PaginationDto (page, limit, sort).
 */
export class ListExchangesQueryDto extends PaginationDto {
  /**
   * PROPRIÉTÉ: status
   *
   * Filtre les échanges par statut.
   * Valeurs autorisées: PENDING, ACCEPTED, DECLINED, COMPLETED, CANCELLED
   *
   * @IsOptional(): Paramètre optionnel
   * @IsString(): Doit être une chaîne
   * @IsIn(): Doit être une des valeurs autorisées
   */
  @IsOptional()
  @IsString()
  @IsIn(EXCHANGE_STATUSES, {
    message: `status doit être l'une des valeurs: ${EXCHANGE_STATUSES.join(', ')}`,
  })
  status?: ExchangeStatus;

  /**
   * PROPRIÉTÉ: type
   *
   * Filtre les échanges par rôle de l'utilisateur.
   * - sent: échanges où l'utilisateur est requester (proposeur)
   * - received: échanges où l'utilisateur est responder (receveur)
   * - all: tous les échanges (défaut si non spécifié)
   *
   * @IsOptional(): Paramètre optionnel (défaut: all)
   * @IsString(): Doit être une chaîne
   * @IsIn(): Doit être 'sent', 'received', ou 'all'
   */
  @IsOptional()
  @IsString()
  @IsIn(EXCHANGE_TYPES, {
    message: `type doit être l'une des valeurs: ${EXCHANGE_TYPES.join(', ')}`,
  })
  type?: ExchangeType;
}
