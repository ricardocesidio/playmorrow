import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { type TestingModule, type TestingModuleBuilder } from '@nestjs/testing';

/**
 * Creates a NestJS test application that mirrors production bootstrap:
 * - Same ValidationPipe options (minus whitelist — see note below)
 * - Same global prefix (`/api`, excluding `health`)
 * - No Swagger/CORS (not needed in tests)
 *
 * ## Why whitelist is disabled
 *
 * Production uses `whitelist: true` and `forbidNonWhitelisted: true`. These
 * require class-validator decorator metadata to be emitted by the compiler.
 * Vitest uses SWC (via `unplugin-swc`), which does not emit class-validator
 * metadata the same way `tsc` does. With whitelist enabled, ALL body
 * properties are stripped during test setup, causing requests like user
 * registration, studio creation, etc. to silently receive empty DTOs.
 *
 * The `transform` and `@IsIn`/`@IsEmail`/etc. decorators still work in tests
 * because they rely on runtime validation, not compile-time whitelisting.
 * Invalid type/reason/email tests return 400 as expected.
 *
 * If a future SWC version supports full decorator metadata, flip whitelist
 * back on and fix any test DTOs that lack decorators.
 */
export async function createTestApp(
  moduleBuilder: TestingModuleBuilder,
): Promise<{ app: TestingModule; nestApp: INestApplication; httpServer: unknown }> {
  const app = await moduleBuilder.compile();

  const nestApp = app.createNestApplication();

  // setGlobalPrefix BEFORE useGlobalPipes
  nestApp.setGlobalPrefix('api', { exclude: ['health'] });

  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,          // see note above — SWC limitation
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await nestApp.init();
  const httpServer = nestApp.getHttpServer();

  return { app, nestApp, httpServer };
}
