import { PlaymorrowClient } from './client';
import type { Game, Studio, Devlog, SearchResult, Collection, User } from './types';

export { PlaymorrowClient };
export type { Game, Studio, Devlog, SearchResult, Collection, User };

export function createClient(options: { apiKey?: string; baseUrl?: string }) {
  return new PlaymorrowClient(options);
}
