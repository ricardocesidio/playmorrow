/**
 * Transport-level contracts shared between the Next.js web app and the NestJS API.
 * These are intentionally framework-agnostic and runtime-free (types only).
 */

/** Standard cursor/offset paginated envelope returned by list endpoints. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Common query params for list endpoints. */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** Uniform error body the API returns on failure. */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  /** Optional machine-readable code for the frontend to branch on. */
  code?: string;
}

/** Health-check payload exposed at `GET /health`. */
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

/** ISO-8601 timestamp string (branded for clarity). */
export type ISODateString = string;

/** Fields every persisted entity carries. */
export interface BaseEntity {
  id: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
