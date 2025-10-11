import { HighlightCategory } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const highlightCategoryValues = Object.values(HighlightCategory) as [
  HighlightCategory,
  ...HighlightCategory[],
];

export const CATEGORY_LIMITS: Record<HighlightCategory, number> = {
  [HighlightCategory.LABORATORY]: 3,
  [HighlightCategory.HOSTING]: 3,
  [HighlightCategory.EVENT]: 3,
  [HighlightCategory.TRAIL]: 3,
  [HighlightCategory.CAROUSEL]: 5,
};

export const HighlightQueryParamsSchema = z.object({
  category: z.enum(highlightCategoryValues).optional(),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  page: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10)),
});

export class HighlightQueryParamsDto extends createZodDto(
  HighlightQueryParamsSchema,
) {}

export const CreateHighlightSchema = z.object({
  category: z.enum(highlightCategoryValues),
  title: z.string().min(2),
  description: z.string().optional(),
  order: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
});

export class CreateHighlightDto extends createZodDto(CreateHighlightSchema) {}

export const UpdateHighlightSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  order: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
});

export class UpdateHighlightDto extends createZodDto(UpdateHighlightSchema) {}

export const PublicHighlightSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string(),
  category: z.enum(highlightCategoryValues),
  description: z.string().nullable(),
  order: z.number(),
});

export class PublicHighlightDto extends createZodDto(PublicHighlightSchema) {}
