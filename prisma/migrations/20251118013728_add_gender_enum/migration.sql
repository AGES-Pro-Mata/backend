-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Masculino', 'Feminino', 'Outro', 'NaoInformado');

-- Step 1: Normalize existing data in User table
-- Convert all variations (English, Portuguese, different casings) to Portuguese enum values
UPDATE "User" SET gender =
  CASE
    -- English variants (uppercase)
    WHEN UPPER(TRIM(gender)) = 'MALE' THEN 'Masculino'
    WHEN UPPER(TRIM(gender)) = 'FEMALE' THEN 'Feminino'
    WHEN UPPER(TRIM(gender)) = 'OTHER' THEN 'Outro'
    WHEN UPPER(TRIM(gender)) = 'NOT_INFORMED' THEN 'NaoInformado'
    WHEN UPPER(TRIM(gender)) = 'NOTINFORMED' THEN 'NaoInformado'
    -- English variants (single letter)
    WHEN UPPER(TRIM(gender)) = 'M' THEN 'Masculino'
    WHEN UPPER(TRIM(gender)) = 'F' THEN 'Feminino'
    WHEN UPPER(TRIM(gender)) = 'O' THEN 'Outro'
    -- Portuguese variants (any casing)
    WHEN UPPER(TRIM(gender)) = 'MASCULINO' THEN 'Masculino'
    WHEN UPPER(TRIM(gender)) = 'FEMININO' THEN 'Feminino'
    WHEN UPPER(TRIM(gender)) = 'OUTRO' THEN 'Outro'
    WHEN UPPER(TRIM(gender)) = 'NAOINFORMADO' THEN 'NaoInformado'
    WHEN UPPER(TRIM(gender)) = 'NÃO INFORMADO' THEN 'NaoInformado'
    -- Already correct values (Portuguese capitalized)
    WHEN gender = 'Masculino' THEN 'Masculino'
    WHEN gender = 'Feminino' THEN 'Feminino'
    WHEN gender = 'Outro' THEN 'Outro'
    WHEN gender = 'NaoInformado' THEN 'NaoInformado'
    -- Empty or null values
    WHEN gender IS NULL OR TRIM(gender) = '' THEN 'NaoInformado'
    -- Fallback for any unrecognized values
    ELSE 'NaoInformado'
  END;

-- Step 2: Normalize existing data in Member table
-- Convert all variations to Portuguese enum values
UPDATE "Member" SET gender =
  CASE
    -- English variants (uppercase)
    WHEN UPPER(TRIM(gender)) = 'MALE' THEN 'Masculino'
    WHEN UPPER(TRIM(gender)) = 'FEMALE' THEN 'Feminino'
    WHEN UPPER(TRIM(gender)) = 'OTHER' THEN 'Outro'
    WHEN UPPER(TRIM(gender)) = 'NOT_INFORMED' THEN 'NaoInformado'
    WHEN UPPER(TRIM(gender)) = 'NOTINFORMED' THEN 'NaoInformado'
    -- English variants (single letter)
    WHEN UPPER(TRIM(gender)) = 'M' THEN 'Masculino'
    WHEN UPPER(TRIM(gender)) = 'F' THEN 'Feminino'
    WHEN UPPER(TRIM(gender)) = 'O' THEN 'Outro'
    -- Portuguese variants (any casing)
    WHEN UPPER(TRIM(gender)) = 'MASCULINO' THEN 'Masculino'
    WHEN UPPER(TRIM(gender)) = 'FEMININO' THEN 'Feminino'
    WHEN UPPER(TRIM(gender)) = 'OUTRO' THEN 'Outro'
    WHEN UPPER(TRIM(gender)) = 'NAOINFORMADO' THEN 'NaoInformado'
    WHEN UPPER(TRIM(gender)) = 'NÃO INFORMADO' THEN 'NaoInformado'
    -- Already correct values (Portuguese capitalized)
    WHEN gender = 'Masculino' THEN 'Masculino'
    WHEN gender = 'Feminino' THEN 'Feminino'
    WHEN gender = 'Outro' THEN 'Outro'
    WHEN gender = 'NaoInformado' THEN 'NaoInformado'
    -- Empty or null values
    WHEN gender IS NULL OR TRIM(gender) = '' THEN 'NaoInformado'
    -- Fallback for any unrecognized values
    ELSE 'NaoInformado'
  END;

-- Step 3: Convert User.gender column to use Gender enum
ALTER TABLE "User" ALTER COLUMN "gender" TYPE "Gender" USING gender::"Gender";

-- Step 4: Convert Member.gender column to use Gender enum
ALTER TABLE "Member" ALTER COLUMN "gender" TYPE "Gender" USING gender::"Gender";
