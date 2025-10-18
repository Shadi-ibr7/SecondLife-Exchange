import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('theme')
  @ApiOperation({ summary: 'Obtenir le thème hebdomadaire actuel et ses suggestions' })
  @ApiResponse({ status: 200, description: 'Thème hebdomadaire et suggestions' })
  async getCurrentTheme() {
    return this.aiService.getCurrentTheme();
  }

  @Post('generate-suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déclencher manuellement la génération des suggestions hebdomadaires' })
  @ApiResponse({ status: 200, description: 'Suggestions générées avec succès' })
  async generateSuggestions() {
    await this.aiService.generateWeeklySuggestions();
    return { message: 'Suggestions générées avec succès' };
  }
}
