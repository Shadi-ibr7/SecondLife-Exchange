/**
 * FICHIER: modules/exchanges/exchanges.controller.ts
 *
 * OBJECTIF:
 * Définir les endpoints REST liés aux échanges d'objets entre utilisateurs.
 * Chaque route applique les guards nécessaires (JWT, logging) puis délègue
 * la logique métier au `ExchangesService`.
 *
 * ROUTES EXPOSÉES:
 * - POST  /api/v1/exchanges            → créer un nouvel échange
 * - GET   /api/v1/exchanges/me         → lister les échanges du user courant
 * - GET   /api/v1/exchanges/:id        → afficher les détails d'un échange + messages
 * - PATCH /api/v1/exchanges/:id/status → mettre à jour le statut (accept, decline…)
 * - POST  /api/v1/exchanges/:id/messages → (géré côté gateway ou extension future)
 *
 * SÉCURITÉ:
 * - `@UseGuards(JwtAccessGuard)` appliqué globalement -> token JWT obligatoire
 * - `@UseInterceptors(LoggingInterceptor)` pour tracer chaque requête
 * - L’ID utilisateur est injecté via `req.user` (payload du JWT)
 *
 * STYLE: commentaires détaillés pour aider un étudiant à comprendre chaque couche.
 */

// Import des décorateurs NestJS
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// Import du service
import { ExchangesService } from './exchanges.service';

// Import des DTOs
import { CreateExchangeDto } from './dtos/create-exchange.dto';
import { UpdateExchangeStatusDto } from './dtos/update-exchange-status.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

// Import des guards et intercepteurs
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * CONTRÔLEUR: ExchangesController
 *
 * - `@Controller('exchanges')` → toutes les routes sont préfixées par `/api/v1/exchanges`
 * - `@UseGuards(JwtAccessGuard)` → token JWT obligatoire pour accéder aux échanges
 * - `@UseInterceptors(LoggingInterceptor)` → chaque requête est loggée pour audit
 */
@ApiTags('Exchanges')
@Controller('exchanges')
@UseGuards(JwtAccessGuard) // Protection globale: toutes les routes nécessitent un token JWT
@UseInterceptors(LoggingInterceptor) // Logger toutes les requêtes
@ApiBearerAuth()
export class ExchangesController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service d'échanges
   */
  constructor(private exchangesService: ExchangesService) {}

  /**
   * POST /api/v1/exchanges
   *
   * Crée une nouvelle proposition d'échange. Le `requesterId` est injecté via `req.user.id`
   * (payload du JWT). Le DTO contient l'identifiant du répondant et les informations textuelles.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une proposition d’échange' })
  @ApiResponse({ status: 201, description: 'Échange créé' })
  async createExchange(
    @Request() req,
    @Body() createExchangeDto: CreateExchangeDto,
  ) {
    return this.exchangesService.createExchange(req.user.id, createExchangeDto);
  }

  /**
   * GET /api/v1/exchanges/me
   *
   * Retourne la liste paginée des échanges où l’utilisateur courant est impliqué.
   * Les paramètres `page`, `limit`, `sort` proviennent de `PaginationDto`; `status` est optionnel.
   */
  @Get('me')
  @ApiOperation({ summary: 'Lister mes échanges' })
  @ApiResponse({ status: 200, description: 'Liste paginée' })
  async getMyExchanges(
    @Request() req,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.exchangesService.getMyExchanges(
      req.user.id,
      paginationDto,
      status,
    );
  }

  /**
   * GET /api/v1/exchanges/:id
   *
   * Récupère un échange complet (participants + messages). Le service vérifiera
   * que l’utilisateur fait bien partie des participants.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Consulter un échange' })
  @ApiResponse({
    status: 200,
    description: 'Échange avec participants/messages',
  })
  async getExchangeById(@Request() req, @Param('id') id: string) {
    return this.exchangesService.getExchangeById(id, req.user.id);
  }

  /**
   * PATCH /api/v1/exchanges/:id/status
   *
   * Permet au requester ou au responder de modifier le statut (ACCEPTED, DECLINED, COMPLETED...).
   * `UpdateExchangeStatusDto` contient uniquement la nouvelle valeur de statut.
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d’un échange' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  async updateExchangeStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateExchangeStatusDto: UpdateExchangeStatusDto,
  ) {
    return this.exchangesService.updateExchangeStatus(
      id,
      req.user.id,
      updateExchangeStatusDto,
    );
  }
}
