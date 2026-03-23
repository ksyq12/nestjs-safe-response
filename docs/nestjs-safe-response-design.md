# nestjs-safe-response 설계 문서

## 1. 개요

NestJS 애플리케이션의 API 응답을 자동으로 표준화된 JSON 구조로 감싸주는 패키지.
Interceptor, Exception Filter, Decorator를 조합하여 성공/실패 응답 포맷 통일, 페이지네이션 메타데이터 자동 생성, Swagger 문서 연동을 한 줄의 설정으로 처리한다.

### 패키지 목적

- NestJS의 핵심 메커니즘(Interceptor, Guard, Filter, Custom Decorator, Dynamic Module, Reflector)을 깊이 이해
- **타겟**: NestJS/백엔드 개발자
- **차별화 포인트**: 기존 패키지들(`nestjs-general-interceptor`, `@zabih-dev/nest-api-response` 등)은 단순 래핑만 제공. 이 패키지는 Swagger 스키마 자동 생성 + 페이지네이션 + 커스텀 에러 코드 매핑까지 통합

---

## 2. 응답 스키마

### 2.1 성공 응답

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-03-21T12:00:00.000Z",
  "path": "/api/users"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `success` | `true` | O | 항상 `true` |
| `statusCode` | `number` | O | HTTP 상태 코드 |
| `data` | `T` | O | 실제 응답 페이로드 |
| `meta` | `ResponseMeta` | X | 페이지네이션 등 부가 정보 |
| `timestamp` | `string` | X | ISO 8601 형식 (설정으로 끄기 가능) |
| `path` | `string` | X | 요청 경로 (설정으로 끄기 가능) |

### 2.2 에러 응답

```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [
      "email must be an email",
      "name should not be empty"
    ]
  },
  "timestamp": "2025-03-21T12:00:00.000Z",
  "path": "/api/users"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `success` | `false` | O | 항상 `false` |
| `statusCode` | `number` | O | HTTP 상태 코드 |
| `error.code` | `string` | O | 머신 리더블 에러 코드 (예: `NOT_FOUND`) |
| `error.message` | `string` | O | 사람이 읽을 수 있는 에러 메시지 |
| `error.details` | `unknown` | X | class-validator 에러 배열 등 상세 정보 |
| `timestamp` | `string` | X | ISO 8601 형식 |
| `path` | `string` | X | 요청 경로 |

### 2.3 기본 에러 코드 매핑

| HTTP Status | Error Code |
|-------------|------------|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `UNPROCESSABLE_ENTITY` |
| 429 | `TOO_MANY_REQUESTS` |
| 500 | `INTERNAL_SERVER_ERROR` |

`errorCodeMapper` 옵션으로 커스텀 매핑 가능.

---

## 3. 아키텍처

### 3.1 NestJS 요청 라이프사이클 내 위치

```
Request
  → Middleware
    → Guard
      → Interceptor (before) ← SafeResponseInterceptor
        → Pipe
          → Controller
        → Interceptor (after) ← 여기서 응답 래핑
      → Exception Filter ← SafeExceptionFilter
  → Response
```

### 3.2 모듈 구조

```
nestjs-safe-response/
├── src/
│   ├── index.ts                          # barrel export
│   ├── constants.ts                      # 메타데이터 키 상수
│   ├── safe-response.module.ts           # Dynamic Module (register / registerAsync)
│   ├── interfaces/
│   │   └── index.ts                      # 타입 정의
│   ├── decorators/
│   │   └── index.ts                      # 6개 데코레이터
│   ├── interceptors/
│   │   └── safe-response.interceptor.ts  # 응답 래핑 로직
│   ├── filters/
│   │   └── safe-exception.filter.ts      # 에러 응답 표준화
│   └── dto/
│       └── response.dto.ts               # Swagger 스키마 DTO
├── dist/                                 # 빌드 결과 (npm에 배포됨)
├── package.json
└── tsconfig.json
```

### 3.3 핵심 컴포넌트 역할

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `SafeResponseModule` | `safe-response.module.ts` | Dynamic Module. `register()` / `registerAsync()`로 글로벌 등록 |
| `SafeResponseInterceptor` | `interceptors/` | 성공 응답을 표준 구조로 래핑. 페이지네이션 자동 계산 |
| `SafeExceptionFilter` | `filters/` | 모든 예외를 표준 에러 구조로 변환. 5xx 자동 로깅 |
| Decorators | `decorators/` | 라우트별 동작 제어 + Swagger 스키마 생성 |
| DTOs | `dto/` | `@nestjs/swagger`의 `ApiProperty`로 Swagger 문서 자동 생성 |

---

## 4. API 설계

### 4.1 모듈 등록

```typescript
// 기본 등록
@Module({
  imports: [SafeResponseModule.register()],
})
export class AppModule {}

