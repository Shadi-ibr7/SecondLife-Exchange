import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WeeklyCronService } from './weekly-cron.service';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

@ApiTags('AI')
@Controller('api/v1/ai')
export class AiController {
  constructor(private readonly weeklyCronService: WeeklyCronService) {}

  @Post('themes/:id/generate')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déclencher manuellement la génération de suggestions (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Génération déclenchée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async generateSuggestions(
    @Param('id') themeId: string,
    @Body() body?: { locale?: string[] },
  ) {
    const result =
      await this.weeklyCronService.triggerManualGeneration(themeId);
    return {
      success: result.success,
      themeId: result.themeId,
      stats: result.stats,
      message: `Génération terminée: ${result.stats.created} suggestions créées`,
    };
  }
}
