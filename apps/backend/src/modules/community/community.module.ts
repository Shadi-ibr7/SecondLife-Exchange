import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { PostsController } from './posts.controller';
import { ThreadsService } from './threads.service';
import { PostsService } from './posts.service';
import { CommunityGateway } from './community.gateway';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ThreadsController, PostsController],
  providers: [ThreadsService, PostsService, CommunityGateway],
  exports: [ThreadsService, PostsService, CommunityGateway],
})
export class CommunityModule {}
