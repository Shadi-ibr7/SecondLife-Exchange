/**
 * FICHIER: exchanges.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour la gestion des échanges d'objets.
 * Toutes les routes nécessitent une authentification JWT.
 *
 * ROUTES:
 * - POST /api/v1/exchanges - Créer une proposition d'échange
 * - GET /api/v1/exchanges/me - Mes échanges (avec pagination et filtres)
 * - GET /api/v1/exchanges/:id - Récupérer un échange par ID (avec messages)
 * - PATCH /api/v1/exchanges/:id/status - Mettre à jour le statut d'un échange
 *
 * SÉCURITÉ:
 * - Toutes les routes sont protégées par JwtAccessGuard
 * - Seuls les participants peuvent voir/modifier un échange
 * - L'ID de l'utilisateur est extrait automatiquement du token JWT
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
 * Toutes les routes de ce contrôleur nécessitent une authentification JWT.
 * Le préfixe 'exchanges' signifie que les routes commencent par /api/v1/exchanges
 */
@Controller('exchanges')
@UseGuards(JwtAccessGuard) // Protection globale: toutes les routes nécessitent un token JWT
@UseInterceptors(LoggingInterceptor) // Logger toutes les requêtes
export class ExchangesController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service d'échanges
   */
  constructor(private exchangesService: ExchangesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExchange(
    @Request() req,
    @Body() createExchangeDto: CreateExchangeDto,
  ) {
    return this.exchangesService.createExchange(req.user.id, createExchangeDto);
  }

  @Get('me')
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

  @Get(':id')
  async getExchangeById(@Request() req, @Param('id') id: string) {
    return this.exchangesService.getExchangeById(id, req.user.id);
  }

  @Patch(':id/status')
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
