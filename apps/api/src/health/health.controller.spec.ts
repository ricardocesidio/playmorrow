import { HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController (integration)', () => {
  let app: TestingModule;
  let httpServer: unknown;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: async () => [{ '?column?': 1 }],
          },
        },
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
  });

  it('GET /health returns ok status', async () => {
    const res = await request(httpServer).get('/health');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('playmorrow-api');
    expect(res.body.version).toBe('0.1.0');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health with DB error returns degraded', async () => {
    const errorApp = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: async () => { throw new Error('DB down'); },
          },
        },
      ],
    }).compile();

    const errorNestApp = errorApp.createNestApplication();
    errorNestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await errorNestApp.init();

    const res = await request(errorNestApp.getHttpServer()).get('/health');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('degraded');
    expect(res.body.service).toBe('playmorrow-api');

    await errorNestApp.close();
  });
});
