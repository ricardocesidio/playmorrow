import { Injectable } from '@nestjs/common';
import { join, extname } from 'node:path';
import { diskStorage } from 'multer';
import { writeFile, unlink } from 'node:fs/promises';
import { imageSize } from 'image-size';

const UPLOADS_DIR = process.env.UPLOADS_DIR || join(__dirname, '..', '..', 'uploads');
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

export interface UploadedFileInfo {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  /**
   * Returns multer storage engine based on STORAGE_PROVIDER env.
   * Supports 'local' (default), 's3', 'r2'.
   * For S3/R2, we use memoryStorage in controller and handle in storeFile.
   */
  getMulterStorage() {
    if (STORAGE_PROVIDER === 'local') {
      return diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const ts = Date.now();
          const rand = Math.random().toString(36).slice(2, 8);
          cb(null, `${ts}-${rand}${extname(file.originalname)}`);
        },
      });
    }
    // For remote, controller uses memoryStorage; storage handled in storeFile
    return undefined;
  }

  getUploadsDir() {
    return UPLOADS_DIR;
  }

  async validateMagicBytes(filePath: string, mimeType: string): Promise<boolean> {
    // Legacy for disk path - kept for compatibility
    const MAGIC_BYTES: Record<string, Uint8Array[]> = {
      'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
      'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
      'image/gif': [new Uint8Array([0x47, 0x49, 0x46])],
      'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
    };

    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;

    const { createReadStream } = await import('node:fs');
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

    if (mimeType === 'image/webp') {
      const riffOk = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
      const webpOk = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
      return riffOk && webpOk;
    }

    return signatures.some((sig) => sig.every((byte, i) => byte === buffer[i]));
  }

  async validateMagicBytesFromBuffer(buffer: Buffer, mimeType: string): Promise<boolean> {
    const MAGIC_BYTES: Record<string, Uint8Array[]> = {
      'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
      'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
      'image/gif': [new Uint8Array([0x47, 0x49, 0x46])],
      'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46]), new Uint8Array([0x57, 0x45, 0x42, 0x50])],
    };

    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;

    const header = buffer.slice(0, 16);

    // WebP requires both RIFF header AND WEBP identifier
    if (mimeType === 'image/webp') {
      const riffOk = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
      const webpOk = header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;
      return riffOk && webpOk;
    }

    return signatures.some((sig) => sig.every((byte, i) => byte === header[i]));
  }

  async cleanupLocalFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch {
      // File may not exist — acceptable cleanup failure
    }
  }

  /**
   * Main entry to store the file.
   * Supports local disk and stub for S3/R2 (configurable via STORAGE_PROVIDER).
   * For real S3/R2: install @aws-sdk/client-s3, configure credentials, upload buffer, return CDN URL.
   */
  async storeFile(file: Express.Multer.File): Promise<UploadedFileInfo> {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extname(file.originalname)}`;

    if (STORAGE_PROVIDER === 'local') {
      const filePath = join(UPLOADS_DIR, filename);
      await writeFile(filePath, file.buffer);
      return {
        url: `/api/uploads/${filename}`,
        filename,
        size: file.size,
        mimeType: file.mimetype,
      };
    }

    if (STORAGE_PROVIDER === 's3' || STORAGE_PROVIDER === 'r2') {
      throw new Error(`STORAGE_PROVIDER=${STORAGE_PROVIDER} is not implemented. Install @aws-sdk/client-s3 and implement upload, or use STORAGE_PROVIDER=local.`);
    }

    throw new Error(`Unknown STORAGE_PROVIDER=${STORAGE_PROVIDER}. Set STORAGE_PROVIDER=local for local disk storage.`);
  }
}
