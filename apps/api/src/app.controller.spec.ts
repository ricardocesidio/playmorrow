import { Test, type TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it('returns API info', () => {
    const info = controller.getRoot();
    expect(info.name).toBe('Playmorrow API');
    expect(info.version).toBe('0.1.0');
  });
});
