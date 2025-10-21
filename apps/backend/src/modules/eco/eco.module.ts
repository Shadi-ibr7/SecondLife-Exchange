import { Module } from '@nestjs/common';
import { EcoController } from './eco.controller';
import { EcoService } from './eco.service';
import { GeminiService } from './gemini.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EcoController],
  providers: [EcoService, GeminiService],
  exports: [EcoService, GeminiService],
})
export class EcoModule {}
