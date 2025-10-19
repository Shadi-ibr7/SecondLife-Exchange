import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WeeklyCronService } from './weekly-cron.service';
import { AiController } from './ai.controller';
import { ThemesModule } from '../themes/themes.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThemesModule,
    SuggestionsModule,
    AiModule,
  ],
  controllers: [AiController],
  providers: [WeeklyCronService],
  exports: [WeeklyCronService],
})
export class SchedulerModule {}
