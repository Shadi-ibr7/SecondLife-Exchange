import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import aiConfig from '../../config/ai.config';

@Module({
  imports: [ConfigModule.forFeature(aiConfig)],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
