import { Injectable } from '@nestjs/common';
import { join, extname } from 'node:path';
import { diskStorage } from 'multer';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { imageSize } from 'image-size';

const UPLOADS_DIR = process.env.UPLOADS_DIR || join(__dirname, '..', '..', 'uploads');

export interface UploadedFileInfo {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  // Current implementation: local disk.
  // TODO (Performance/Architecture audit item): support STORAGE_PROVIDER=s3 or r2.
  // When switching, replace diskStorage with a streaming S3 upload and return a CDN URL.
  getMulterStorage() {
    return diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, cb) => {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        cb(null, `${ts}-${rand}${extname(file.originalname)}`);
      },
    });
  }

  getUploadsDir() {
    return UPLOADS_DIR;
  }

  async validateMagicBytes(filePath: string, mimeType: string): Promise<boolean> {
    const MAGIC_BYTES: Record<string, Uint8Array[]> = {
      'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
      'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
      'image/gif': [new Uint8Array([0x47, 0x49, 0x46])],
      'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
    };

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

  async cleanupLocalFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch {
      // ignore
    }
  }

  // Placeholder for future remote storage
  async uploadToRemote(_file: Express.Multer.File): Promise<UploadedFileInfo> {
    throw new Error('Remote storage (S3/R2) not yet implemented. See audit roadmap.');
  }
}