// 옵션 포함
@Module({
  imports: [
    SafeResponseModule.register({
      timestamp: true,
      path: true,
      errorCodeMapper: (exception) => {
        if (exception instanceof TokenExpiredError) return 'TOKEN_EXPIRED';
        return undefined; // 기본 매핑 사용
      },
    }),
  ],
})
export class AppModule {}

// 비동기 등록 (ConfigService 사용)
@Module({
  imports: [
    SafeResponseModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        timestamp: config.get('RESPONSE_TIMESTAMP', true),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 4.2 데코레이터

| 데코레이터 | 용도 | 비고 |
|-----------|------|------|
| `@SafeResponse(options?)` | 라우트에 표준 응답 래핑 + Swagger 기본 스키마 적용 | `description`, `statusCode` 옵션 |
| `@ApiSafeResponse(Model)` | Swagger `data` 필드를 특정 DTO 타입으로 문서화 | `isArray`, `statusCode` 옵션 |
| `@ApiPaginatedSafeResponse(Model)` | 페이지네이션 포함 Swagger 스키마 자동 생성 | `description` 옵션 |
| `@RawResponse()` | 해당 라우트의 응답 래핑 건너뛰기 | 헬스체크, SSE, 파일 다운로드 등 |
| `@Paginated(options?)` | 페이지네이션 메타데이터 자동 계산 활성화 | `maxLimit` 옵션 |
| `@ResponseMessage(msg)` | 커스텀 메시지를 메타데이터에 설정 | 인터셉터에서 참조 가능 |

### 4.3 사용 예시

```typescript
@Controller('users')
export class UsersController {
  // 기본 응답 래핑
  @Get(':id')
  @SafeResponse({ description: 'Get user by ID' })
  @ApiSafeResponse(UserDto)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 페이지네이션
  @Get()
  @Paginated({ maxLimit: 100 })
  @ApiPaginatedSafeResponse(UserDto)
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    const [items, total] = await this.usersService.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items, total, page, limit };
  }

  // 래핑 건너뛰기
  @Get('health')
  @RawResponse()
  healthCheck() {
    return { status: 'ok' };
  }
}
```

---

## 5. 핵심 로직 상세

### 5.1 SafeResponseInterceptor 처리 흐름

```
intercept() 호출
  │
  ├─ @RawResponse() 메타데이터 확인 → 있으면 원본 그대로 반환
  │
  ├─ @Paginated() 메타데이터 확인
  │
  └─ next.handle().pipe(map(...))
       │
       ├─ 페이지네이션 모드인 경우:
       │   컨트롤러가 반환한 { data, total, page, limit }에서
       │   pagination 메타데이터를 자동 계산하고
       │   data만 추출하여 응답 data 필드에 할당
       │
       └─ 최종 래핑:
           { success: true, statusCode, data, meta?, timestamp?, path? }
```

### 5.2 SafeExceptionFilter 처리 흐름

```
catch(exception) 호출
  │
  ├─ HttpException인 경우:
  │   ├─ getResponse()가 object → class-validator 에러 파싱
  │   │   message가 배열이면 details로 분리, message는 "Validation failed"
  │   └─ getResponse()가 string → 그대로 message 사용
  │
  ├─ 그 외 (unknown error):
  │   statusCode: 500, message: "Internal server error"
  │
  ├─ errorCodeMapper 커스텀 매핑 적용 (있는 경우)
  │
  ├─ 5xx 에러는 Logger.error()로 스택 트레이스 포함 로깅
  │
  └─ 최종 응답:
      { success: false, statusCode, error: { code, message, details? }, timestamp?, path? }
```

### 5.3 Swagger 연동 메커니즘

`@ApiSafeResponse(UserDto)`를 호출하면 내부적으로:

1. `ApiExtraModels(SafeSuccessResponseDto, UserDto)` — Swagger가 두 모델을 인식
2. `ApiOkResponse`의 `schema.allOf`로 래퍼 DTO + data 타입을 합성
3. 결과적으로 Swagger UI에서 래핑된 전체 구조가 표시됨

```
allOf:
  - $ref: SafeSuccessResponseDto     ← success, statusCode, timestamp, path
  - properties:
      data:
        $ref: UserDto                ← 실제 데이터 타입
      success:
        type: boolean
        example: true
```

---

## 6. 설정 옵션

### SafeResponseModuleOptions

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `timestamp` | `boolean` | `true` | 응답에 `timestamp` 필드 포함 여부 |
| `path` | `boolean` | `true` | 응답에 `path` 필드 포함 여부 |
| `errorCodeMapper` | `(exception) => string` | - | 예외를 커스텀 에러 코드로 변환 |
| `dateFormatter` | `() => string` | `new Date().toISOString()` | 타임스탬프 포맷 함수 |

---

## 7. 기술 스택 및 의존성

### 빌드 환경

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | TypeScript 5+ | strict 모드, 데코레이터 지원 |
| 모듈 시스템 | CommonJS | NestJS 기본 호환 |
| 빌드 | tsc | 단순함, declaration/sourcemap 생성 |
| 타겟 | ES2021 | Node 18+ 기준 |

### peerDependencies

| 패키지 | 버전 | 이유 |
|--------|------|------|
| `@nestjs/common` | ^10 \|\| ^11 | NestJS v10, v11 모두 지원 |
| `@nestjs/core` | ^10 \|\| ^11 | Reflector, DI 컨테이너 |
| `@nestjs/swagger` | ^7 \|\| ^8 | Swagger 데코레이터, getSchemaPath |
| `rxjs` | ^7 | Observable pipe/map |
| `reflect-metadata` | ^0.1 \|\| ^0.2 | 데코레이터 메타데이터 |

peerDependencies로 설정하여 사용자 프로젝트의 기존 버전과 충돌하지 않도록 한다.

---

## 8. npm 배포 전략

### 패키지 메타데이터

```
name:        nestjs-safe-response
version:     0.1.0 (초기 릴리스)
license:     MIT
keywords:    nestjs, response, interceptor, decorator, swagger, pagination
```

### 배포할 파일

`package.json`의 `"files": ["dist"]` 설정으로 `dist/` 폴더만 배포.
소스코드(`src/`), 설정파일(`tsconfig.json`), 테스트는 제외.

### 버전 관리

- `0.1.x` — 초기 개발, API 변경 가능
- `1.0.0` — 안정화 후 첫 정식 릴리스
- semver 준수: breaking change → major, 기능 추가 → minor, 버그 픽스 → patch

---

## 9. 향후 로드맵

### v0.2.0

- `@nestjs/microservices` RPC 컨텍스트 지원
- GraphQL 응답 래핑 (ExecutionContext 분기)

### v0.3.0

- `@CacheResponse(ttl)` 데코레이터 — 응답 캐싱 통합
- 응답 직렬화 필드 필터링 (`@Exclude()` 연동)

### v1.0.0

- 단위 테스트 (Jest) 커버리지 90%+
- E2E 테스트 (실제 NestJS 앱 기반)
- GitHub Actions CI/CD 파이프라인
- 영문 README + 한국어 README 이중 지원

---

## 10. 경쟁 분석

| 기능 | nestjs-safe-response | nestjs-general-interceptor | @zabih-dev/nest-api-response |
|------|---------------------|---------------------------|------------------------------|
| 응답 래핑 | O | O | O |
| 에러 표준화 | O (코드 매핑 포함) | X | O (기본) |
| 페이지네이션 자동 계산 | O | X | X |
| Swagger 스키마 자동 생성 | O (타입 안전) | X | X |
| Dynamic Module | O (register/registerAsync) | X | O (기본) |
| @RawResponse() 건너뛰기 | O | X | O |
| 커스텀 에러 코드 매핑 | O | X | X |
| class-validator 에러 파싱 | O (details 분리) | X | O (기본) |
| NestJS v10 + v11 지원 | O | 미확인 | O |