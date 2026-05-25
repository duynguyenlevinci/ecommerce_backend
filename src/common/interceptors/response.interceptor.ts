import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '../decorators/skip-response-transform.decorator';
import { BaseResponse } from '../dto/base-response.dto';

/**
 * Wraps every successful controller response into the standard envelope:
 *
 * ```json
 * { "statusCode": <int>, "errors": [], "data": <payload> }
 * ```
 *
 * Endpoints marked with `@SkipResponseTransform()` (or that already return a
 * `BaseResponse`) are passed through unchanged.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponse<T> | T> {
  constructor(private readonly reflector: Reflector) { }

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<BaseResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        if (skip) return data;
        if (data instanceof BaseResponse) return data;

        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode ?? HttpStatus.OK;
        return new BaseResponse<T>(statusCode, (data ?? null) as T | null, []);
      }),
    );
  }
}
