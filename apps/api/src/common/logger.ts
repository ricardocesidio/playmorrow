import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  base: undefined, // keep logs clean
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }),
});

// Helper for request logging
export function logRequest(data: {
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  requestId: string;
  userId?: string | null;
  ip?: string;
}) {
  const level = data.status >= 500 ? 'error' : data.status >= 400 ? 'warn' : 'info';
  logger[level]({
    ...data,
    msg: `${data.method} ${data.path} ${data.status} ${data.latencyMs}ms`,
  });
}

// Create a child logger with context (e.g. requestId, service) for consistent tracing
export function createContextLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
