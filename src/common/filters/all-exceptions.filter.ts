import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { BaseResponse } from '../dto/base-response.dto';

interface HttpExceptionResponseBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Catches every unhandled error in the application and returns the standard
 * `BaseResponse` envelope:
 *
 * ```json
 * { "statusCode": 400, "errors": ["..."], "data": null }
 * ```
 *
 * - HttpException → status + messages from its response body are forwarded.
 * - Validation errors (BadRequestException with array of messages) → preserved
 *   one error per entry.
 * - Any other Error → 500 + its message; stack trace logged.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errors: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errors = this.extractHttpExceptionMessages(exception);
    } else if (exception instanceof Error) {
      errors = [exception.message || 'Internal server error'];
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error(`Non-Error thrown: ${JSON.stringify(exception)}`);
    }

    const body = new BaseResponse(statusCode, null, errors);
    httpAdapter.reply(ctx.getResponse(), body, statusCode);
  }

  private extractHttpExceptionMessages(exception: HttpException): string[] {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return [response];
    }
    if (typeof response === 'object' && response !== null) {
      const body = response as HttpExceptionResponseBody;
      if (Array.isArray(body.message)) {
        return body.message;
      }
      if (typeof body.message === 'string') {
        return [body.message];
      }
      if (typeof body.error === 'string') {
        return [body.error];
      }
    }
    return [exception.message];
  }
}
