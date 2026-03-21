import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SAFE_RESPONSE_OPTIONS } from './constants';
import {
  SafeResponseModuleOptions,
  SafeResponseModuleAsyncOptions,
} from './interfaces';
import { SafeResponseInterceptor } from './interceptors/safe-response.interceptor';
import { SafeExceptionFilter } from './filters/safe-exception.filter';

@Module({})
export class SafeResponseModule {
  static register(options: SafeResponseModuleOptions = {}): DynamicModule {
    return {
      module: SafeResponseModule,
      global: true,
      providers: [
        {
          provide: SAFE_RESPONSE_OPTIONS,
          useValue: options,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: SafeResponseInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: SafeExceptionFilter,
        },
      ],
    };
  }

  static registerAsync(
    options: SafeResponseModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: SafeResponseModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: SAFE_RESPONSE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: SafeResponseInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: SafeExceptionFilter,
        },
      ],
    };
  }
}
