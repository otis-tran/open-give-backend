import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationModule } from 'src/core/notification/notification.module';
import { envValidationSchema } from 'src/config/database-validation';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
    }),
    NotificationModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
