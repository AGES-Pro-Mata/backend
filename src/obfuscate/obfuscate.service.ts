import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

@Injectable()
export class ObfuscateService {
  obfuscateField(field: string) {
    return createHash('sha256')
      .update(field + Date.now())
      .digest('base64');
  }
}
