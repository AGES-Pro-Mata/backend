/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import {
  CreateReservationGroupDto,
  UpdateReservationByAdminDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
  ReservationSearchParamsDto,
} from './reservation.model';
import { RequestType } from 'generated/prisma';

describe('ReservationController', () => {
  let controller: ReservationController;
  let service: jest.Mocked<ReservationService>;

  beforeEach(async () => {
    const mockReservationService = {
      createReservationGroup: jest.fn(),
      getReservationGroupByIdAdmin: jest.fn(),
      getReservationGroups: jest.fn(),
      getReservationGroupById: jest.fn(),
      createDocumentRequest: jest.fn(),
      registerMembers: jest.fn(),
      createCancelRequest: jest.fn(),
      updateReservationByAdmin: jest.fn(),
      getAllReservationGroups: jest.fn(),
    } as unknown as jest.Mocked<ReservationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
      ],
    }).compile();

    controller = module.get<ReservationController>(ReservationController);
    service = module.get(ReservationService);

    jest.clearAllMocks();
  });

  describe('createReservationGroup', () => {
    it('should call service.createReservationGroup with user id and payload', async () => {
      const currentUser = { id: 'user-1' } as any;
      const payload: CreateReservationGroupDto = {
        reservations: [],
        members: [],
      } as never;

      const expectedResult = { id: 'rg-1' };
      service.createReservationGroup.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.createReservationGroup(currentUser, payload);

      expect(service.createReservationGroup).toHaveBeenCalledWith(currentUser.id, payload);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getReservationAdmin', () => {
    it('should call service.getReservationGroupByIdAdmin with reservationGroupId', async () => {
      const reservationGroupId = 'rg-1';
      const expectedGroup = { id: reservationGroupId };
      service.getReservationGroupByIdAdmin.mockResolvedValueOnce(expectedGroup as never);

      const result = await controller.getReservationAdmin(reservationGroupId);

      expect(service.getReservationGroupByIdAdmin).toHaveBeenCalledWith(reservationGroupId);
      expect(result).toEqual(expectedGroup);
    });
  });

  describe('getReservationGroups', () => {
    it('should call service.getReservationGroups with user id and filter', async () => {
      const currentUser = { id: 'user-1' } as any;
      const filter: ReservationGroupStatusFilterDto = {
        status: RequestType.APPROVED,
      } as never;

      const expectedResult = [{ id: 'rg-1' }];
      service.getReservationGroups.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getReservationGroups(currentUser, filter);

      expect(service.getReservationGroups).toHaveBeenCalledWith(currentUser.id, filter);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getReservationUser', () => {
    it('should call service.getReservationGroupById with reservationGroupId and user id', async () => {
      const reservationGroupId = 'rg-1';
      const currentUser = { id: 'user-1' } as any;

      const expectedGroup = { id: reservationGroupId };
      service.getReservationGroupById.mockResolvedValueOnce(expectedGroup as never);

      const result = await controller.getReservationUser(reservationGroupId, currentUser);

      expect(service.getReservationGroupById).toHaveBeenCalledWith(
        reservationGroupId,
        currentUser.id,
      );
      expect(result).toEqual(expectedGroup);
    });
  });

  describe('attachReceiptAndRequestApproval', () => {
    it('should call service.createDocumentRequest with reservationGroupId, user id and file', async () => {
      const currentUser = { id: 'user-1' } as any;
      const reservationGroupId = 'rg-1';
      const mockFile = {
        fieldname: 'paymentReceipt',
        originalname: 'receipt.pdf',
      } as Express.Multer.File;

      service.createDocumentRequest.mockResolvedValueOnce({ id: 'req-1' } as never);

      await controller.attachReceiptAndRequestApproval(currentUser, reservationGroupId, mockFile);

      expect(service.createDocumentRequest).toHaveBeenCalledWith(
        reservationGroupId,
        currentUser.id,
        mockFile,
      );
    });
  });

  describe('createCancelReservationRequest', () => {
    it('should call service.createCancelRequest with reservationGroupId and user id', async () => {
      const currentUser = { id: 'user-1' } as any;
      const reservationGroupId = 'rg-1';

      service.createCancelRequest.mockResolvedValueOnce(undefined as never);

      await controller.createCancelReservationRequest(currentUser, reservationGroupId);

      expect(service.createCancelRequest).toHaveBeenCalledWith(reservationGroupId, currentUser.id);
    });
  });

  describe('registerMembers', () => {
    it('should call service.registerMembers with reservationGroupId, user id and members dto', async () => {
      const currentUser = { id: 'user-1' } as any;
      const reservationGroupId = 'rg-1';
      const members: RegisterMemberDto[] = [
        {
          name: 'John Doe',
          phone: '11999999999',
          document: '12345678900',
          gender: 'M',
        } as never,
      ];

      const expectedResult = { success: true };
      service.registerMembers.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.registerMembers(currentUser, members, reservationGroupId);

      expect(service.registerMembers).toHaveBeenCalledWith(
        reservationGroupId,
        currentUser.id,
        members,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateReservationAsAdmin', () => {
    it('should call service.updateReservationByAdmin with reservationId and dto', async () => {
      const reservationId = 'res-1';
      const dto: UpdateReservationByAdminDto = {
        type: RequestType.EDIT_REQUESTED,
      } as never;

      const updatedReservation = { id: reservationId };
      service.updateReservationByAdmin.mockResolvedValueOnce(updatedReservation as never);

      const result = await controller.updateReservationAsAdmin(reservationId, dto);

      expect(service.updateReservationByAdmin).toHaveBeenCalledWith(reservationId, dto);
      expect(result).toEqual(updatedReservation);
    });
  });

  describe('getAllReservationGroups', () => {
    it('should call service.getAllReservationGroups with search params', async () => {
      const searchParams: ReservationSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'email',
      } as never;

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 1,
        items: [{ id: 'rg-1' }],
      };

      service.getAllReservationGroups.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getAllReservationGroups(searchParams);

      expect(service.getAllReservationGroups).toHaveBeenCalledWith(searchParams);
      expect(result).toEqual(expectedResult);
    });
  });
});
