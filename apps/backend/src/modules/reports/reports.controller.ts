/**
 * FICHIER: reports.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour créer des signalements (utilisateurs authentifiés).
 */

import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dtos/create-report.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAccessGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un signalement' })
  @ApiResponse({ status: 201, description: 'Signalement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Signalement déjà existant' })
  async createReport(@Request() req: any, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport(req.user.id, createReportDto);
  }
}
