import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorSetupDto {
  @ApiProperty({
    description: 'Base32 encoded secret for TOTP generation',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'Data URL for QR code image',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCodeUrl: string;
}

export class TwoFactorVerifyDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Mã 2FA phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã 2FA không được để trống' })
  @Length(6, 6, { message: 'Mã 2FA phải có đúng 6 chữ số' })
  @Matches(/^\d{6}$/, { message: 'Mã 2FA chỉ được chứa số' })
  code: string;
}
