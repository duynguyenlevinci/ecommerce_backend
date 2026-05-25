import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response envelope used by every endpoint of the application.
 *
 * Shape:
 * ```json
 * {
 *   "statusCode": 200,
 *   "errors": [],
 *   "data": <any payload | null>
 * }
 * ```
 *
 * Successful responses always carry `errors: []`.
 * Failed responses always carry `data: null` and one or more entries in `errors`.
 */
export class BaseResponse<T = unknown> {
  @ApiProperty({
    description: 'HTTP-style status code of the response',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'List of human-readable error messages. Empty when successful.',
    type: [String],
    example: [],
  })
  errors: string[];

  @ApiProperty({
    description: 'Response payload. Type depends on the endpoint. Null on errors.',
    nullable: true,
  })
  data: T | null;

  constructor(statusCode: number, data: T | null = null, errors: string[] = []) {
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
  }

  static success<T>(data: T, statusCode = 200): BaseResponse<T> {
    return new BaseResponse<T>(statusCode, data, []);
  }

  static error(
    statusCode: number,
    errors: string[] = [],
  ): BaseResponse<null> {
    return new BaseResponse<null>(statusCode, null, errors);
  }
}
