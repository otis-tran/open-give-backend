import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { jwtConstants } from '../constants';
import { PrismaService } from '../../../core/prisma/prisma.service';

/* --------- Định nghĩa payload của refresh-token ---------- */
interface JwtRefreshPayload {
  sub: string; // user id
  version: number; // token_version
  iat?: number;
  exp?: number;
}
/* --------------------------------------------------------- */

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  // ---- định kiểu cho cả payload và giá trị trả về ----
  async validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): Promise<JwtRefreshPayload & { refreshToken: string }> {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim() ?? '';

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không được cung cấp');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { token_version: true, is_active: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
    }

    if (user.token_version !== payload.version) {
      throw new UnauthorizedException('Refresh token không còn hợp lệ');
    }

    // Trả về payload kèm refreshToken với kiểu đã rõ ràng
    return { ...payload, refreshToken };
  }
}
