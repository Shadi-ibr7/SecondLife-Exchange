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
import { ExchangesService } from './exchanges.service';
import { CreateExchangeDto } from './dtos/create-exchange.dto';
import { UpdateExchangeStatusDto } from './dtos/update-exchange-status.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@Controller('exchanges')
@UseGuards(JwtAccessGuard)
@UseInterceptors(LoggingInterceptor)
export class ExchangesController {
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
