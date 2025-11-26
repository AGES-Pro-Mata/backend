import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { InsertRequestDto } from './requests.model';
import { ReceiptType, RequestType } from 'generated/prisma';

describe('RequestsService', () => {
  let service: RequestsService;
  let databaseService: any;
  let mailService: any;
  let configService: any;

  beforeEach(async () => {
    const mockDatabaseService = {
      reservationGroup: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      requests: {
        create: jest.fn(),
      },
    };

    const mockMailService = {
      sendTemplateMail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('https://frontend.example.com'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    databaseService = module.get(DatabaseService);
    mailService = module.get(MailService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('getRequestsByIdReservationGroupAdmin', () => {
    it('should map reservation group events and flags correctly', async () => {
      const reservationGroupId = 'rg-1';
      const adminUser = { id: 'admin-1' };

      const firstDate = new Date('2025-01-01T10:00:00Z');
      const secondDate = new Date('2025-01-02T10:00:00Z');

      const reservationGroup = {
        userId: 'user-1',
        requests: [
          {
            id: 'req-1',
            type: RequestType.CREATED,
            description: 'created',
            fileUrl: null,
            createdAt: firstDate,
            createdBy: {
              id: 'admin-1',
              name: 'Admin',
              email: 'admin@example.com',
            },
          },
          {
            id: 'req-2',
            type: RequestType.PAYMENT_SENT,
            description: 'payment',
            fileUrl: 'file-url',
            createdAt: secondDate,
            createdBy: {
              id: 'user-1',
              name: 'User',
              email: 'user@example.com',
            },
          },
        ],
      };

      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(reservationGroup as never);

      const result = await service.getRequestsByIdReservationGroupAdmin(
        reservationGroupId,
        adminUser as any,
      );

      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalled();
      expect(result.events).toHaveLength(2);
      expect(result.createdAt).toEqual(firstDate);
      expect(result.status).toBe(RequestType.PAYMENT_SENT);

      const [firstEvent, secondEvent] = result.events;
      expect(firstEvent.isSender).toBe(true);
      expect(firstEvent.isRequester).toBe(false);
      expect(secondEvent.isSender).toBe(false);
      expect(secondEvent.isRequester).toBe(true);
    });

    it('should throw NotFoundException when reservation group does not exist', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(null);

      const promise = service.getRequestsByIdReservationGroupAdmin('rg-unknown', {
        id: 'admin-1',
      } as any);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('ReservationGroup requests not found');
    });
  });

  describe('getProfessorRequests', () => {
    it('should return latest professor request', async () => {
      const professorId = 'prof-1';
      const latestRequest = {
        id: 'req-1',
        type: RequestType.DOCUMENT_REQUESTED,
        description: 'Desc',
        createdAt: new Date(),
        fileUrl: 'file-url',
      };

      databaseService.user.findUnique.mockResolvedValueOnce({
        ProfessorRequests: [latestRequest],
      } as never);

      const result = await service.getProfessorRequests(professorId);

      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: professorId,
          ProfessorRequests: {
            some: {},
          },
        },
        select: {
          ProfessorRequests: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              type: true,
              description: true,
              createdAt: true,
              fileUrl: true,
            },
          },
        },
      });

      expect(result).toEqual(latestRequest);
    });

    it('should throw NotFoundException when professor has no requests', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      const promise = service.getProfessorRequests('prof-unknown');
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Professor requests not found');
    });
  });

  describe('insertRequest', () => {
    it('should throw when neither professorId nor reservationGroupId is provided', async () => {
      const dto: InsertRequestDto = {
        type: RequestType.CREATED,
      } as never;

      await expect(service.insertRequest('admin-1', dto)).rejects.toThrow(BadRequestException);
      await expect(service.insertRequest('admin-1', dto)).rejects.toThrow(
        'ProfessorId and ReservationGroupId not found',
      );
    });

    it('should throw when professorId is provided with non professor request type', async () => {
      const dto: InsertRequestDto = {
        type: RequestType.PAYMENT_SENT,
        professorId: 'prof-1',
      } as never;

      await expect(service.insertRequest('admin-1', dto)).rejects.toThrow(BadRequestException);
      await expect(service.insertRequest('admin-1', dto)).rejects.toThrow(
        `${RequestType.PAYMENT_SENT} is not valid for professor requests`,
      );
    });

    it('should throw when reservationGroupId is provided with professor request type', async () => {
      const dto: InsertRequestDto = {
        type: RequestType.DOCUMENT_APPROVED,
        reservationGroupId: 'rg-1',
      } as never;

      await expect(service.insertRequest('admin-1', dto)).rejects.toThrow(BadRequestException);
      await expect(service.insertRequest('admin-1', dto)).rejects.toThrow(
        `${RequestType.DOCUMENT_APPROVED} is not valid for reservation requests`,
      );
    });

    it('should create reservation request and call related helpers for PAYMENT_APPROVED', async () => {
      const dto: InsertRequestDto = {
        type: RequestType.PAYMENT_APPROVED,
        reservationGroupId: 'rg-1',
      } as never;

      const spyStatusEmail = jest
        .spyOn<any, any>(service as any, 'sendStatusChangeEmail')
        .mockResolvedValueOnce(undefined);
      const spyDocency = jest
        .spyOn<any, any>(service as any, 'createReceiptDocency')
        .mockResolvedValueOnce(undefined);
      const spyPayment = jest
        .spyOn<any, any>(service as any, 'createReceiptPayment')
        .mockResolvedValueOnce(undefined);

      const created = { id: 'req-1' };
      databaseService.requests.create.mockResolvedValueOnce(created as never);

      const result = await service.insertRequest('admin-1', dto);

      expect(spyStatusEmail).toHaveBeenCalledWith('rg-1');
      expect(spyPayment).toHaveBeenCalledWith('rg-1');
      expect(spyDocency).not.toHaveBeenCalled();

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          createdByUserId: 'admin-1',
          fileUrl: undefined,
        },
      });

      expect(result).toEqual(created);
    });

    it('should create professor request and use fileUrl from createReceiptDocency', async () => {
      const dto: InsertRequestDto = {
        type: RequestType.DOCUMENT_APPROVED,
        professorId: 'prof-1',
      } as never;

      const spyStatusEmail = jest
        .spyOn<any, any>(service as any, 'sendStatusChangeEmail')
        .mockResolvedValueOnce(undefined);
      const spyDocency = jest
        .spyOn<any, any>(service as any, 'createReceiptDocency')
        .mockResolvedValueOnce('doc-url');
      const spyPayment = jest
        .spyOn<any, any>(service as any, 'createReceiptPayment')
        .mockResolvedValueOnce(undefined);

      const created = { id: 'req-2' };
      databaseService.requests.create.mockResolvedValueOnce(created as never);

      const result = await service.insertRequest('admin-1', dto);

      expect(spyStatusEmail).not.toHaveBeenCalled();
      expect(spyPayment).not.toHaveBeenCalled();
      expect(spyDocency).toHaveBeenCalledWith('prof-1', RequestType.DOCUMENT_APPROVED);

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          createdByUserId: 'admin-1',
          fileUrl: 'doc-url',
        },
      });

      expect(result).toEqual(created);
    });
  });

  describe('createReceiptPayment', () => {
    it('should create payment receipt when last request is PAYMENT_SENT', async () => {
      const reservationGroupId = 'rg-1';

      databaseService.reservationGroup.findUnique.mockResolvedValueOnce({
        requests: [
          {
            type: RequestType.PAYMENT_SENT,
            fileUrl: 'file-url',
          },
        ],
        userId: 'user-1',
      } as never);

      databaseService.reservationGroup.update.mockResolvedValueOnce({} as never);

      await (service as any).createReceiptPayment(reservationGroupId);

      expect(databaseService.reservationGroup.update).toHaveBeenCalledWith({
        where: { id: reservationGroupId },
        data: {
          receipt: {
            create: {
              type: ReceiptType.PAYMENT,
              url: 'file-url',
              userId: 'user-1',
            },
          },
        },
      });
    });

    it('should throw BadRequestException when reservation group or last request is invalid', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(null);

      await expect((service as any).createReceiptPayment('rg-unknown')).rejects.toThrow(
        BadRequestException,
      );
      await expect((service as any).createReceiptPayment('rg-unknown')).rejects.toThrow(
        'Reservation Group do not exists or did not have any PAYMENT_SENT request',
      );
    });
  });

  describe('createReceiptDocency', () => {
    it('should return undefined for DOCUMENT_REQUESTED without querying database', async () => {
      const result = await (service as any).createReceiptDocency(
        'user-1',
        RequestType.DOCUMENT_REQUESTED,
      );

      expect(result).toBeUndefined();
      expect(databaseService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should create docency receipt and verify professor on DOCUMENT_APPROVED', async () => {
      const professorId = 'prof-1';
      const fileUrl = 'doc-url';

      databaseService.user.findUnique.mockResolvedValueOnce({
        ProfessorRequests: [
          {
            type: RequestType.DOCUMENT_REQUESTED,
            fileUrl,
          },
        ],
      } as never);

      databaseService.user.update.mockResolvedValueOnce({} as never);

      const result = await (service as any).createReceiptDocency(
        professorId,
        RequestType.DOCUMENT_APPROVED,
      );

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: professorId },
        data: {
          verified: true,
          Receipt: {
            create: {
              type: ReceiptType.DOCENCY,
              url: fileUrl,
            },
          },
        },
      });

      expect(result).toBe(fileUrl);
    });

    it('should throw BadRequestException when professor or last request is invalid', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        (service as any).createReceiptDocency('prof-unknown', RequestType.APPROVED),
      ).rejects.toThrow(BadRequestException);
      await expect(
        (service as any).createReceiptDocency('prof-unknown', RequestType.APPROVED),
      ).rejects.toThrow('Professor do not exists or did not have any DOCUMENT_REQUESTED request');
    });
  });

  describe('sendStatusChangeEmail', () => {
    it('should send email when reservation and user email exist', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      } as never);

      configService.get.mockReturnValueOnce('https://frontend.test');

      await (service as any).sendStatusChangeEmail('rg-1');

      expect(mailService.sendTemplateMail).toHaveBeenCalledWith(
        'john@example.com',
        'Atualização de Reserva',
        'change-status',
        {
          userName: 'John Doe',
          systemUrl: 'https://frontend.test/user/my-reservations',
        },
      );
    });

    it('should not send email when user email is missing', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce({
        user: {
          name: 'John Doe',
          email: null,
        },
      } as never);

      await (service as any).sendStatusChangeEmail('rg-2');

      expect(mailService.sendTemplateMail).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      databaseService.reservationGroup.findUnique.mockRejectedValueOnce(new Error('db error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await (service as any).sendStatusChangeEmail('rg-error');

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
