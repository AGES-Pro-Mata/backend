import { Gender } from '../../generated/prisma';

/**
 * Maps various gender value formats (English/Portuguese, different casings)
 * to the standardized Portuguese Gender enum values.
 *
 * This enables the backend to accept flexible input from the frontend
 * while storing consistent Portuguese enum values in the database.
 *
 * @param value - Gender value in various formats (e.g., "male", "FEMALE", "masculino")
 * @returns Standardized Gender enum value (Masculino, Feminino, Outro, or NaoInformado)
 */
export function mapGenderToEnum(value: string | undefined | null): Gender {
  if (!value) return Gender.NaoInformado;

  const trimmed = value.trim();
  if (!trimmed) return Gender.NaoInformado;

  const normalized = trimmed.toLowerCase();

  if (normalized === 'male' || normalized === 'm') return Gender.Masculino;
  if (normalized === 'female' || normalized === 'f') return Gender.Feminino;
  if (normalized === 'other' || normalized === 'o') return Gender.Outro;
  if (normalized === 'not_informed' || normalized === 'notinformed') return Gender.NaoInformado;

  if (normalized === 'masculino') return Gender.Masculino;
  if (normalized === 'feminino') return Gender.Feminino;
  if (normalized === 'outro') return Gender.Outro;
  if (normalized === 'naoinformado' || normalized === 'não informado') return Gender.NaoInformado;

  return Gender.NaoInformado;
}
