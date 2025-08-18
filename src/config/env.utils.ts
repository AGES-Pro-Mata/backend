export function getEnvFile(): string | string[] {
  const allowed = ['local', 'tst', 'hlg'];
  const env = process.env.BACKEND_ENV ?? '';
  return allowed.includes(env) ? [`.env.${env}`, '.env'] : ['.env'];
}
