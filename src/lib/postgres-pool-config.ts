import type { PoolConfig } from 'pg';
import { SUPABASE_PROD_CA_2021 } from './supabase-ca.js';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const SSL_QUERY_PARAMETERS = [
  'sslmode',
  'sslcert',
  'sslkey',
  'sslrootcert',
  'uselibpqcompat',
] as const;

function normalizeCaCertificate(value: string | undefined): string | undefined {
  const encodedCertificate = value?.trim();
  const certificate = encodedCertificate?.startsWith('base64:')
    ? Buffer.from(encodedCertificate.slice('base64:'.length), 'base64').toString('utf8').trim()
    : encodedCertificate?.replace(/\\n/g, '\n').trim();
  if (!certificate) return undefined;

  if (
    !certificate.includes('-----BEGIN CERTIFICATE-----')
    || !certificate.includes('-----END CERTIFICATE-----')
  ) {
    throw new Error('DATABASE_CA_CERT must contain a PEM certificate');
  }

  return certificate;
}

export function createPostgresPoolConfig(
  connectionString: string,
  databaseCaCert: string | undefined,
): PoolConfig {
  const parsedConnectionString = new URL(connectionString);
  const isLoopback = LOOPBACK_HOSTS.has(parsedConnectionString.hostname);
  const isSupabasePooler = parsedConnectionString.hostname.endsWith('.pooler.supabase.com');
  const ca = normalizeCaCertificate(
    databaseCaCert || (isSupabasePooler ? SUPABASE_PROD_CA_2021 : undefined),
  );

  if (!isLoopback && !ca) {
    throw new Error('DATABASE_CA_CERT is required for remote Postgres connections');
  }

  if (ca) {
    for (const parameter of SSL_QUERY_PARAMETERS) {
      parsedConnectionString.searchParams.delete(parameter);
    }
  }

  return {
    connectionString: ca ? parsedConnectionString.toString() : connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
  };
}
