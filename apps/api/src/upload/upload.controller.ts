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
import { memoryStorage } from 'multer';
import { imageSize } from 'image-size';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from './upload.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
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
    // Validate using buffer (supports both local and remote storage)
    const isValidMagic = await this.uploadService.validateMagicBytesFromBuffer(file.buffer, file.mimetype);
    if (!isValidMagic) {
      throw new BadRequestException('Invalid image file (magic byte check failed)');
    }

    try {
      const dimensions = imageSize(new Uint8Array(file.buffer));
      if (dimensions.width && dimensions.width > 4096) {
        throw new BadRequestException('Image width exceeds 4096px limit');
      }
      if (dimensions.height && dimensions.height > 4096) {
        throw new BadRequestException('Image height exceeds 4096px limit');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Failed to read image dimensions');
    }

    const stored = await this.uploadService.storeFile(file);
    return stored;
  }
}
