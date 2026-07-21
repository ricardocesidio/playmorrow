import 'reflect-metadata';
import { loadEnvFile } from 'node:process';

try { loadEnvFile('.env'); } catch { /* no .env file — env vars provided by runtime */ }

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as crypto from 'node:crypto';

import * as Sentry from '@sentry/node';
import { logger, logRequest, createContextLogger } from './common/logger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Fail fast in production if critical secrets are missing.
  // This prevents confusing 500s (e.g. on register) caused by misconfigured deploys.
  const nodeEnv = config.get<string>('NODE_ENV') || 'development';
  const isProd = nodeEnv === 'production';

  const requiredInProd = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',   // used for cookie/session security
    'CSRF_SECRET',      // required for global HMAC CSRF
    'RESEND_API_KEY',   // email verification & invites
    'WEB_ORIGIN',
  ];

  if (isProd) {
    const missing = requiredInProd.filter((key) => !config.get<string>(key));
    if (missing.length > 0) {
      // Log clearly and exit so Railway shows the real problem immediately.
       
      console.error('❌ FATAL: Missing required production environment variables:', missing.join(', '));
       
      console.error('   Set them in the Railway dashboard and redeploy.');
      process.exit(1);
    }

    // Recommended for full prod (from audit env var audit)
    const recommended = ['COOKIE_DOMAIN', 'SENTRY_DSN', 'NODE_ENV'];
    const missingRecommended = recommended.filter((key) => !config.get<string>(key));
    if (missingRecommended.length > 0) {
      logger.warn('Recommended production env vars not set (may cause subtle issues): ' + missingRecommended.join(', '));
    }
  }

  // Sentry (error tracking) — from the elite audit Observability section
  const sentryDsn = config.get<string>('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: nodeEnv,
      tracesSampleRate: isProd ? 0.15 : 1.0,
      // Integrations can be added here later (e.g. Http, Prisma)
    });
    logger.info('✅ Sentry initialized');
  } else if (isProd) {
    logger.warn('⚠️  SENTRY_DSN not set — production errors will have no visibility (see PRODUCTION.md)');
  }

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  // Security headers
  const scriptSrc = isProd
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc,
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:*'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", "https://*.vercel.app", "https://*.neon.tech", "http://localhost:*"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        reportUri: "/api/csp-report",
      },
    },
  }));

  // Cookie parser for session auth
  app.use(cookieParser());

  // Structured request logging with pino (Observability item from elite audit)
  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || crypto.randomBytes(8).toString('hex');
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const start = Date.now();
    const userId = (req as any).user?.id ?? null;

    // Attach contextual logger for the request (polish for tracing)
    req.log = createContextLogger({ requestId, userId: userId || undefined });

    res.on('finish', () => {
      const duration = Date.now() - start;
      logRequest({
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        latencyMs: duration,
        requestId,
        userId,
        ip: req.ip,
      });
    });
    next();
  });

  // Strip unknown props, transform payloads into DTO instances.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Serve uploaded files at /api/uploads/*
  const uploadsDir = process.env.UPLOADS_DIR || join(__dirname, '..', 'uploads');
  app.use('/api/uploads', express.static(uploadsDir));

  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // OpenAPI / Swagger docs at /docs (disabled in production)
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Playmorrow API')
      .setDescription('The social discovery layer for indie games.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);

  const docs = isProd ? '' : ' (docs: /docs)';
  logger.info(`🚀 Playmorrow API ready at http://localhost:${port}${docs}`);
}

void bootstrap();
