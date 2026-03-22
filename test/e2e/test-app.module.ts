import { Module } from '@nestjs/common';
import { SafeResponseModule } from '../../src/safe-response.module';
import { TestController } from './test.controller';

@Module({
  imports: [SafeResponseModule.register()],
  controllers: [TestController],
})
export class TestAppModule {}

@Module({
  imports: [
    SafeResponseModule.register({
      timestamp: false,
      path: false,
    }),
  ],
  controllers: [TestController],
})
export class TestAppNoMetaModule {}

@Module({
  imports: [
    SafeResponseModule.register({
      dateFormatter: () => '2025-01-01T00:00:00Z',
    }),
  ],
  controllers: [TestController],
})
export class TestAppCustomDateModule {}

@Module({
  imports: [
    SafeResponseModule.register({
      errorCodeMapper: (exception) => {
        if (
          exception instanceof Error &&
          exception.message === 'Unexpected error'
        ) {
          return 'CUSTOM_INTERNAL';
        }
        return undefined;
      },
    }),
  ],
  controllers: [TestController],
})
export class TestAppCustomErrorCodeModule {}

@Module({
  imports: [
    SafeResponseModule.register({
      transformResponse: (data) => {
        if (data && typeof data === 'object' && 'password' in data) {
          const { password, ...rest } = data as Record<string, unknown>;
          return rest;
        }
        return data;
      },
    }),
  ],
  controllers: [TestController],
})
export class TestAppTransformModule {}

@Module({
  imports: [
    SafeResponseModule.register({
      successCodeMapper: (statusCode) => {
        const map: Record<number, string> = { 200: 'OK', 201: 'CREATED' };
        return map[statusCode];
      },
    }),
  ],
  controllers: [TestController],
})
export class TestAppSuccessCodeModule {}

@Module({
  imports: [
    SafeResponseModule.register({
      successCodeMapper: () => 'MAPPER_CODE',
    }),
  ],
  controllers: [TestController],
})
export class TestAppSuccessCodePriorityModule {}
