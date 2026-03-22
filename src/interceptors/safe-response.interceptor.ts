import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import {
  SAFE_RESPONSE_OPTIONS,
  RAW_RESPONSE_KEY,
  PAGINATED_KEY,
  RESPONSE_MESSAGE_KEY,
  SUCCESS_CODE_KEY,
} from '../constants';
import {
  SafeResponseModuleOptions,
  SafeSuccessResponse,
  PaginatedOptions,
  PaginatedResult,
  PaginationMeta,
} from '../interfaces';

@Injectable()
export class SafeResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(SAFE_RESPONSE_OPTIONS)
    private readonly options: SafeResponseModuleOptions = {},
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const isRaw = this.reflector.get<boolean>(
      RAW_RESPONSE_KEY,
      context.getHandler(),
    );

    if (isRaw) {
      return next.handle();
    }

    const paginatedOptions = this.reflector.get<PaginatedOptions | true>(
      PAGINATED_KEY,
      context.getHandler(),
    );

    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    const successCode = this.reflector.get<string>(
      SUCCESS_CODE_KEY,
      context.getHandler(),
    );

    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest();
    const statusCode = httpCtx.getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // v0.3.0: 래핑 전 데이터 변환 훅
        if (this.options.transformResponse) {
          data = this.options.transformResponse(data);
        }

        // 성공 코드 해석: @SuccessCode() > successCodeMapper > 생략
        let code: string | undefined = successCode;
        if (!code && this.options.successCodeMapper) {
          code = this.options.successCodeMapper(statusCode);
        }

        const response: SafeSuccessResponse = {
          success: true,
          statusCode,
          ...(code && { code }),
          data,
        };

        if (paginatedOptions && this.isPaginatedResult(data)) {
          const pagination = this.calculatePagination(
            data,
            paginatedOptions === true ? {} : paginatedOptions,
          );
          response.data = data.data;
          response.meta = { pagination };
        }

        if (customMessage) {
          response.meta = { ...response.meta, message: customMessage };
        }

        const includeTimestamp = this.options.timestamp ?? true;
        const includePath = this.options.path ?? true;

        if (includeTimestamp) {
          response.timestamp = this.options.dateFormatter
            ? this.options.dateFormatter()
            : new Date().toISOString();
        }

        if (includePath) {
          response.path = request.url;
        }

        return response;
      }),
    );
  }

  private isPaginatedResult(data: unknown): data is PaginatedResult {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      'data' in obj &&
      'total' in obj &&
      'page' in obj &&
      'limit' in obj &&
      Array.isArray(obj.data) &&
      typeof obj.total === 'number' &&
      typeof obj.page === 'number' &&
      typeof obj.limit === 'number'
    );
  }

  private calculatePagination(
    result: PaginatedResult,
    options: PaginatedOptions,
  ): PaginationMeta {
    const limit = Math.min(
      result.limit,
      options.maxLimit ?? Number.MAX_SAFE_INTEGER,
    );
    const totalPages = Math.ceil(result.total / limit);

    return {
      page: result.page,
      limit,
      total: result.total,
      totalPages,
      hasNext: result.page < totalPages,
      hasPrev: result.page > 1,
    };
  }
}
