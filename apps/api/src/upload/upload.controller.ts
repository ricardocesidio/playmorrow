import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import type { Express } from 'express';

// Express.Multer.File is provided by @types/multer

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const UPLOADS_DIR = join(process.cwd(), 'apps', 'api', 'uploads');

function generateFilename(original: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}${extname(original)}`;
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
      }),
    }),
  )
  @ApiBearerAuth()
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
          new FileTypeValidator({ fileType: /\.(png|jpe?g|gif|webp|svg)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = `/api/uploads/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}
