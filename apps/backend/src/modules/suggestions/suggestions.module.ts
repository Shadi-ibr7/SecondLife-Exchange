import { Module } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import scheduleConfig from '../../config/schedule.config';

@Module({
  imports: [PrismaModule, AiModule, ConfigModule.forFeature(scheduleConfig)],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
