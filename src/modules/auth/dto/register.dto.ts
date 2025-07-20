import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  Matches,
  IsEnum,
  Validate,
  IsOptional,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { user_role } from 'generated/prisma';

// --- 1. Khai báo kiểu rõ ràng cho args.object ---
type PasswordObject = Record<string, string>;

// Custom validator for password confirmation
@ValidatorConstraint({ name: 'PasswordMatch', async: false })
export class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as PasswordObject)[relatedPropertyName];
    // Debug logging (remove in production)
    console.log(
      `Validating confirmPassword: ${confirmPassword} against ${relatedPropertyName}: ${relatedValue}`,
    );

    return confirmPassword === relatedValue;
  }

  defaultMessage(): string {
    return 'Mật khẩu xác nhận không khớp';
  }
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số',
  })
  password: string;

  @ApiProperty({ description: 'Confirm password must match password' })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @Validate(PasswordMatchConstraint, ['password'], { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  full_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: user_role })
  @IsEnum(user_role, { message: 'Vai trò không hợp lệ' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role: user_role;
}
