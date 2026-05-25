import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination metadata returned alongside every paginated list response.
 */
export class PaginationMeta {
  @ApiProperty({ example: 137, description: 'Total items matching the query' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page (1-based)' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit!: number;

  @ApiProperty({ example: 7, description: 'Total pages = ceil(total / limit)' })
  totalPages!: number;
}

/**
 * Standard envelope returned by every paginated list endpoint
 * (products, categories, orders…).
 *
 * ```json
 * { "data": [...], "meta": { "total": 137, "page": 1, "limit": 20, "totalPages": 7 } }
 * ```
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Build a `PaginatedResult` from a `[items, total]` tuple (the shape returned
 * by TypeORM's `getManyAndCount()` / `findAndCount()`).
 */
export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => ({
  data: items,
  meta: {
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  },
});
