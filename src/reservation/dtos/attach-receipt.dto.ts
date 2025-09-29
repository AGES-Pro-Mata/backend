import { z } from 'zod';
// import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export class AttachReceiptDto {
//   @ApiProperty({ description: 'URL do documento ou comprovante anexado.' })
//   @IsNotEmpty()
//   @IsString()
//   @IsUrl()
//   url: string;
// }

export const AttachReceiptSchema = z.object({
  receiptUrl: z.string().url(),
});

export type AttachReceiptDto = z.infer<typeof AttachReceiptSchema>;