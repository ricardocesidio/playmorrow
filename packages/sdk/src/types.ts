export interface Game {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  status: string;
  isFree: boolean;
  priceCents: number | null;
  followersCount: number;
  wishlistsCount: number;
  studio: { id: string; name: string; slug: string };
  tags: { id: string; name: string }[];
  createdAt: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  memberCount: number;
}

export interface Devlog {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  publishedAt: string | null;
  readingTimeMin: number | null;
  game: { id: string; title: string; slug: string };
  author: { id: string; username: string };
}

export interface SearchResult {
  games: { items: Game[]; total: number };
  studios: { items: Studio[]; total: number };
  devlogs: { items: Devlog[]; total: number };
}

export interface Collection {
  slug: string;
  label: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
