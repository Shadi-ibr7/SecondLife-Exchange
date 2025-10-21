import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ThreadsService } from './threads.service';
import {
  CreateThreadDto,
  ListThreadsDto,
  ThreadResponse,
  PaginatedThreadsResponse,
} from './dtos/threads.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@ApiTags('Community - Threads')
@Controller('threads')
@UseInterceptors(LoggingInterceptor)
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les threads de discussion',
    description: 'Retourne une liste paginée de threads avec filtres',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['THEME', 'CATEGORY', 'ITEM', 'GENERAL'],
    description: 'Scope du thread',
  })
  @ApiQuery({
    name: 'ref',
    required: false,
    type: String,
    description: 'Référence du scope (themeId, category, itemId)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Recherche textuelle',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des threads',
  })
  async listThreads(
    @Query() query: ListThreadsDto,
  ): Promise<PaginatedThreadsResponse> {
    return this.threadsService.listThreads(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un thread par ID',
    description: "Retourne les détails d'un thread",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du thread',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Thread non trouvé',
  })
  async getThreadById(@Param('id') id: string): Promise<ThreadResponse> {
    return this.threadsService.getThreadById(id);
  }

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau thread',
    description: 'Crée un nouveau thread de discussion avec le premier post',
  })
  @ApiResponse({
    status: 201,
    description: 'Thread créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async createThread(
    @Request() req: any,
    @Body() createThreadDto: CreateThreadDto,
  ): Promise<ThreadResponse> {
    return this.threadsService.createThread(req.user.id, createThreadDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un thread',
    description: 'Supprime un thread (auteur ou admin uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du thread',
  })
  @ApiResponse({
    status: 204,
    description: 'Thread supprimé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé',
  })
  @ApiResponse({
    status: 404,
    description: 'Thread non trouvé',
  })
  async deleteThread(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.threadsService.deleteThread(id, req.user.id, req.user.roles);
  }
}

