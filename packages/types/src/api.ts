export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks?: {
    database?: boolean;
    emailProvider?: boolean;
    [key: string]: boolean | undefined;
  };
}
