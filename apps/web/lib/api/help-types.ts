export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  categoryId: string;
  category: HelpCategory;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  readingTimeMin: number | null;
  authorId: string;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  articleCount?: number;
}

export interface PaginatedHelpArticles {
  items: HelpArticle[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateHelpArticleDto {
  title: string;
  slug: string;
  description: string;
  body: string;
  categoryId: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
}

export interface UpdateHelpArticleDto {
  title?: string;
  slug?: string;
  description?: string;
  body?: string;
  categoryId?: string;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
}
