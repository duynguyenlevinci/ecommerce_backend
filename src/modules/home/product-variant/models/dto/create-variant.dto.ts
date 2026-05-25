import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVariantInlineDto {
  @ApiProperty({ example: 'IP16PRO-256-BLK' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku!: string;

  @ApiProperty({ example: '256GB Black Titanium' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    required: false,
    example: { storage: '256GB', color: 'Black' },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @ApiProperty({ example: 1299.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateVariantDto extends CreateVariantInlineDto {
  @ApiProperty({ description: 'Product UUID this variant belongs to' })
  @IsUUID()
  productId!: string;
}
