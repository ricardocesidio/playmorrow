import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Playmorrow API',
      version: '0.1.0',
      docs: '/docs',
      tagline: "Discover tomorrow's indie games today.",
    };
  }
}
