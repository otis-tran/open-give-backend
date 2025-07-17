import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { user_role } from 'generated/prisma'; // nếu bạn dùng enum role trong DB

/* ---------- 1.  Định nghĩa payload của access-token ---------- */
interface JwtAccessPayload {
  sub: string; // user id
  email: string;
  role: user_role;
  version: number; // token_version
  iat?: number;
  exp?: number;
}
/* ------------------------------------------------------------- */

/* -------- 2. Thông tin user sẽ gán vào request.user ---------- */
interface AuthenticatedUser {
  sub: string;
  email: string;
  full_name: string;
  role: user_role;
  is_verified: boolean | null; // <- thêm null
}
/* ------------------------------------------------------------- */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.accessTokenSecret,
    });
  }

  // Định kiểu cho payload và kiểu trả về
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    console.log('🔐 === XÁC THỰC TOKEN ===');
    console.log('JWT Payload:', JSON.stringify(payload, null, 2));

    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    /* --------------- Lấy user từ DB ---------------- */
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        is_verified: true,
        token_version: true,
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
    }

    /* ------------- So khớp token_version ------------ */
    if (user.token_version !== payload.version) {
      throw new UnauthorizedException('Token không còn hợp lệ, vui lòng đăng nhập lại');
    }

    /* ------------ Trả về thông tin user ------------- */
    return {
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_verified: user.is_verified,
    };
  }
}
