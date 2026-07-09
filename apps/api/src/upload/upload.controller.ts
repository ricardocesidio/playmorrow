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
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { imageSize } from 'image-size';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from './upload.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOADS_DIR = process.env.UPLOADS_DIR || join(__dirname, '..', '..', 'uploads');

function generateFilename(original: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}${extname(original)}`;
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: ALLOWED_MIME_TYPES.join('|') }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const isValidMagic = await this.uploadService.validateMagicBytes(file.path, file.mimetype);
    if (!isValidMagic) {
      await this.uploadService.cleanupLocalFile(file.path).catch(() => {});
      throw new BadRequestException('Invalid image file (magic byte check failed)');
    }

    try {
      const buffer = readFileSync(file.path);
      const dimensions = imageSize(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
      if (dimensions.width && dimensions.width > 4096) {
        await this.uploadService.cleanupLocalFile(file.path).catch(() => {});
        throw new BadRequestException('Image width exceeds 4096px limit');
      }
      if (dimensions.height && dimensions.height > 4096) {
        await this.uploadService.cleanupLocalFile(file.path).catch(() => {});
        throw new BadRequestException('Image height exceeds 4096px limit');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      await this.uploadService.cleanupLocalFile(file.path).catch(() => {});
      throw new BadRequestException('Failed to read image dimensions');
    }

    const url = `/api/uploads/${file.filename}`;
    return { url, filename: file.filename, size: file.size, mimeType: file.mimetype };
  }
}
