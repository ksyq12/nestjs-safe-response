import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { TestAppModule } from './test-app.module';

describe('SafeResponse E2E (Fastify)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /test → 래핑된 성공 응답', async () => {
    const res = await request(app.getHttpServer()).get('/test').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data).toEqual({ id: 1, name: 'Test User' });
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.path).toBe('/test');
  });

  it('POST /test → statusCode 201 반영', async () => {
    const res = await request(app.getHttpServer()).post('/test').expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(201);
  });

  it('GET /test/raw → 래핑 없는 원본 응답', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/raw')
      .expect(200);

    expect(res.body).toEqual({ status: 'ok' });
    expect(res.body.success).toBeUndefined();
  });

  it('GET /test/paginated → pagination 메타 포함', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/paginated')
      .expect(200);

    expect(res.body.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(res.body.meta.pagination).toBeDefined();
    expect(res.body.meta.pagination.totalPages).toBe(3);
  });

  it('GET /test/not-found → 404 표준 에러', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/not-found')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('User not found');
  });

  it('POST /test/validate → 400 + validation details', async () => {
    const res = await request(app.getHttpServer())
      .post('/test/validate')
      .expect(400);

    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details).toEqual([
      'email must be an email',
      'name should not be empty',
    ]);
  });

  it('GET /test/error → 500 내부 에러', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/error')
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  // @Exclude() / ClassSerializerInterceptor 공존 테스트는 Express E2E에서 검증.
  // Fastify 어댑터도 동일한 NestJS DI 순서를 따르므로 동작이 같음.
  // 별도 Fastify 테스트는 추가하지 않음 (Express 테스트로 충분).
});
