# `defaultLimit` 옵션 감사 보고서

**작성일**: 2026-03-23
**대상**: `PaginatedOptions.defaultLimit`
**분류**: Public API / 문서 불일치 (런타임 영향 없음)
**권장 조치**: deprecated 후 다음 breaking release에서 제거, 또는 breaking change로 명시하고 즉시 제거

---

## 현황

`PaginatedOptions` 인터페이스에 `defaultLimit` 필드가 정의되어 있으나, 런타임 구현에서 참조하지 않는다.

### 문제의 두 가지 층위

| 층위 | 설명 | 심각도 |
|------|------|--------|
| **런타임** | `defaultLimit`를 전달해도 무시됨. 동작에 영향 없음 | Low |
| **Public API / 문서** | `PaginatedOptions`는 `src/index.ts:29`에서 export됨. TypeScript 소비자가 이 필드에 의존할 수 있으므로, 삭제 시 컴파일 에러 발생 가능 | Medium |

### 참조 현황

| 구분 | 위치 | 상태 |
|------|------|------|
| 인터페이스 정의 | `src/interfaces/index.ts:63` | `defaultLimit?: number` |
| Public export | `src/index.ts:29` | `PaginatedOptions` 타입 export |
| 데코레이터 사용 | `test/e2e/test.controller.ts:47` | `@Paginated({ defaultLimit: 20, maxLimit: 100 })` |
| README 문서 (EN) | `README.md:121, 184` | 사용 예시 + 옵션 설명 |
| README 문서 (KO) | `README.ko.md:114, 177` | 사용 예시 + 옵션 설명 |
| 설계 문서 | `docs/nestjs-safe-response-design.md:195, 213` | 데코레이터 옵션 표 + 사용 예시 |
| **런타임 구현** | `src/interceptors/safe-response.interceptor.ts:138-140` | **참조 없음** |

`calculatePagination()`에서는 `options.maxLimit`만 사용하며, `options.defaultLimit`는 읽지 않는다.

```typescript
// interceptor.ts:134-152 — defaultLimit 참조 없음
private calculatePagination(result: PaginatedResult, options: PaginatedOptions): PaginationMeta {
  const limit = Math.min(
    result.limit,                                    // ← result에서 직접 사용
    options.maxLimit ?? Number.MAX_SAFE_INTEGER,      // ← maxLimit만 참조
  );
  // ...
}
```

---

## 원인 추적

Git 이력 조사 결과, `defaultLimit`는 여러 커밋에 걸쳐 추가되었다.

| 커밋 | 내용 |
|------|------|
| `843c932` | 인터페이스 정의 (`PaginatedOptions.defaultLimit`) + 설계 문서 |
| `dde66c8` | E2E 테스트 예시 (`@Paginated({ defaultLimit: 20, maxLimit: 100 })`) |
| `f0e2177` | README (EN/KO) 문서에 `defaultLimit` 사용 예시 + 옵션 설명 |

설계 문서의 사용 예시:

```typescript
@Paginated({ defaultLimit: 20, maxLimit: 100 })
async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
  // ...
  return { data: items, total, page, limit };
}
```

설계 시점에는 "인터셉터가 기본 limit을 주입하는" 시나리오를 고려했으나, 실제 구현에서는 **컨트롤러 파라미터 기본값**(`limit = 20`)으로 해결되는 패턴이 채택되었다. `isPaginatedResult()`가 `limit`을 필수로 검증하므로(`interceptor.ts:126`), `defaultLimit`가 개입할 수 있는 시점이 현재 설계에는 존재하지 않는다. 이후 v0.2.0~v0.4.0까지 방치되었다.

---

## 구현 vs 제거 판단

| 관점 | 구현 | 제거 |
|------|------|------|
| 현재 설계와의 정합성 | `isPaginatedResult`가 `limit` 필수 검증 → `defaultLimit` 개입 시점 없음 | 현재 설계와 일관됨 |
| 구현 시 필요 변경 | `PaginatedResult.limit`을 옵셔널로 변경 → breaking change + 페이지네이션 감지 로직 수정 | 인터페이스 필드 삭제 |
| 일반적 NestJS 패턴 | 컨트롤러 `@Query('limit') limit = 20`으로 기본값 처리가 일반적 | — |
| 외부 소비자 영향 | — | `PaginatedOptions`가 export되므로 TypeScript 소비자에게 breaking change |

**결론: 제거가 더 타당하다.** 다만, `PaginatedOptions`는 public API이므로 삭제 방식에 주의가 필요하다.

---

## 권장 제거 전략

### 옵션 A: deprecated 후 다음 breaking release에서 제거

1. `defaultLimit`에 `@deprecated` JSDoc 추가 + CHANGELOG에 deprecation 고지
2. 다음 minor 또는 major 버전에서 필드 삭제

### 옵션 B: breaking change로 명시하고 즉시 제거

1. 다음 릴리스에서 삭제, CHANGELOG에 **BREAKING CHANGE** 명시
2. 현재 0.x 단계이므로 semver상 minor bump로도 breaking change 허용

---

## 제거 시 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/interfaces/index.ts:63` | `defaultLimit?: number` 삭제 |
| `test/e2e/test.controller.ts:47` | `{ defaultLimit: 20, maxLimit: 100 }` → `{ maxLimit: 100 }` |
| `README.md:121` | 사용 예시에서 `defaultLimit: 20,` 삭제 |
| `README.md:184` | 옵션 설명에서 `defaultLimit` 삭제 |
| `README.ko.md:114` | 사용 예시에서 `defaultLimit: 20,` 삭제 |
| `README.ko.md:177` | 옵션 설명에서 `defaultLimit` 삭제 |
| `docs/nestjs-safe-response-design.md:195` | 데코레이터 옵션 표에서 삭제 |
| `docs/nestjs-safe-response-design.md:213` | 사용 예시에서 삭제 |
| `CHANGELOG.md` | deprecation 또는 BREAKING CHANGE 고지 추가 |
