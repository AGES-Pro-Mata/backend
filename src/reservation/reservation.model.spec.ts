/* eslint-disable @typescript-eslint/unbound-method */

import {
  CreateReservationGroupSchema,
  ReservationSearchParamsSchema,
  ReservationGroupStatusFilterDto,
} from './reservation.model';
import { RequestType } from 'generated/prisma';

describe('Reservation model Zod schemas', () => {
  describe('CreateReservationGroupSchema', () => {
    it('should parse reservations and members correctly', () => {
      const dto = {
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
            experienceId: '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7',
            startDate: '2025-01-10T10:00:00.000Z',
            endDate: '2025-01-10T12:00:00.000Z',
            membersCount: 2,
          },
        ],
      } as any;

      const result = CreateReservationGroupSchema.parse(dto);

      expect(result.notes).toBe('Group notes');
      expect(result.members[0].name).toBe('John Doe');
      expect(result.reservations[0].experienceId).toBe(dto.reservations[0].experienceId);
      expect(result.reservations[0].membersCount).toBe(2);
    });
  });

  describe('ReservationGroupStatusFilterDto', () => {
    it('should default status to ALL when not provided', () => {
      const result = ReservationGroupStatusFilterDto.schema.parse({} as any);

      expect(result.status).toBe('ALL');
    });

    it('should accept PENDING and specific RequestType values', () => {
      const pending = ReservationGroupStatusFilterDto.schema.parse({ status: 'PENDING' } as any);
      expect(pending.status).toBe('PENDING');

      const approved = ReservationGroupStatusFilterDto.schema.parse({
        status: RequestType.APPROVED,
      } as any);
      expect(approved.status).toBe(RequestType.APPROVED);
    });
  });

  describe('ReservationSearchParamsSchema', () => {
    it('should transform page/limit and default dir to asc', () => {
      const result = ReservationSearchParamsSchema.parse({
        page: '0',
        limit: '10',
        experiences: 'Trail',
        email: 'user@example.com',
      } as any);

      expect(result.page).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.dir).toBe('asc');
      expect(result.sort).toBeUndefined();
      expect(result.experiences).toBe('Trail');
      expect(result.email).toBe('user@example.com');
    });

    it('should accept dir desc and wrap single status into array', () => {
      const result = ReservationSearchParamsSchema.parse({
        page: '1',
        limit: '5',
        dir: 'desc',
        sort: 'status',
        status: RequestType.APPROVED,
      } as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.dir).toBe('desc');
      expect(result.sort).toBe('status');
      expect(result.status).toEqual([RequestType.APPROVED]);
    });

    it('should accept array of statuses without transforming items', () => {
      const result = ReservationSearchParamsSchema.parse({
        page: '2',
        limit: '20',
        status: [RequestType.APPROVED, RequestType.CANCELED],
      } as any);

      expect(result.status).toEqual([RequestType.APPROVED, RequestType.CANCELED]);
    });
  });
});
