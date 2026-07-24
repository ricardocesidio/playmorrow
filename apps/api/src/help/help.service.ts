import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { UpdateArticleDto } from './dto/update-article.dto';
import type { QueryArticlesDto } from './dto/query-articles.dto';
import type { FeedbackDto } from './dto/feedback.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

const ARTICLE_INCLUDE = {
  category: { select: { id: true, slug: true, title: true, icon: true } },
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  _count: { select: { feedback: true } },
} as const;

@Injectable()
export class HelpService {
  constructor(private readonly prisma: PrismaService) {}

  private computeReadingTime(body: string): number {
    return Math.ceil(body.split(/\s+/).length / 200);
  }

  // ─── Articles ────────────────────────────────────────────────────────────

  async createArticle(userId: string, dto: CreateArticleDto) {
    const existing = await this.prisma.helpArticle.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException('An article with this slug already exists');
    }

    const readingTimeMin = this.computeReadingTime(dto.body);

    return this.prisma.helpArticle.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description ?? null,
        body: dto.body,
        categoryId: dto.categoryId ?? null,
        tags: dto.tags ?? [],
        authorId: userId,
        isPublished: dto.isPublished ?? false,
        isFeatured: dto.isFeatured ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
        readingTimeMin,
      },
      include: ARTICLE_INCLUDE,
    });
  }

  async updateArticle(articleId: string, dto: UpdateArticleDto) {
    const article = await this.prisma.helpArticle.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (dto.slug && dto.slug !== article.slug) {
      const existing = await this.prisma.helpArticle.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException('An article with this slug already exists');
      }
    }

    const data: Prisma.HelpArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.body !== undefined) {
      data.body = dto.body;
      data.readingTimeMin = this.computeReadingTime(dto.body);
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
      data.publishedAt = dto.isPublished ? new Date() : null;
    }
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;

    return this.prisma.helpArticle.update({
      where: { id: articleId },
      data,
      include: ARTICLE_INCLUDE,
    });
  }

  async deleteArticle(articleId: string) {
    const article = await this.prisma.helpArticle.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    await this.prisma.helpArticle.delete({ where: { id: articleId } });
    return { deleted: true };
  }

  async getArticle(slug: string) {
    const article = await this.prisma.helpArticle.findUnique({
      where: { slug },
      include: {
        ...ARTICLE_INCLUDE,
        feedback: {
          select: {
            id: true,
            helpful: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, username: true, displayName: true } },
          },
        },
      },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async listArticles(query: QueryArticlesDto, includeUnpublished = false) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.HelpArticleWhereInput = {};

    if (!includeUnpublished) {
      where.isPublished = true;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    if (query.tag) {
      where.tags = { has: query.tag };
    }

    const [articles, total] = await Promise.all([
      this.prisma.helpArticle.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.helpArticle.count({ where }),
    ]);

    return {
      items: articles,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async searchArticles(q: string) {
    if (!q || q.length < 2) {
      return [];
    }

    return this.prisma.helpArticle.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      },
      include: ARTICLE_INCLUDE,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: 20,
    });
  }

  // ─── Categories ──────────────────────────────────────────────────────────

  async listCategories() {
    return this.prisma.helpCategory.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { articles: true } },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.helpCategory.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        position: dto.position ?? 0,
      },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.helpCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const data: Prisma.HelpCategoryUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.position !== undefined) data.position = dto.position;

    return this.prisma.helpCategory.update({
      where: { id: categoryId },
      data,
    });
  }

  async deleteCategory(categoryId: string) {
    const category = await this.prisma.helpCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.prisma.helpCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
    return { deleted: true };
  }

  async togglePublish(articleId: string) {
    const article = await this.prisma.helpArticle.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const nowPublished = !article.isPublished;
    return this.prisma.helpArticle.update({
      where: { id: articleId },
      data: {
        isPublished: nowPublished,
        publishedAt: nowPublished ? new Date() : null,
      },
      include: ARTICLE_INCLUDE,
    });
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  async submitFeedback(articleId: string, userId: string, dto: FeedbackDto) {
    const article = await this.prisma.helpArticle.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.helpArticleFeedback.upsert({
      where: {
        articleId_userId: { articleId, userId },
      },
      create: {
        articleId,
        userId,
        helpful: dto.helpful,
        comment: dto.comment ?? null,
      },
      update: {
        helpful: dto.helpful,
        comment: dto.comment ?? null,
      },
    });
  }

  async getArticleFeedback(articleId: string) {
    const feedback = await this.prisma.helpArticleFeedback.findMany({
      where: { articleId },
    });

    const total = feedback.length;
    const helpful = feedback.filter((f) => f.helpful).length;

    return {
      total,
      helpful,
      notHelpful: total - helpful,
      helpfulPercent: total > 0 ? Math.round((helpful / total) * 100) : 0,
    };
  }
}
