import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);

  reportError(context: string, error: unknown, metadata?: Record<string, unknown>) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`[${context}] ${message}`, stack, metadata);
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      stack,
      metadata,
      timestamp: new Date().toISOString(),
    }));
  }
}
