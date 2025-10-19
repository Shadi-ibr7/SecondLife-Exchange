import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { UploadsService } from './uploads/uploads.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import cloudinaryConfig from '../../config/cloudinary.config';

@Module({
  imports: [PrismaModule, AiModule, ConfigModule.forFeature(cloudinaryConfig)],
  controllers: [ItemsController],
  providers: [ItemsService, UploadsService],
  exports: [ItemsService, UploadsService],
})
export class ItemsModule {}
