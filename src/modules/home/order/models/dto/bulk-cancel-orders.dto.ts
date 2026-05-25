import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '../../../../../common/enums/order-status.enum';

export const BULK_CANCEL_MAX_IDS = 500;

/**
 * Admin bulk cancel. Provide EITHER `orderIds` (a hand-picked set) OR a
 * filter (`status` and/or `createdBefore`). When both are supplied,
 * `orderIds` wins and the filter is ignored.
 */
export class BulkCancelOrdersDto {
  @ApiPropertyOptional({
    description: `Hand-picked order ids to cancel (max ${BULK_CANCEL_MAX_IDS})`,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_CANCEL_MAX_IDS)
  @IsUUID('all', { each: true })
  orderIds?: string[];

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Cancel only orders currently in this status (typically "pending")',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description:
      'Cancel only orders created strictly before this ISO-8601 timestamp',
    example: '2026-05-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  createdBefore?: string;

  @ApiProperty({
    description: 'Reason logged on every cancelled order (audit trail)',
    example: 'Cleanup of unpaid orders older than 5 days',
  })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class BulkCancelSkippedItem {
  @ApiProperty({ example: 'ORD-1717000000000-AB12' })
  orderCode!: string;

  @ApiProperty({ example: 'Illegal status transition: shipped → cancelled' })
  reason!: string;
}

export class BulkCancelResultDto {
  @ApiProperty({ description: 'Number of orders matched by the request' })
  totalRequested!: number;

  @ApiProperty({
    type: [String],
    description: 'Order codes that were cancelled successfully',
  })
  cancelled!: string[];

  @ApiProperty({
    type: [BulkCancelSkippedItem],
    description: 'Orders that could not be cancelled (with per-order reasons)',
  })
  skipped!: BulkCancelSkippedItem[];
}
