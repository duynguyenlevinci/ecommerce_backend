import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../../../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Tracking number assigned by the courier (set when SHIPPED)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Shipping company name, e.g. "GHN", "GHTK", "VNPost"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  courier?: string;

  @ApiPropertyOptional({
    description: 'Free-form note recorded in the order status history',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
