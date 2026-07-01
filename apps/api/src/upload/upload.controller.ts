import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const UPLOADS_DIR = process.env.UPLOADS_DIR || join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Magic bytes signatures for allowed image types
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [new Uint8Array([0x47, 0x49, 0x46])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // RIFF header
};

function generateFilename(original: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}${extname(original)}`;
}

async function validateMagicBytes(filePath: string, mimeType: string): Promise<boolean> {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  const buffer = Buffer.alloc(16);
  const stream = createReadStream(filePath, { start: 0, end: 15 });
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk: string | Buffer) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : chunk;
      buf.copy(buffer);
    });
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });

  return signatures.some((sig) => sig.every((byte, i) => byte === buffer[i]));
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  async upload(
    @CurrentUser() _user: { id: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /\.(png|jpe?g|gif|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      await unlink(file.path).catch(() => {});
      throw new BadRequestException('Invalid file type');
    }

    const isValid = await validateMagicBytes(file.path, file.mimetype);
    if (!isValid) {
      await unlink(file.path).catch(() => {});
      throw new BadRequestException('File content does not match expected type');
    }

    const url = `/api/uploads/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}
