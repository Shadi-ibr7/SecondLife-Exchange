import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@Controller('users')
@UseGuards(JwtAccessGuard)
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  async updateMe(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateMe(req.user.id, updateProfileDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@Request() req) {
    await this.usersService.deleteMe(req.user.id);
  }
}
