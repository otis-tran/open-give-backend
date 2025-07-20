import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserProfileDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  sub: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Expose()
  full_name: string;

  @ApiProperty({
    description: 'User role',
    example: 'donor',
    enum: ['admin', 'donor', 'beneficiary'],
  })
  @Expose()
  role: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  @Expose()
  is_verified: boolean;
}
