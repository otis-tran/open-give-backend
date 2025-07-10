import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationModule } from 'src/core/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
