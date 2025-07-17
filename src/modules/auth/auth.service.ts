import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { HashService } from '../../core/security/hash/hash.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { jwtConstants, LOCKOUT_DURATION_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS } from './constants';
import { user_role } from 'generated/prisma';
import { JwtPayload } from './interfaces/jwt-payload.interface'; // Vẫn giữ nguyên import này

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
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
  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    // Tìm user bằng email
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
    });

    // Nếu không tìm thấy user hoặc mật khẩu không đúng
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Kiểm tra tài khoản có đang bị khóa do nhiều lần đăng nhập sai không
    if (
      (user.failed_login_attempts ?? 0) >= MAX_FAILED_LOGIN_ATTEMPTS &&
      user.last_failed_login_at
    ) {
      const lockoutTime = new Date(user.last_failed_login_at);
      lockoutTime.setMinutes(lockoutTime.getMinutes() + LOCKOUT_DURATION_MINUTES);

      if (new Date() < lockoutTime) {
        const minutesLeft = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 60000);

        // Ghi log login thất bại
        await this.logLoginAttempt(user.id, ipAddress, userAgent, false);

        throw new ForbiddenException(
          `Tài khoản tạm thời bị khóa do nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutesLeft} phút.`,
        );
      }
    }

    // Kiểm tra xem tài khoản có bị vô hiệu hóa không
    if (user.is_active === false) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await this.hashService.comparePassword(
      loginDto.password,
      user.password_hash,
    );

    // Nếu mật khẩu không đúng
    if (!isPasswordValid) {
      // Tăng số lần đăng nhập thất bại và cập nhật thời gian
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: {
            increment: 1,
          },
          last_failed_login_at: new Date(),
        },
      });

      // Ghi log login thất bại
      await this.logLoginAttempt(user.id, ipAddress, userAgent, false);

      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    console.log('🔧 BEFORE UPDATE:');
    console.log('- User token_version before:', user.token_version);

    // Đăng nhập thành công - reset các giá trị failed_login_attempts
    const updatedUser = await this.prisma.users.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        last_failed_login_at: null,
        last_login_at: new Date(),
        token_version: {
          increment: 1, // Tăng version token
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        token_version: true, // ← Quan trọng: lấy giá trị MỚI
      },
    });

    console.log('🔧 AFTER UPDATE:');
    console.log('- User update token_version after:', updatedUser.token_version);
    console.log('- User token_version after:', user.token_version);
    ///

    // Ghi log login thành công
    await this.logLoginAttempt(user.id, ipAddress, userAgent, true);

    // Tạo tokens
    const tokens = await this.getTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
      updatedUser.token_version || 0,
    );

    // Lưu refresh token vào DB
    await this.saveRefreshToken(updatedUser.id, tokens.refresh_token);

    return {
      message: 'Đăng nhập thành công',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: user.full_name,
        role: updatedUser.role,
        is_verified: user.is_verified,
      },
    };
  }
  private async logLoginAttempt(
    userId: string,
    ipAddress: string | null,
    userAgent: string | null,
    success: boolean,
  ) {
    try {
      await this.prisma.user_login_history.create({
        data: {
          user_id: userId,
          ip_address: ipAddress || '',
          user_agent: userAgent || '',
          success,
        },
      });
    } catch (error) {
      // Log lỗi nhưng không ảnh hưởng đến luồng đăng nhập
      console.error('Không thể ghi log login attempt:', error);
    }
  }

  private async getTokens(userId: string, email: string, role: user_role, tokenVersion: number) {
    const now = new Date();
    const iat = Math.floor(now.getTime() / 1000);

    console.log('🕐 Thời gian tạo token:');
    console.log('- Server time (Date):', now.toISOString());
    console.log('- Server time (timestamp):', now.getTime());
    console.log('- JWT iat:', iat);
    console.log('- JWT iat readable:', new Date(iat * 1000).toISOString());

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
          version: tokenVersion,
        },
        {
          secret: jwtConstants.accessTokenSecret,
          expiresIn: jwtConstants.accessTokenExpiration,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          version: tokenVersion,
        },
        {
          secret: jwtConstants.refreshTokenSecret,
          expiresIn: jwtConstants.refreshTokenExpiration,
        },
      ),
    ]);

    // Sửa lỗi: Sử dụng `unknown` để phá vỡ chuỗi `any`, sau đó kiểm tra và ép kiểu an toàn
    const rawDecodedToken: unknown = this.jwtService.decode(accessToken);

    // Sửa lỗi: Kiểm tra null và kiểu object trước khi truy cập thuộc tính
    if (rawDecodedToken && typeof rawDecodedToken === 'object') {
      // Sửa lỗi: Ép kiểu an toàn hơn, sử dụng `Partial<JwtPayload>` hoặc một interface cục bộ
      // Điều này giúp ESLint biết rằng bạn đang cố tình truy cập các thuộc tính này
      const decodedPayload = rawDecodedToken as Partial<JwtPayload>;

      let iatValue: number | undefined;
      let expValue: number | undefined;

      // Sửa lỗi: Truy cập thuộc tính sau khi ép kiểu an toàn
      if (decodedPayload.iat !== undefined && typeof decodedPayload.iat === 'number') {
        iatValue = decodedPayload.iat;
      }

      if (decodedPayload.exp !== undefined && typeof decodedPayload.exp === 'number') {
        expValue = decodedPayload.exp;
      }

      // Log các giá trị nếu tồn tại
      if (iatValue !== undefined) {
        const iatDate = new Date(iatValue * 1000).toISOString();
        console.log('🔍 Token payload sau khi tạo:');
        console.log('- iat:', iatValue, '(', iatDate, ')');
      }

      if (expValue !== undefined) {
        const expDate = new Date(expValue * 1000).toISOString();
        console.log('- exp:', expValue, '(', expDate, ')');

        const timeRemaining = expValue - Math.floor(Date.now() / 1000);
        console.log('- Thời gian còn lại (giây):', timeRemaining);
      }
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    // Tính thời gian hết hạn của token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày

    // Lưu refresh token vào database
    await this.prisma.refresh_tokens.create({
      data: {
        token,
        user_id: userId,
        expires_at: expiresAt,
      },
    });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, is_active: true, token_version: true },
    });

    if (!user || !user.is_active) {
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    const storedRefreshToken = await this.prisma.refresh_tokens.findFirst({
      where: {
        user_id: userId,
        token: refreshToken, // Bây giờ tìm bằng JWT token
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    if (!storedRefreshToken) {
      throw new ForbiddenException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role, user.token_version || 0);

    // Vô hiệu hóa refresh token cũ
    await this.prisma.refresh_tokens.updateMany({
      where: {
        user_id: userId,
        token: refreshToken,
      },
      data: { revoked_at: new Date() },
    });

    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refresh_tokens.updateMany({
        where: { user_id: userId, token: refreshToken, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      return { message: 'Đăng xuất thành công khỏi thiết bị hiện tại' };
    }
    await this.prisma.refresh_tokens.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return { message: 'Đăng xuất thành công khỏi tất cả thiết bị' };
  }
}
