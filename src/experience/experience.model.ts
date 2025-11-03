import { Category, TrailDifficulty, WeekDay } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const stringToInt = z
  .string()
  .transform((val) => (val === '' ? undefined : parseInt(val, 10)))
  .pipe(z.number().int().optional());

const stringToFloat = z
  .string()
  .transform((val) => (val === '' ? undefined : parseFloat(val)))
  .pipe(z.number().optional());

const booleanFromString = z
  .string()
  .optional()
  .transform((val) => (val === undefined ? undefined : val === 'true'));

const dateFromIsoString = z.string().optional();

const weekDaysSchema = z
  .union([
    z.array(z.enum(Object.values(WeekDay))),
    z
      .string()
      .transform((val) =>
        val
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      )
      .pipe(z.array(z.enum(Object.values(WeekDay)))),
  ])
  .transform((val) => (Array.isArray(val) ? val : val));

const UpdateExperienceFormSchema = z.object({
  experienceName: z.string().optional(),
  experienceDescription: z.string().optional(),
  experienceCategory: z.enum(Object.values(Category)).optional(),
  experienceCapacity: stringToInt,
  experienceStartDate: dateFromIsoString,
  experienceEndDate: dateFromIsoString,
  experiencePrice: stringToFloat,
  experienceWeekDays: weekDaysSchema.optional(),
  trailDurationMinutes: stringToInt,
  trailDifficulty: z.enum(Object.values(TrailDifficulty)).optional(),
  trailLength: stringToFloat,
  professorShouldPay: booleanFromString,
});

export class UpdateExperienceFormDto extends createZodDto(UpdateExperienceFormSchema) {}

const CreateExperienceFormSchema = z.object({
  experienceName: z.string(),
  experienceDescription: z.string(),
  experienceCategory: z.enum(Object.values(Category)),
  experienceCapacity: z
    .string()
    .transform((val) => parseInt(val, 10)),
  experienceStartDate: dateFromIsoString,
  experienceEndDate: dateFromIsoString,
  experiencePrice: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? undefined : parseFloat(val))),
  experienceWeekDays: weekDaysSchema,
  trailDurationMinutes: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? undefined : parseInt(val, 10))),
  trailDifficulty: z.enum(Object.values(TrailDifficulty)).optional(),
  trailLength: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? undefined : parseFloat(val))),
  professorShouldPay: booleanFromString,
});

export class CreateExperienceFormDto extends createZodDto(CreateExperienceFormSchema) {}

export const UserSearchParamsSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
  name: z.string().optional(),
  email: z.email().optional(),
});

export class UserSearchParamsDto extends createZodDto(UserSearchParamsSchema) {}

export const ExperienceSearchParamsSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
  dir: z
    .enum(['asc', 'desc'])
    .optional()
    .transform((val) => val ?? 'asc'),
  sort: z
    .enum(['name', 'description', 'date'])
    .optional()
    .transform((val) => {
      if (val === 'date') {
        return 'startDate';
      }

      return val ?? 'createdAt';
    }),
  name: z.string().optional(),
  description: z.email().optional(),
  date: z.iso.datetime().optional(),
});

export class ExperienceSearchParamsDto extends createZodDto(ExperienceSearchParamsSchema) {}

export const GetExperienceFilterSchema = z.object({
  category: z.enum(Object.values(Category)),
  search: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
});

export class GetExperienceFilterDto extends createZodDto(GetExperienceFilterSchema) {}
