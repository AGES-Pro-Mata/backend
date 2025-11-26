/* eslint-disable @typescript-eslint/unbound-method */

import { ObfuscateService } from './obfuscate.service';

describe('ObfuscateService', () => {
  let service: ObfuscateService;

  beforeEach(() => {
    service = new ObfuscateService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate deterministic hash when Date.now is fixed', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const field = 'test@example.com';
    const result1 = service.obfuscateField(field);
    const result2 = service.obfuscateField(field);

    expect(result1).toBe(result2);
    expect(result1).not.toBe(field);
    expect(result1).toMatch(/^[A-Za-z0-9+/]+=*$/);

    nowSpy.mockRestore();
  });

  it('should produce different hashes when timestamp changes', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1700000000000).mockReturnValueOnce(1700000001000);

    const field = 'test@example.com';
    const result1 = service.obfuscateField(field);
    const result2 = service.obfuscateField(field);

    expect(result1).not.toBe(result2);
    expect(result1).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(result2).toMatch(/^[A-Za-z0-9+/]+=*$/);

    nowSpy.mockRestore();
  });
});
