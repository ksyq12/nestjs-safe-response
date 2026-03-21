import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;
}

export class ResponseMetaDto {
  @ApiPropertyOptional({ type: PaginationMetaDto })
  pagination?: PaginationMetaDto;
}

export class SafeSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiPropertyOptional({ type: ResponseMetaDto })
  meta?: ResponseMetaDto;

  @ApiPropertyOptional({ example: '2025-03-21T12:00:00.000Z' })
  timestamp?: string;

  @ApiPropertyOptional({ example: '/api/users' })
  path?: string;
}

export class ErrorDetailDto {
  @ApiProperty({ example: 'BAD_REQUEST' })
  code!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiPropertyOptional({
    example: ['email must be an email', 'name should not be empty'],
  })
  details?: unknown;
}

export class SafeErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ type: ErrorDetailDto })
  error!: ErrorDetailDto;

  @ApiPropertyOptional({ example: '2025-03-21T12:00:00.000Z' })
  timestamp?: string;

  @ApiPropertyOptional({ example: '/api/users' })
  path?: string;
}
