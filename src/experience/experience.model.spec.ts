/* eslint-disable @typescript-eslint/unbound-method */

import {
  ExperienceSearchParamsSchema,
  GetExperienceFilterSchema,
  UpdateExperienceFormDto,
  CreateExperienceFormDto,
  UserSearchParamsSchema,
} from './experience.model';
import { Category, TrailDifficulty, WeekDay } from 'generated/prisma';

describe('Experience model Zod schemas', () => {
  describe('UpdateExperienceFormSchema', () => {
    it('should parse full valid data with type conversions', () => {
      const result = UpdateExperienceFormDto.schema.parse({
        experienceName: 'New Experience',
        experienceDescription: 'Desc',
        experienceCategory: Category.TRAIL,
        experienceCapacity: '10',
        experienceStartDate: '2025-01-01T10:00:00.000Z',
        experienceEndDate: '2025-01-01T12:00:00.000Z',
        experiencePrice: '100.50',
        experienceWeekDays: 'MONDAY, FRIDAY',
        trailDurationMinutes: '120',
        trailDifficulty: TrailDifficulty.HARD,
        trailLength: '5.5',
        professorShouldPay: 'true',
      } as any);

      expect(result.experienceCapacity).toBe(10);
      expect(result.experiencePrice).toBe(100.5);
      expect(result.experienceWeekDays).toEqual([WeekDay.MONDAY, WeekDay.FRIDAY]);
      expect(result.trailDurationMinutes).toBe(120);
      expect(result.trailLength).toBe(5.5);
      expect(result.professorShouldPay).toBe(true);
    });

    it('should handle empty strings returning undefined for optional fields', () => {
      const result = UpdateExperienceFormDto.schema.parse({
        experienceName: 'Name',
        experienceDescription: 'Desc',
        experienceCategory: Category.TRAIL,
        experienceCapacity: '',
        experienceStartDate: '2025-01-01T10:00:00.000Z',
        experienceEndDate: '2025-01-01T12:00:00.000Z',
        experiencePrice: '',
        trailDurationMinutes: '',
        trailLength: '',
        professorShouldPay: undefined,
      } as any);

      expect(result.experienceCapacity).toBeUndefined();
      expect(result.experiencePrice).toBeUndefined();
      expect(result.trailDurationMinutes).toBeUndefined();
      expect(result.trailLength).toBeUndefined();
      expect(result.professorShouldPay).toBeUndefined();
    });

    it('should handle array input for weekDays', () => {
      const result = UpdateExperienceFormDto.schema.parse({
        experienceName: 'Name',
        experienceDescription: 'Desc',
        experienceCategory: Category.TRAIL,
        experienceCapacity: '5',
        experienceStartDate: '2025-01-01T10:00:00.000Z',
        experienceEndDate: '2025-01-01T12:00:00.000Z',
        experienceWeekDays: [WeekDay.SATURDAY, WeekDay.SUNDAY],
        professorShouldPay: 'false',
      } as any);

      expect(result.experienceWeekDays).toEqual([WeekDay.SATURDAY, WeekDay.SUNDAY]);
      expect(result.professorShouldPay).toBe(false);
    });
  });

  describe('CreateExperienceFormSchema', () => {
    it('should parse valid creation data with transforms', () => {
      const result = CreateExperienceFormDto.schema.parse({
        experienceName: 'Create Exp',
        experienceDescription: 'Desc',
        experienceCategory: Category.TRAIL,
        experienceCapacity: '20',
        experienceStartDate: '2025-05-01T09:00:00.000Z',
        experienceEndDate: '2025-05-01T17:00:00.000Z',
        experiencePrice: '50.00',
        experienceWeekDays: 'WEDNESDAY',
        trailDurationMinutes: '60',
        trailDifficulty: TrailDifficulty.EASY,
        trailLength: '2.0',
        professorShouldPay: 'true',
      } as any);

      expect(result.experienceCapacity).toBe(20);
      expect(result.experiencePrice).toBe(50.0);
      expect(result.experienceWeekDays).toEqual([WeekDay.WEDNESDAY]);
      expect(result.trailDurationMinutes).toBe(60);
      expect(result.trailLength).toBe(2.0);
      expect(result.professorShouldPay).toBe(true);
    });

    it('should handle empty/undefined optionals correctly', () => {
      const result = CreateExperienceFormDto.schema.parse({
        experienceName: 'Create Exp',
        experienceDescription: 'Desc',
        experienceCategory: Category.TRAIL,
        experienceCapacity: '10',
        experienceStartDate: '2025-05-01T09:00:00.000Z',
        experienceEndDate: '2025-05-01T17:00:00.000Z',
        experiencePrice: '',
        trailDurationMinutes: undefined,
        trailLength: '',
        professorShouldPay: 'false',
      } as any);

      expect(result.experiencePrice).toBeUndefined();
      expect(result.trailDurationMinutes).toBeUndefined();
      expect(result.trailLength).toBeUndefined();
      expect(result.professorShouldPay).toBe(false);
    });
  });

  describe('UserSearchParamsSchema (Experience module version)', () => {
    it('should transform page and limit strings to numbers', () => {
      const result = UserSearchParamsSchema.parse({
        page: '2',
        limit: '15',
        name: 'Alice',
        email: 'alice@example.com',
      } as any);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(15);
      expect(result.name).toBe('Alice');
      expect(result.email).toBe('alice@example.com');
    });
  });

  describe('ExperienceSearchParamsSchema', () => {
    it('should transform basic params, map sort=date to startDate and wrap single category into array', () => {
      const result = ExperienceSearchParamsSchema.parse({
        page: '1',
        limit: '20',
        dir: 'desc',
        sort: 'date',
        name: 'Trail',
        description: 'Mountain',
        category: Category.TRAIL,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
      } as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.dir).toBe('desc');
      expect(result.sort).toBe('startDate');
      expect(result.name).toBe('Trail');
      expect(result.description).toBe('Mountain');
      expect(result.category).toEqual([Category.TRAIL]);
      expect(result.startDate).toBe('2025-01-01T00:00:00.000Z');
      expect(result.endDate).toBe('2025-12-31T00:00:00.000Z');
    });

    it('should accept array of categories without transforming items', () => {
      const result = ExperienceSearchParamsSchema.parse({
        page: '0',
        limit: '10',
        category: [Category.TRAIL, Category.HOSTING],
      } as any);

      expect(result.page).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.category).toEqual([Category.TRAIL, Category.HOSTING]);
    });

    it('should default dir to asc and sort to createdAt when omitted', () => {
      const result = ExperienceSearchParamsSchema.parse({
        page: '0',
        limit: '5',
      } as any);

      expect(result.dir).toBe('asc');
      expect(result.sort).toBe('createdAt');
    });
  });

  describe('GetExperienceFilterSchema', () => {
    it('should transform date strings yyyy-mm-dd into ISO start/end of day', () => {
      const result = GetExperienceFilterSchema.parse({
        category: Category.TRAIL,
        search: 'caminhada',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        page: '1',
        limit: '10',
      } as any);

      expect(result.category).toBe(Category.TRAIL);
      expect(result.search).toBe('caminhada');
      expect(result.startDate).toBe('2025-01-01T00:00:00.000Z');
      expect(result.endDate).toBe('2025-01-31T00:00:00.000Z');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return undefined for empty or missing dates', () => {
      const result = GetExperienceFilterSchema.parse({
        category: Category.TRAIL,
        page: '0',
        limit: '5',
        startDate: '',
        endDate: '   ',
      } as any);

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should keep ISO datetime strings as-is', () => {
      const result = GetExperienceFilterSchema.parse({
        category: Category.HOSTING,
        page: '0',
        limit: '5',
        startDate: '2025-02-10T12:00:00.000Z',
        endDate: '2025-02-11T18:30:00.000Z',
      } as any);

      expect(result.startDate).toBe('2025-02-10T12:00:00.000Z');
      expect(result.endDate).toBe('2025-02-11T18:30:00.000Z');
    });
  });
});
