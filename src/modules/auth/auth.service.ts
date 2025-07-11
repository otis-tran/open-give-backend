import { Injectable, ConflictException } from '@nestjs/common';

import { HashService } from '../../core/security/hash/hash.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prisma.users.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash mật khẩu
    const hashedPassword = await this.hashService.hashPassword(registerDto.password);

    // Tạo user mới
    const newUser = await this.prisma.users.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        full_name: registerDto.full_name,
        phone: registerDto.phone,
        role: registerDto.role,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
        is_verified: true,
      },
    });

    return {
      message: 'Đăng ký thành công',
      user: newUser,
    };
  }
}
