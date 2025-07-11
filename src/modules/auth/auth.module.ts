import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from 'src/core/security/hash/hash.service';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, HashService],
  exports: [AuthService],
})
export class AuthModule {}
