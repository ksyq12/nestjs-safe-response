import { expectType, expectAssignable, expectNotAssignable } from 'tsd';
import type {
  SafeSuccessResponse,
  SafeErrorResponse,
  PaginationMeta,
  ResponseMeta,
  PaginatedResult,
  PaginatedOptions,
  SafeResponseModuleOptions,
  SafeResponseModuleAsyncOptions,
  ApiSafeErrorResponseOptions,
  ApiSafeErrorResponseConfig,
} from './dist';

// ─── SafeSuccessResponse<T> ───

const successRes: SafeSuccessResponse<{ id: number }> = {
  success: true,
  statusCode: 200,
  data: { id: 1 },
};
expectType<true>(successRes.success);
expectType<number>(successRes.statusCode);
expectType<{ id: number }>(successRes.data);

// optional fields
const fullSuccessRes: SafeSuccessResponse<string> = {
  success: true,
  statusCode: 200,
  data: 'hello',
  code: 'OK',
  meta: { pagination: undefined },
  timestamp: '2026-01-01T00:00:00Z',
  path: '/api/test',
};
expectType<string | undefined>(fullSuccessRes.code);
expectType<string | undefined>(fullSuccessRes.timestamp);
expectType<string | undefined>(fullSuccessRes.path);

// ─── SafeErrorResponse ───

const errorRes: SafeErrorResponse = {
  success: false,
  statusCode: 400,
  error: { code: 'BAD_REQUEST', message: 'Validation failed' },
};
expectType<false>(errorRes.success);
expectType<string>(errorRes.error.code);
expectType<string>(errorRes.error.message);

// ─── PaginationMeta ───

const paginationMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 100,
  totalPages: 5,
  hasNext: true,
  hasPrev: false,
};
expectType<number>(paginationMeta.page);
expectType<boolean>(paginationMeta.hasNext);

// ─── PaginatedResult<T> ───

const paginatedResult: PaginatedResult<{ id: number }> = {
  data: [{ id: 1 }],
  total: 1,
  page: 1,
  limit: 20,
};
expectType<{ id: number }[]>(paginatedResult.data);

// ─── SafeResponseModuleOptions ───

// all fields optional
const emptyOptions: SafeResponseModuleOptions = {};
expectType<SafeResponseModuleOptions>(emptyOptions);

const fullOptions: SafeResponseModuleOptions = {
  timestamp: true,
  path: false,
  errorCodeMapper: () => 'CUSTOM',
  dateFormatter: () => '2026-01-01',
  successCodeMapper: () => 'OK',
  transformResponse: (data) => data,
};
expectType<SafeResponseModuleOptions>(fullOptions);

// ─── ApiSafeErrorResponseOptions ───

const errorOpts: ApiSafeErrorResponseOptions = {
  description: 'Not found',
  code: 'NOT_FOUND',
  message: 'Resource not found',
  details: ['field is required'],
};
expectType<ApiSafeErrorResponseOptions>(errorOpts);

// all fields optional
const emptyErrorOpts: ApiSafeErrorResponseOptions = {};
expectType<ApiSafeErrorResponseOptions>(emptyErrorOpts);

// ─── ApiSafeErrorResponseConfig ───

// number is valid
expectAssignable<ApiSafeErrorResponseConfig>(404);

// object with status is valid
expectAssignable<ApiSafeErrorResponseConfig>({ status: 400, code: 'VALIDATION' });

// object without status is NOT valid
expectNotAssignable<ApiSafeErrorResponseConfig>({ code: 'MISSING_STATUS' });
