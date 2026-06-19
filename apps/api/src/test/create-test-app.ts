import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { type TestingModule, type TestingModuleBuilder } from '@nestjs/testing';

/**
 * Creates a NestJS test application that mirrors production bootstrap:
 * - Same ValidationPipe options as prod (`main.ts`)
 * - Same global prefix (`/api`, excluding `health`)
 * - No Swagger/CORS (not needed in tests)
 *
 * ## ValidationPipe parity (handoff #1, resolved)
 *
 * This harness uses the SAME options as production: `whitelist: true` and
 * `forbidNonWhitelisted: true`. An earlier note claimed SWC (via `unplugin-swc`)
 * couldn't emit the metadata whitelisting needs, so the flags were disabled —
 * that claim was stale. class-validator's whitelist relies on its own decorator
 * metadata storage (populated when `@IsString`/`@IsIn`/etc. run at class-definition
 * time), NOT on TypeScript's `emitDecoratorMetadata`. With the flags enabled the
 * full suite stays green (222/222), and unknown body props are rejected with 400
 * exactly as in prod (see the regression test in `reactions.controller.spec.ts`).
 *
 * Keep these in lockstep with `apps/api/src/main.ts` so tests exercise the same
 * validation behaviour as production.
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
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await nestApp.init();
  const httpServer = nestApp.getHttpServer();

  return { app, nestApp, httpServer };
}
