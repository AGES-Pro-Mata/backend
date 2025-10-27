import { Category, TrailDifficulty, WeekDay } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateExperienceFormSchema = z.object({
  experienceName: z.string().optional(),
  experienceDescription: z.string().optional(),
  experienceCategory: z.enum(Object.values(Category)).optional(),
  experienceCapacity: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  experienceImage: z.url().optional(),
  experienceStartDate: z.iso.datetime().optional(),
  experienceEndDate: z.iso.datetime().optional(),
  experiencePrice: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  experienceWeekDays: z.array(z.enum(Object.values(WeekDay))).optional(),
  trailDurationMinutes: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  trailDifficulty: z.enum(Object.values(TrailDifficulty)).optional(),
  trailLength: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
});

export class UpdateExperienceFormDto extends createZodDto(UpdateExperienceFormSchema) {}

const CreateExperienceFormSchema = z.object({
  experienceName: z.string(),
  experienceDescription: z.string(),
  experienceCategory: z.enum(Object.values(Category)),
  experienceCapacity: z.string().transform((val) => parseInt(val)),
  experienceImage: z.url(),
  experienceStartDate: z.iso.datetime().optional(),
  experienceEndDate: z.iso.datetime().optional(),
  experiencePrice: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  experienceWeekDays: z.array(z.enum(Object.values(WeekDay))),
  trailDurationMinutes: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  trailDifficulty: z.enum(Object.values(TrailDifficulty)).optional(),
  trailLength: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
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
  category: z.enum(['HOSTING', 'EVENT', 'LABORATORY', 'TRAIL']),
  name: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
});

export class GetExperienceFilterDto extends createZodDto(GetExperienceFilterSchema) {}
