// Module
export { SafeResponseModule } from './safe-response.module';

// Interceptors
export { SafeResponseInterceptor } from './interceptors/safe-response.interceptor';

// Filters
export { SafeExceptionFilter } from './filters/safe-exception.filter';

// Decorators
export {
  SafeResponse,
  ApiSafeResponse,
  ApiPaginatedSafeResponse,
  ApiCursorPaginatedSafeResponse,
  ApiSafeErrorResponse,
  ApiSafeErrorResponses,
  ApiSafeProblemResponse,
  RawResponse,
  Paginated,
  CursorPaginated,
  ResponseMessage,
  SuccessCode,
  ProblemType,
} from './decorators';

// Interfaces
export type {
  SafeResponseModuleOptions,
  SafeResponseModuleAsyncOptions,
  PaginationMeta,
  PaginationLinks,
  CursorPaginationMeta,
  ResponseMeta,
  SafeSuccessResponse,
  SafeErrorResponse,
  SafeProblemDetailsResponse,
  ProblemDetailsOptions,
  PaginatedOptions,
  PaginatedResult,
  CursorPaginatedOptions,
  CursorPaginatedResult,
  RequestIdOptions,
  ApiSafeErrorResponseOptions,
  ApiSafeErrorResponseConfig,
} from './interfaces';

// DTOs (for Swagger)
export {
  SafeSuccessResponseDto,
  SafeErrorResponseDto,
  ErrorResponseMetaDto,
  PaginationMetaDto,
  PaginationLinksDto,
  CursorPaginationMetaDto,
  ResponseMetaDto,
  ErrorDetailDto,
  ProblemDetailsDto,
} from './dto/response.dto';

// Constants
export { DEFAULT_ERROR_CODE_MAP, DEFAULT_PROBLEM_TITLE_MAP, CURSOR_PAGINATED_KEY, PROBLEM_TYPE_KEY } from './constants';
