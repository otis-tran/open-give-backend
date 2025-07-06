import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { NotificationModule } from './core/notification/notification.module';

@Module({
  imports: [NotificationModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
