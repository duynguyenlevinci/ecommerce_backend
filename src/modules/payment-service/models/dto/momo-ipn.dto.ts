import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Payload that MoMo sends to our `ipnUrl` after the user completes payment.
 * Field names follow MoMo Payment Gateway v2 spec.
 */
export class MomoIpnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  partnerCode!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  amount!: number;

  @ApiProperty()
  @IsString()
  orderInfo!: string;

  @ApiProperty()
  @IsString()
  orderType!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  transId!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  resultCode!: number;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty()
  @IsString()
  payType!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  responseTime!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  extraData?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signature!: string;
}
