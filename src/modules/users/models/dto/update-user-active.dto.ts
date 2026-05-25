import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserActiveDto {
  @ApiProperty({
    description: 'Enable (true) or disable (false) the account',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
