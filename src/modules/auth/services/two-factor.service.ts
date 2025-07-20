import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate 2FA secret and QR code for user setup
   */
  generateTwoFactorSecret(userEmail: string): { secret: string; qrCodeUrl: Promise<string> } {
    const secret = speakeasy.generateSecret({
      name: `OpenGive (${userEmail})`,
      issuer: 'OpenGive',
    });

    const qrCodeUrl = qrcode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  /**
   * Verify TOTP code against user's secret
   */
  verifyTwoFactorCode(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      token,
      encoding: 'base32',
      window: 2, // Allow 2 time steps tolerance
    });
  }
}
