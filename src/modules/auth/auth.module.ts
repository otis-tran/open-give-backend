import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from 'src/core/security/hash/hash.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { jwtConstants } from './constants';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthRepository } from './repositories/auth.repository';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TwoFactorService } from './services/two-factor.service';
import authConfig from 'src/config/auth.config';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig), // ← Add ConfigModule
    CacheModule.register({
      // ← Add CacheModule
      ttl: 300000, // 5 minutes
      max: 1000, // max items
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.accessTokenSecret,
      signOptions: { expiresIn: jwtConstants.accessTokenExpiration },
    }),
    ThrottlerModule.forRoot({
      // Cấu hình ThrottlerModule
      throttlers: [
        { name: 'default', ttl: 60000, limit: 10 },
        { name: 'auth', ttl: 60000, limit: 5 }, // Thêm rule cho auth
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    HashService,
    JwtStrategy,
    JwtRefreshStrategy,
    AuthRepository,
    TwoFactorService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Áp dụng ThrottlerGuard toàn cục
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
