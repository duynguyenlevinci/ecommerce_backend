import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order UUID to pay for' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({
    required: false,
    description: 'Optional human-readable message attached to the payment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orderInfo?: string;
}
