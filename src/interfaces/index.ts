import { ModuleMetadata } from '@nestjs/common';

export interface RequestIdOptions {
  /** Custom header name (default: 'X-Request-Id') */
  headerName?: string;
  /** Custom ID generator (default: crypto.randomUUID()) */
  generator?: () => string;
}

export interface SafeResponseModuleOptions {
  /** Include timestamp field in responses (default: true) */
  timestamp?: boolean;
  /** Include path field in responses (default: true) */
  path?: boolean;
  /** Custom error code mapper function */
  errorCodeMapper?: (exception: unknown) => string | undefined;
  /** Custom date formatter function (default: ISO 8601) */
  dateFormatter?: () => string;
  /** Custom success code mapper function (statusCode → code string) */
  successCodeMapper?: (statusCode: number) => string | undefined;
  /** Transform data before wrapping (sync only, runs before pagination check) */
  transformResponse?: (data: unknown) => unknown;
  /** Enable request ID tracking. true uses defaults, or pass options object. */
  requestId?: boolean | RequestIdOptions;
  /** Include response time in meta (milliseconds). Default: false */
  responseTime?: boolean;
  /** Enable RFC 9457 Problem Details format for error responses. Default: false */
  problemDetails?: boolean | ProblemDetailsOptions;
}

export interface ProblemDetailsOptions {
  /** Base URL for problem type URIs (e.g., 'https://api.example.com/problems') */
  baseUrl?: string;
}

export interface SafeProblemDetailsResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  /** Extension member: machine-readable error code */
  code?: string;
  /** Extension member: request tracking ID */
  requestId?: string;
  /** Extension member: validation error details */
  details?: unknown;
  /** Extension member: response time */
  meta?: {
    responseTime?: number;
  };
}

export interface SafeResponseModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<SafeResponseModuleOptions> | SafeResponseModuleOptions;
  inject?: any[];
}

export interface PaginationMeta {
  type?: 'offset';
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  links?: PaginationLinks;
}

export interface CursorPaginationMeta {
  type: 'cursor';
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
  limit: number;
  totalCount?: number;
  links?: PaginationLinks;
}

export interface ResponseMeta {
  pagination?: PaginationMeta | CursorPaginationMeta;
  message?: string;
  responseTime?: number;
}

export interface SafeSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  code?: string;
  requestId?: string;
  data: T;
  meta?: ResponseMeta;
  timestamp?: string;
  path?: string;
}

export interface SafeErrorResponse {
  success: false;
  statusCode: number;
  requestId?: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    responseTime?: number;
  };
  timestamp?: string;
  path?: string;
}

export interface PaginationLinks {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string | null;
}

export interface PaginatedOptions {
  maxLimit?: number;
  /** Generate HATEOAS navigation links in pagination meta. Default: false */
  links?: boolean;
}

export interface PaginatedResult<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CursorPaginatedOptions {
  maxLimit?: number;
  /** Generate HATEOAS navigation links in pagination meta. Default: false */
  links?: boolean;
}

export interface CursorPaginatedResult<T = unknown> {
  data: T[];
  nextCursor: string | null;
  previousCursor?: string | null;
  hasMore: boolean;
  limit: number;
  totalCount?: number;
}

export interface ApiSafeErrorResponseOptions {
  /** Description shown in Swagger UI */
  description?: string;
  /** Override the auto-resolved error code from DEFAULT_ERROR_CODE_MAP */
  code?: string;
  /** Example error message */
  message?: string;
  /** Example details value (type is inferred: array → array schema, object → object schema) */
  details?: unknown;
}

export type ApiSafeErrorResponseConfig =
  | number
  | ({ status: number } & ApiSafeErrorResponseOptions);
