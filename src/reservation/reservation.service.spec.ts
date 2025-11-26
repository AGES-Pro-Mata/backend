import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { RequestType } from 'generated/prisma';
import { UpdateReservationByAdminDto, RegisterMemberDto } from './reservation.model';

describe('ReservationService', () => {
  let service: ReservationService;
  let databaseService: any;
  let storageService: any;

  const mockFile = {
    fieldname: 'paymentReceipt',
    originalname: 'receipt.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('fake-file'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockDatabaseService = {
      requests: {
        create: jest.fn(),
      },
      reservationGroup: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      reservation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      member: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    databaseService = module.get(DatabaseService);
    storageService = module.get(StorageService);

    jest.clearAllMocks();
  });

  describe('createDocumentRequest', () => {
    it('should throw BadRequestException when paymentReceipt is null', async () => {
      await expect(service.createDocumentRequest('rg-1', 'user-1', null)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createDocumentRequest('rg-1', 'user-1', null)).rejects.toThrow(
        '`paymentReceipt` not provided',
      );

      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(databaseService.requests.create).not.toHaveBeenCalled();
    });

    it('should upload file and create PAYMENT_SENT request', async () => {
      storageService.uploadFile.mockResolvedValueOnce({ url: 'https://s3.test/payments/1.pdf' });

      const createdRequest = { id: 'req-1' };
      databaseService.requests.create.mockResolvedValueOnce(createdRequest as never);

      const result = await service.createDocumentRequest('rg-1', 'user-1', mockFile);

      expect(storageService.uploadFile).toHaveBeenCalledWith(mockFile, {
        directory: 'payments',
        contentType: mockFile.mimetype,
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: RequestType.PAYMENT_SENT,
          createdByUserId: 'user-1',
          reservationGroupId: 'rg-1',
          fileUrl: 'https://s3.test/payments/1.pdf',
        },
      });

      expect(result).toEqual(createdRequest);
    });
  });

  describe('createCancelRequest', () => {
    it('should create CANCELED_REQUESTED request', async () => {
      databaseService.requests.create.mockResolvedValueOnce({} as never);

      await service.createCancelRequest('rg-1', 'user-1');

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: RequestType.CANCELED_REQUESTED,
          reservationGroupId: 'rg-1',
          createdByUserId: 'user-1',
        },
      });
    });
  });

  describe('getReservationGroupByIdAdmin', () => {
    it('should return reservation group for admin', async () => {
      const reservationGroup = { id: 'rg-1', notes: 'test' };

      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(reservationGroup as never);

      const result = await service.getReservationGroupByIdAdmin('rg-1');

      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalledWith({
        where: { id: 'rg-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(reservationGroup);
    });
  });

  describe('getReservationGroupById', () => {
    it('should return reservation group when it exists for user', async () => {
      const reservationGroup = { id: 'rg-1', notes: 'user-notes' };

      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(reservationGroup as never);

      const result = await service.getReservationGroupById('rg-1', 'user-1');

      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalledWith({
        where: { id: 'rg-1', userId: 'user-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(reservationGroup);
    });

    it('should throw NotFoundException when reservation group does not exist', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(null);

      await expect(service.getReservationGroupById('rg-unknown', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReservationByAdmin', () => {
    it('should throw NotFoundException when reservation is not found', async () => {
      databaseService.reservation.findUnique.mockResolvedValueOnce(null);

      const dto: UpdateReservationByAdminDto = {
        type: RequestType.EDIT_REQUESTED,
      } as never;

      await expect(service.updateReservationByAdmin('res-unknown', dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateReservationByAdmin('res-unknown', dto)).rejects.toThrow(
        'Reservation not found',
      );
    });

    it('should update reservation when it exists', async () => {
      const dto: UpdateReservationByAdminDto = {
        type: RequestType.EDIT_REQUESTED,
        experienceId: 'exp-1',
        startDate: new Date('2025-01-01T10:00:00Z') as any,
        endDate: new Date('2025-01-02T10:00:00Z') as any,
        price: 150,
      } as never;

      const reservation = { id: 'res-1' };
      const updatedReservation = { id: 'res-1', price: 150 };

      databaseService.reservation.findUnique.mockResolvedValueOnce(reservation as never);
      databaseService.reservation.update.mockResolvedValueOnce(updatedReservation as never);

      const result = await service.updateReservationByAdmin('res-1', dto);

      expect(databaseService.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: {
          experienceId: dto.experienceId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          price: dto.price,
        },
      });

      expect(result).toEqual(updatedReservation);
    });
  });

  describe('registerMembers', () => {
    it('should delete existing members and create new ones inside a transaction', async () => {
      const members: RegisterMemberDto[] = [
        {
          name: 'John Doe',
          phone: '11999999999',
          document: '12345678900',
          gender: 'M',
        } as never,
      ];

      databaseService.$transaction.mockResolvedValueOnce(undefined);

      await service.registerMembers('rg-1', 'user-1', members);

      expect(databaseService.member.deleteMany).toHaveBeenCalledWith({
        where: { reservationGroupId: 'rg-1' },
      });

      expect(databaseService.reservationGroup.update).toHaveBeenCalledWith({
        where: {
          id: 'rg-1',
          userId: 'user-1',
        },
        data: {
          requests: {
            create: {
              type: 'PEOPLE_SENT',
              createdByUserId: 'user-1',
            },
          },
          members: {
            createMany: {
              data: members,
            },
          },
        },
      });

      expect(databaseService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getAllReservationGroups', () => {
    it('should map raw query rows into paginated items', async () => {
      const rawRows = [
        {
          id: 'rg-1',
          email: 'user1@example.com',
          createdAt: new Date('2025-01-01T10:00:00Z'),
          status: RequestType.CREATED,
          experiences: ['Exp 1', 'Exp 2'],
        },
      ];

      databaseService.$queryRawUnsafe
        .mockResolvedValueOnce(rawRows as never)
        .mockResolvedValueOnce([{ count: BigInt(1) }] as never);

      const result = await service.getAllReservationGroups({
        page: 0,
        limit: 10,
        sort: 'email',
        dir: 'asc',
        email: 'user1',
        experiences: 'Trail',
        status: [RequestType.CREATED],
      } as any);

      expect(databaseService.$queryRawUnsafe).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        page: 0,
        limit: 10,
        total: 1,
        items: [
          {
            id: 'rg-1',
            experiences: ['Exp 1', 'Exp 2'],
            email: 'user1@example.com',
            status: RequestType.CREATED,
          },
        ],
      });
    });

    it('should support sorting by status', async () => {
      const rawRows = [];
      databaseService.$queryRawUnsafe
        .mockResolvedValueOnce(rawRows as never)
        .mockResolvedValueOnce([{ count: BigInt(0) }] as never);

      await service.getAllReservationGroups({
        page: 0,
        limit: 10,
        sort: 'status',
        dir: 'desc',
      } as any);

      expect(databaseService.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY lr.type DESC, rg."createdAt" DESC'),
        null,
        null,
        null,
        0,
        10,
      );
    });

    it('should default sort to createdAt DESC if sort param is missing', async () => {
      const rawRows = [];
      databaseService.$queryRawUnsafe
        .mockResolvedValueOnce(rawRows as never)
        .mockResolvedValueOnce([{ count: BigInt(0) }] as never);

      await service.getAllReservationGroups({
        page: 0,
        limit: 10,
      } as any);

      expect(databaseService.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY rg."createdAt" DESC'),
        null,
        null,
        null,
        0,
        10,
      );
    });
  });

  describe('getReservationGroups', () => {
    const userId = 'user-1';

    it('should map groups, compute price and filter by ALL/PENDING/custom status', async () => {
      const now = new Date('2025-01-01T10:00:00Z');
      const later = new Date('2025-01-02T10:00:00Z');

      const groupsFromDb = [
        {
          id: 'g1',
          members: [],
          requests: [
            { type: RequestType.CREATED, createdAt: now },
            { type: RequestType.PAYMENT_REQUESTED, createdAt: later },
          ],
          reservations: [
            {
              startDate: now,
              endDate: later,
              membersCount: 2,
              experience: {
                price: { mul: (count: number) => 100 * count },
              },
            },
          ],
        },
        {
          id: 'g2',
          members: [],
          requests: [{ type: RequestType.DOCUMENT_REQUESTED, createdAt: now }],
          reservations: [
            {
              startDate: now,
              endDate: later,
              membersCount: 1,
              experience: {
                price: { mul: (count: number) => 50 * count },
              },
            },
          ],
        },
        {
          id: 'g3',
          members: [],
          requests: [{ type: RequestType.PAYMENT_SENT, createdAt: now }],
          reservations: [
            {
              startDate: now,
              endDate: later,
              membersCount: 1,
              experience: {
                price: { mul: (count: number) => 80 * count },
              },
            },
          ],
        },
      ];

      databaseService.reservationGroup.findMany.mockResolvedValue(groupsFromDb as never);

      // status ALL
      let result = await service.getReservationGroups(userId, { status: 'ALL' } as any);
      expect(result).toHaveLength(3);

      // status PENDING should include only groups whose last status is in PENDING_LIST
      result = await service.getReservationGroups(userId, { status: 'PENDING' } as any);
      const statuses = result.map((g: any) => g.status);
      expect(statuses).toEqual(expect.arrayContaining([RequestType.PAYMENT_REQUESTED]));
      expect(statuses).not.toContain(RequestType.PAYMENT_SENT);

      // specific status filter
      result = await service.getReservationGroups(userId, {
        status: RequestType.DOCUMENT_REQUESTED,
      } as any);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g2');
    });
  });

  describe('createReservationGroup', () => {
    const userId = 'user-1';

    it('should create reservation group, members, reservations and initial request', async () => {
      const dto: any = {
        notes: 'Group notes',
        members: [
          {
            name: 'John Doe',
            document: '12345678900',
            gender: 'M',
            phone: '11999999999',
            birthDate: '2025-01-01',
          },
        ],
        reservations: [
          {
            experienceId: 'exp-1',
            startDate: new Date('2025-01-10T10:00:00Z'),
            endDate: new Date('2025-01-10T12:00:00Z'),
            membersCount: 2,
          },
        ],
      };

      const txExperienceFindMany = jest.fn().mockResolvedValue([{ id: 'exp-1' }]);
      const txReservationGroupCreate = jest.fn().mockResolvedValue({ id: 'rg-1' });
      const txMemberCreateMany = jest.fn().mockResolvedValue(undefined);
      const txReservationCreate = jest.fn().mockResolvedValue({ _count: {} });
      const txRequestsCreate = jest.fn().mockResolvedValue({});
      const expectedGroup = { id: 'rg-1', reservations: [], requests: [] };
      const txReservationGroupFindOrThrow = jest.fn().mockResolvedValue(expectedGroup);

      databaseService.$transaction.mockImplementationOnce(async (callback: any) => {
        const tx = {
          experience: { findMany: txExperienceFindMany },
          reservationGroup: {
            create: txReservationGroupCreate,
            findUniqueOrThrow: txReservationGroupFindOrThrow,
          },
          member: { createMany: txMemberCreateMany },
          reservation: { create: txReservationCreate },
          requests: { create: txRequestsCreate },
        };

        return callback(tx);
      });

      const result = await service.createReservationGroup(userId, dto);

      expect(txExperienceFindMany).toHaveBeenCalledWith({
        where: { id: { in: ['exp-1'] }, active: true },
        select: { id: true },
      });

      expect(txReservationGroupCreate).toHaveBeenCalledWith({
        data: { userId, notes: dto.notes },
        select: { id: true },
      });

      expect(txMemberCreateMany).toHaveBeenCalledWith({
        data: [
          {
            name: 'John Doe',
            document: '12345678900',
            gender: 'M',
            phone: '11999999999',
            reservationGroupId: 'rg-1',
            birthDate: new Date('2025-01-01'),
          },
        ],
        skipDuplicates: true,
      });

      expect(txReservationCreate).toHaveBeenCalledWith({
        data: {
          userId,
          reservationGroupId: 'rg-1',
          experienceId: 'exp-1',
          startDate: dto.reservations[0].startDate,
          endDate: dto.reservations[0].endDate,
          membersCount: dto.reservations[0].membersCount,
        },
        select: { _count: true },
      });

      expect(txRequestsCreate).toHaveBeenCalledWith({
        data: {
          type: 'CREATED',
          createdByUserId: userId,
          reservationGroupId: 'rg-1',
        },
      });

      expect(txReservationGroupFindOrThrow).toHaveBeenCalledWith({
        where: { id: 'rg-1' },
        include: {
          reservations: { include: { experience: true } },
          requests: true,
        },
      });

      expect(result).toBe(expectedGroup);
    });

    it('should throw BadRequestException when some experiences are not active', async () => {
      const dto: any = {
        notes: 'Group notes',
        members: [],
        reservations: [
          { experienceId: 'exp-1', startDate: new Date(), endDate: new Date(), membersCount: 1 },
          { experienceId: 'exp-2', startDate: new Date(), endDate: new Date(), membersCount: 1 },
        ],
      };

      databaseService.$transaction.mockImplementationOnce(async (callback: any) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([{ id: 'exp-1' }]),
          },
          reservationGroup: {
            create: jest.fn(),
            findUniqueOrThrow: jest.fn(),
          },
          member: { createMany: jest.fn() },
          reservation: { create: jest.fn() },
          requests: { create: jest.fn() },
        };

        return callback(tx);
      });

      const promise = service.createReservationGroup(userId, dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Uma ou mais experiências não estão ativas.');
    });
  });
});
