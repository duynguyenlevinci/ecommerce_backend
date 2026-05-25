import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PAGINATION } from '../../../../../common/constants/pagination.constants';

/** Coerce truthy/falsy query-string values to a real boolean. */
const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (['false', '0', 'no', 'off'].includes(lower)) return false;
    if (['true', '1', 'yes', 'on'].includes(lower)) return true;
  }
  return value;
};

export class QueryProductDto {
  @ApiPropertyOptional({
    description: 'Search by product name (partial, case-insensitive)',
    example: 'iphone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category id (UUID)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category slug, e.g. "smartphones"',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    description:
      'When filtering by category, also include products from all descendant ' +
      'categories (e.g. filter "Electronics" returns "Smartphones" too).',
    default: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeSubcategories?: boolean = true;

  @ApiPropertyOptional({ example: 'Apple' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ default: PAGINATION.DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_PAGE)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: PAGINATION.DEFAULT_LIMIT,
    maximum: PAGINATION.MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_LIMIT)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;
}
