import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { InsertRequestDto } from './requests.model';
import { RequestType } from 'generated/prisma';

describe('RequestsController', () => {
  let controller: RequestsController;
  let service: jest.Mocked<RequestsService>;

  beforeEach(async () => {
    const mockRequestsService = {
      getRequestsByIdReservationGroupAdmin: jest.fn(),
      getProfessorRequests: jest.fn(),
      insertRequest: jest.fn(),
    } as unknown as jest.Mocked<RequestsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
    service = module.get(RequestsService);

    jest.clearAllMocks();
  });

  describe('getReservationAdmin', () => {
    it('should call service with reservationGroupId and current user', async () => {
      const reservationGroupId = 'rg-1';
      const currentUser = { id: 'admin-1' } as any;

      const expectedResult = {
        events: [],
        createdAt: new Date(),
        status: RequestType.CREATED,
      };

      service.getRequestsByIdReservationGroupAdmin.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getReservationAdmin(reservationGroupId, currentUser);

      expect(service.getRequestsByIdReservationGroupAdmin).toHaveBeenCalledWith(
        reservationGroupId,
        currentUser,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfessorRequest', () => {
    it('should call service with professorId and return latest request', async () => {
      const professorId = 'prof-1';
      const expectedRequest = {
        id: 'req-1',
        type: RequestType.DOCUMENT_REQUESTED,
        description: 'Desc',
      };

      service.getProfessorRequests.mockResolvedValueOnce(expectedRequest as never);

      const result = await controller.getProfessorRequest(professorId);

      expect(service.getProfessorRequests).toHaveBeenCalledWith(professorId);
      expect(result).toEqual(expectedRequest);
    });
  });

  describe('insertRequest', () => {
    it('should call service.insertRequest with user id and dto', async () => {
      const currentUser = { id: 'admin-1' } as any;
      const dto: InsertRequestDto = {
        type: RequestType.PAYMENT_REQUESTED,
        reservationGroupId: 'rg-1',
      } as never;

      const createdRequest = { id: 'req-1' };
      service.insertRequest.mockResolvedValueOnce(createdRequest as never);

      const result = await controller.insertRequest(currentUser, dto);

      expect(service.insertRequest).toHaveBeenCalledWith(currentUser.id, dto);
      expect(service.insertRequest).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdRequest);
    });
  });
});
