import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import express from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

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
  const uploadsDir = join(process.cwd(), 'apps', 'api', 'uploads');
  app.use('/api/uploads', express.static(uploadsDir));

  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // OpenAPI / Swagger docs at /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Playmorrow API')
    .setDescription('The social discovery layer for indie games.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);

  console.log(`🚀  Playmorrow API ready at http://localhost:${port} (docs: /docs)`);
}

void bootstrap();
