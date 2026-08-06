import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';
import { SupportTicketStatus } from '@playmorrow/database';

import { logger } from '../common/logger';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UploadService } from '../upload/upload.service';
import type { CreateTicketDto } from './dto/create-ticket.dto';
import type { CreateReplyDto } from './dto/create-reply.dto';
import type { UpdateTicketDto } from './dto/update-ticket.dto';
import type { QueryTicketsDto } from './dto/query-tickets.dto';

const TICKET_INCLUDE = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  assignedTo: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  replies: {
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      attachments: { select: { id: true, filename: true, originalName: true, mimeType: true, size: true, url: true } },
    },
  },
  attachments: { select: { id: true, filename: true, originalName: true, mimeType: true, size: true, url: true } },
  history: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { id: true, username: true, displayName: true } } } },
  _count: { select: { replies: true, attachments: true } },
} as const;

const TICKET_LIST_INCLUDE = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  assignedTo: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { replies: true } },
} as const;

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly uploadService: UploadService,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto) {
    const ticketNumber = await this.generateTicketNumber();
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        title: dto.title,
        body: dto.body,
        department: dto.department ?? 'GENERAL',
        priority: dto.priority ?? 'MEDIUM',
        categoryId: dto.categoryId ?? null,
        authorId: userId,
      },
      include: TICKET_INCLUDE,
    });

    await this.addHistory(ticket.id, userId, 'CREATED');

    this.sendEmailNotification(ticket, 'created');

    logger.info({ msg: 'support ticket created', ticketId: ticket.id, ticketNumber, userId });

    return ticket;
  }

  async getTicket(ticketId: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: TICKET_INCLUDE,
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (ticket.authorId !== userId && user?.role !== 'ADMIN') {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async listMyTickets(userId: string, query: QueryTicketsDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const where: Prisma.SupportTicketWhereInput = { authorId: userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: TICKET_LIST_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async addReply(ticketId: string, userId: string, dto: CreateReplyDto, files?: Express.Multer.File[]) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isStaff = user?.role === 'ADMIN';

    if (ticket.authorId !== userId && !isStaff) {
      throw new NotFoundException('Ticket not found');
    }

    const reply = await this.prisma.supportReply.create({
      data: {
        ticketId,
        authorId: userId,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
        isStaff,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        attachments: { select: { id: true, filename: true, originalName: true, mimeType: true, size: true, url: true } },
      },
    });

    if (files && files.length > 0) {
      const attachmentRecords: typeof reply.attachments = [];
      for (const file of files) {
        const stored = await this.uploadService.storeFile(file);
        const attachment = await this.prisma.supportAttachment.create({
          data: {
            replyId: reply.id,
            filename: stored.filename,
            originalName: file.originalname,
            mimeType: stored.mimeType,
            size: stored.size,
            url: stored.url,
          },
        });
        attachmentRecords.push(attachment);
      }

      reply.attachments = attachmentRecords;
    }

    if (isStaff && ticket.status === 'WAITING_CUSTOMER') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'WAITING_SUPPORT' },
      });
    } else if (!isStaff && ticket.status === 'WAITING_SUPPORT') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'WAITING_CUSTOMER' },
      });
    }

    await this.addHistory(ticket.id, userId, 'REPLY_ADDED');

    this.sendEmailNotification(ticket, 'reply');

    return reply;
  }

  async listReplies(ticketId: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (ticket.authorId !== userId && user?.role !== 'ADMIN') {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportReply.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        attachments: { select: { id: true, filename: true, originalName: true, mimeType: true, size: true, url: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTicket(ticketId: string, userId: string, dto: UpdateTicketDto, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && ticket.authorId !== userId) {
      throw new NotFoundException('Ticket not found');
    }

    const data: Prisma.SupportTicketUpdateInput = {};

    if (dto.status) {
      if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
      if (dto.status === 'CLOSED') data.closedAt = new Date();
      data.status = dto.status;
      if (ticket.status !== dto.status) {
        await this.addHistory(ticket.id, userId, 'STATUS_CHANGED', ticket.status, dto.status);
      }
    }
    if (dto.priority && dto.priority !== ticket.priority) {
      data.priority = dto.priority;
      await this.addHistory(ticket.id, userId, 'PRIORITY_CHANGED', ticket.priority, dto.priority);
    }
    if (dto.department && dto.department !== ticket.department) {
      data.department = dto.department;
      await this.addHistory(ticket.id, userId, 'DEPARTMENT_CHANGED', ticket.department, dto.department);
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data,
      include: TICKET_INCLUDE,
    });

    if (dto.status) {
      this.sendEmailNotification(updated, 'status_changed');
    }

    return updated;
  }

  async listAllTickets(query: QueryTicketsDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const where: Prisma.SupportTicketWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { author: { username: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: TICKET_LIST_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async assignTicket(ticketId: string, assigneeId: string, adminId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: assigneeId,
        assignedAt: new Date(),
      },
      include: TICKET_INCLUDE,
    });

    await this.addHistory(ticket.id, adminId, 'ASSIGNED', ticket.assignedToId ?? undefined, assigneeId);

    logger.info({ msg: 'support ticket assigned', ticketId, assigneeId, adminId });

    return updated;
  }

  async getCategories() {
    return this.prisma.supportCategory.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear().toString();
    const prefix = `PM-${year}-`;

    const lastTicket = await this.prisma.supportTicket.findFirst({
      where: { ticketNumber: { startsWith: prefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });

    let nextSeq = 1;
    if (lastTicket) {
      const parts = lastTicket.ticketNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${nextSeq.toString().padStart(6, '0')}`;
  }

  private async addHistory(
    ticketId: string,
    actorId: string,
    action: string,
    fromValue?: string,
    toValue?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.supportTicketHistory.create({
      data: {
        ticketId,
        actorId,
        action,
        fromValue: fromValue ?? null,
        toValue: toValue ?? null,
        metadata: metadata ?? undefined,
      },
    });
  }

  private async sendEmailNotification(ticket: { id: string; title: string; authorId: string }, action: string) {
    try {
      const author = await this.prisma.user.findUnique({
        where: { id: ticket.authorId },
        select: { email: true, username: true },
      });

      if (!author) return;

      const notification = {
        recipientId: ticket.authorId,
        actorId: null,
        type: 'SUPPORT_TICKET',
        title: `Support ticket #${ticket.id.slice(0, 8)}: ${action.replace('_', ' ')}`,
        body: action === 'created' ? `Your ticket "${ticket.title}" has been created.` : `Your ticket "${ticket.title}" has been updated.`,
        targetType: 'SUPPORT_TICKET',
        targetId: ticket.id,
      };

      await this.notificationsService.create(notification);
    } catch (err) {
      logger.error({ err, msg: 'Failed to send support ticket email notification' });
    }
  }
}
