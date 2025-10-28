import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import sharp from 'sharp';

const randomFileName = () => crypto.randomBytes(16).toString('hex');

export interface UploadOptions {
  directory?: string;
  contentType?: string;
  cacheControl?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET')?.trim() ?? '';
    this.region = this.configService.get<string>('AWS_S3_REGION')?.trim() ?? '';
    this.accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID')?.trim() ?? '';
    this.secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY')?.trim() ?? '';

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    if (!this.region) {
      throw new Error('AWS_S3_REGION environment variable is not set');
    }
    const credentials =
      this.accessKeyId && this.secretAccessKey
        ? {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          }
        : undefined;

    this.client = new S3Client({
      region: this.region,
      forcePathStyle: true,
      credentials,
    });
  }

  async uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const directory = options?.directory || 'uploads';
    const fileName = `${directory}/${randomFileName()}`;

    try {
      let fileBuffer = file.buffer;
      let contentType = options?.contentType || file.mimetype;

      if (this.isImage(file.mimetype)) {
        const compressionResult = await this.compressImage(file.buffer, file.mimetype);
        fileBuffer = compressionResult.buffer;
        contentType = compressionResult.contentType;
        this.logger.log(
          `Image compressed: ${file.size} bytes -> ${fileBuffer.length} bytes (${Math.round((1 - fileBuffer.length / file.size) * 100)}% reduction)`,
        );
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: options?.cacheControl,
      });

      await this.client.send(command);

      const url = this.getFileUrl(fileName);
      this.logger.log(`File uploaded successfully: ${fileName}`);
      return { url };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.client.send(command);

      this.logger.log(`File deleted successfully: ${fileKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async deleteFileByUrl(url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      const fileKey = urlObj.pathname.substring(1);

      await this.deleteFile(fileKey);
    } catch (error) {
      this.logger.error(`Failed to parse URL or delete file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file by URL');
    }
  }

  getFileUrl(fileKey: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private async compressImage(
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const image = sharp(buffer);

      let compressedBuffer: Buffer;
      let contentType: string;

      if (mimetype === 'image/png') {
        compressedBuffer = await image.png({ quality: 80, compressionLevel: 9 }).toBuffer();
        contentType = 'image/png';
      } else if (mimetype === 'image/gif') {
        compressedBuffer = buffer;
        contentType = 'image/gif';
      } else {
        compressedBuffer = await image.webp({ quality: 80 }).toBuffer();
        contentType = 'image/webp';
      }

      return { buffer: compressedBuffer, contentType };
    } catch (error) {
      this.logger.error(`Failed to compress image: ${error.message}`, error.stack);
      return { buffer, contentType: mimetype };
    }
  }
}
