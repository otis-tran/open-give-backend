import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { NotificationModule } from './core/notification/notification.module';
import { HashService } from './core/security/hash/hash.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './core/prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot(), NotificationModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, HashService, PrismaService],
})
export class AppModule {}
