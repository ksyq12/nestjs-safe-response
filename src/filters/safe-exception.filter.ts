import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  Logger,
  Optional,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SAFE_RESPONSE_OPTIONS, DEFAULT_ERROR_CODE_MAP } from '../constants';
import { SafeResponseModuleOptions, SafeErrorResponse } from '../interfaces';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeExceptionFilter.name);

  constructor(
    @Optional()
    @Inject(SAFE_RESPONSE_OPTIONS)
    private readonly options: SafeResponseModuleOptions = {},
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = 500;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          details = responseObj.message;
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }
      }
    }

    // Custom error code mapping
    let errorCode: string | undefined;
    if (this.options.errorCodeMapper) {
      errorCode = this.options.errorCodeMapper(exception);
    }

    if (!errorCode) {
      errorCode = DEFAULT_ERROR_CODE_MAP[statusCode] ?? 'INTERNAL_SERVER_ERROR';
    }

    // Log 5xx errors with stack trace
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: SafeErrorResponse = {
      success: false,
      statusCode,
      error: {
        code: errorCode,
        message,
        ...(details !== undefined && { details }),
      },
    };

    const includeTimestamp = this.options.timestamp ?? true;
    const includePath = this.options.path ?? true;

    if (includeTimestamp) {
      body.timestamp = this.options.dateFormatter
        ? this.options.dateFormatter()
        : new Date().toISOString();
    }

    if (includePath) {
      body.path = request.url;
    }

    response.status(statusCode).json(body);
  }
}
