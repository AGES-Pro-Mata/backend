/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  __esModule: true,
  S3Client: jest.fn(() => ({
    send: sendMock,
  })),
  PutObjectCommand: jest.fn((input) => ({ input })),
  DeleteObjectCommand: jest.fn((input) => ({ input })),
}));

jest.mock('sharp', () => {
  const sharpInstance = {
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-image')),
  };

  const sharpFn = jest.fn(() => sharpInstance);

  return {
    __esModule: true,
    default: sharpFn,
  };
});

describe('StorageService', () => {
  const createConfigMock = (overrides?: Partial<Record<string, string | undefined>>) => {
    const values: Record<string, string | undefined> = {
      AWS_S3_BUCKET: 'my-bucket',
      AWS_S3_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'access-key',
      AWS_SECRET_ACCESS_KEY: 'secret-key',
      ...overrides,
    };

    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  };

  beforeEach(() => {
    sendMock.mockReset();
  });

  describe('constructor', () => {
    it('should throw when bucket is not set', () => {
      const config = createConfigMock({ AWS_S3_BUCKET: '' });

      expect(() => new StorageService(config)).toThrow(
        'AWS_S3_BUCKET environment variable is not set',
      );
    });

    it('should throw when region is not set', () => {
      const config = createConfigMock({ AWS_S3_REGION: '' });

      expect(() => new StorageService(config)).toThrow(
        'AWS_S3_REGION environment variable is not set',
      );
    });

    it('should create S3 client when config is valid', () => {
      const config = createConfigMock();

      const service = new StorageService(config);

      expect(service.getFileUrl('test/key')).toBe(
        'https://my-bucket.s3.us-east-1.amazonaws.com/test/key',
      );
    });
  });

  describe('uploadFile', () => {
    it('should throw BadRequestException when file is not provided', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(null as any)).rejects.toThrow('No file provided');
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('should upload non-image file without compression', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      const file = {
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('file-data'),
        size: 9,
      } as Express.Multer.File;

      sendMock.mockResolvedValueOnce(undefined);

      const result = await service.uploadFile(file, {
        directory: 'docs',
        contentType: 'application/pdf',
        cacheControl: 'no-cache',
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const commandArg = sendMock.mock.calls[0][0] as { input: any };
      expect(commandArg.input.Bucket).toBe('my-bucket');
      expect(commandArg.input.Key).toMatch(/^docs\//);
      expect(commandArg.input.Body).toBe(file.buffer);
      expect(commandArg.input.ContentType).toBe('application/pdf');
      expect(commandArg.input.CacheControl).toBe('no-cache');

      expect(result.url).toMatch(/^https:\/\/my-bucket\.s3\.us-east-1\.amazonaws\.com\/docs\//);
    });

    it('should upload image file with compression and webp content type', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      const file = {
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 11,
      } as Express.Multer.File;

      sendMock.mockResolvedValueOnce(undefined);

      const result = await service.uploadFile(file, {
        directory: 'images',
        cacheControl: 'public, max-age=31536000',
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const commandArg = sendMock.mock.calls[0][0] as { input: any };
      expect(commandArg.input.Bucket).toBe('my-bucket');
      expect(commandArg.input.Key).toMatch(/^images\//);
      expect(Buffer.isBuffer(commandArg.input.Body)).toBe(true);
      expect(commandArg.input.Body.toString()).toBe('compressed-image');
      expect(commandArg.input.ContentType).toBe('image/webp');
      expect(commandArg.input.CacheControl).toBe('public, max-age=31536000');

      expect(result.url).toMatch(/^https:\/\/my-bucket\.s3\.us-east-1\.amazonaws\.com\/images\//);
    });

    it('should throw InternalServerErrorException when S3 upload fails', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      const file = {
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('file-data'),
        size: 9,
      } as Express.Multer.File;

      sendMock.mockRejectedValueOnce(new Error('S3 error'));
      const uploadPromise = service.uploadFile(file);

      await expect(uploadPromise).rejects.toThrow(InternalServerErrorException);
      await expect(uploadPromise).rejects.toThrow('Failed to upload file');
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      sendMock.mockResolvedValueOnce(undefined);

      await service.deleteFile('path/to/file.txt');

      expect(sendMock).toHaveBeenCalledTimes(1);
      const commandArg = sendMock.mock.calls[0][0] as { input: any };
      expect(commandArg.input.Bucket).toBe('my-bucket');
      expect(commandArg.input.Key).toBe('path/to/file.txt');
    });

    it('should throw InternalServerErrorException when S3 delete fails', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      sendMock.mockRejectedValueOnce(new Error('S3 delete error'));
      const deletePromise = service.deleteFile('path/to/file.txt');

      await expect(deletePromise).rejects.toThrow(InternalServerErrorException);
      await expect(deletePromise).rejects.toThrow('Failed to delete file');
    });
  });

  describe('deleteFileByUrl', () => {
    it('should parse URL and call deleteFile', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      const deleteFileSpy = jest
        .spyOn(service as any, 'deleteFile')
        .mockResolvedValueOnce(undefined);

      await service.deleteFileByUrl('https://my-bucket.s3.us-east-1.amazonaws.com/folder/file.txt');

      expect(deleteFileSpy).toHaveBeenCalledWith('folder/file.txt');
    });

    it('should throw InternalServerErrorException when URL is invalid', async () => {
      const config = createConfigMock();
      const service = new StorageService(config);

      await expect(service.deleteFileByUrl('not-a-valid-url')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.deleteFileByUrl('not-a-valid-url')).rejects.toThrow(
        'Failed to delete file by URL',
      );
    });
  });
});
