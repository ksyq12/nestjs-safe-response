import { applyDecorators, SetMetadata, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { RAW_RESPONSE_KEY, PAGINATED_KEY, RESPONSE_MESSAGE_KEY } from '../constants';
import {
  SafeSuccessResponseDto,
  SafeErrorResponseDto,
  PaginationMetaDto,
} from '../dto/response.dto';
import { PaginatedOptions } from '../interfaces';

/**
 * Apply standard safe response wrapping + basic Swagger schema.
 */
export function SafeResponse(options?: {
  description?: string;
  statusCode?: number;
}): MethodDecorator {
  const statusCode = options?.statusCode ?? 200;
  const description = options?.description ?? 'Successful response';

  return applyDecorators(
    ApiExtraModels(SafeSuccessResponseDto, SafeErrorResponseDto),
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        allOf: [{ $ref: getSchemaPath(SafeSuccessResponseDto) }],
      },
    }),
  );
}

/**
 * Document the Swagger `data` field with a specific DTO type.
 */
export function ApiSafeResponse<T extends Type>(
  model: T,
  options?: { isArray?: boolean; statusCode?: number; description?: string },
): MethodDecorator {
  const statusCode = options?.statusCode ?? 200;
  const description = options?.description ?? 'Successful response';

  const dataSchema = options?.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(SafeSuccessResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SafeSuccessResponseDto) },
          {
            properties: {
              data: dataSchema,
              success: { type: 'boolean', example: true },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Document a paginated response with Swagger schema.
 */
export function ApiPaginatedSafeResponse<T extends Type>(
  model: T,
  options?: { description?: string },
): MethodDecorator {
  const description = options?.description ?? 'Paginated response';

  return applyDecorators(
    ApiExtraModels(SafeSuccessResponseDto, PaginationMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SafeSuccessResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                properties: {
                  pagination: {
                    $ref: getSchemaPath(PaginationMetaDto),
                  },
                },
              },
              success: { type: 'boolean', example: true },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Skip response wrapping for this route.
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

/**
 * Enable pagination metadata auto-calculation.
 */
export const Paginated = (options?: PaginatedOptions) =>
  SetMetadata(PAGINATED_KEY, options ?? true);

/**
 * Set a custom message in the response meta.
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
