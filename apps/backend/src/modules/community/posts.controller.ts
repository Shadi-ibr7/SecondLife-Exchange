import {
  Controller,
  Get,
  Post,
  Patch,
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
import { PostsService } from './posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  ListPostsDto,
  PostResponse,
  PaginatedPostsResponse,
} from './dtos/posts.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@ApiTags('Community - Posts')
@Controller('threads/:threadId/posts')
@UseInterceptors(LoggingInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: "Lister les posts d'un thread",
    description: "Retourne une liste paginée des posts d'un thread",
  })
  @ApiParam({
    name: 'threadId',
    description: 'ID du thread',
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
    description: 'Liste des posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Thread non trouvé',
  })
  async listPosts(
    @Param('threadId') threadId: string,
    @Query() query: ListPostsDto,
  ): Promise<PaginatedPostsResponse> {
    return this.postsService.listPosts(threadId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un post par ID',
    description: "Retourne les détails d'un post",
  })
  @ApiParam({
    name: 'threadId',
    description: 'ID du thread',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du post',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du post',
  })
  @ApiResponse({
    status: 404,
    description: 'Post non trouvé',
  })
  async getPostById(
    @Param('threadId') threadId: string,
    @Param('id') id: string,
  ): Promise<PostResponse> {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau post',
    description: 'Crée un nouveau post dans un thread',
  })
  @ApiParam({
    name: 'threadId',
    description: 'ID du thread',
  })
  @ApiResponse({
    status: 201,
    description: 'Post créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 404,
    description: 'Thread non trouvé',
  })
  async createPost(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponse> {
    return this.postsService.createPost(threadId, req.user.id, createPostDto);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Modifier un post',
    description: 'Met à jour un post (auteur ou admin uniquement)',
  })
  @ApiParam({
    name: 'threadId',
    description: 'ID du thread',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du post',
  })
  @ApiResponse({
    status: 200,
    description: 'Post mis à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
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
    description: 'Post non trouvé',
  })
  async updatePost(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponse> {
    return this.postsService.updatePost(
      id,
      req.user.id,
      req.user.roles,
      updatePostDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un post',
    description: 'Supprime un post (auteur ou admin uniquement)',
  })
  @ApiParam({
    name: 'threadId',
    description: 'ID du thread',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du post',
  })
  @ApiResponse({
    status: 204,
    description: 'Post supprimé avec succès',
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
    description: 'Post non trouvé',
  })
  async deletePost(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.postsService.deletePost(id, req.user.id, req.user.roles);
  }
}

