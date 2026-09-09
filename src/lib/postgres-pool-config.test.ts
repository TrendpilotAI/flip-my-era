import { describe, expect, it } from 'vitest';

import { createPostgresPoolConfig } from './postgres-pool-config';

const CA_CERTIFICATE = [
  '-----BEGIN CERTIFICATE-----',
  'test-certificate',
  '-----END CERTIFICATE-----',
].join('\n');

describe('createPostgresPoolConfig', () => {
  it('allows a local database without TLS configuration', () => {
    const connectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

    expect(createPostgresPoolConfig(connectionString, undefined)).toEqual({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  });

  it('fails closed when a remote database has no trusted CA', () => {
    expect(() => createPostgresPoolConfig(
      'postgresql://user:password@db.example.com:5432/postgres',
      undefined,
    )).toThrow('DATABASE_CA_CERT is required for remote Postgres connections');
  });

  it('pins the bundled Supabase CA for a Supabase pooler', () => {
    const config = createPostgresPoolConfig(
      'postgresql://user:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
      undefined,
    );

    expect(new URL(config.connectionString as string).searchParams.get('sslmode')).toBeNull();
    expect(config.ssl).toMatchObject({ rejectUnauthorized: true });
    expect((config.ssl as { ca: string }).ca).toContain('-----BEGIN CERTIFICATE-----');
  });

  it('uses certificate verification and removes URL settings that override it', () => {
    const config = createPostgresPoolConfig(
      'postgresql://user:password@db.example.com:5432/postgres?sslmode=require&uselibpqcompat=true&application_name=flipmyera',
      CA_CERTIFICATE,
    );

    const configuredUrl = new URL(config.connectionString as string);
    expect(configuredUrl.searchParams.get('sslmode')).toBeNull();
    expect(configuredUrl.searchParams.get('uselibpqcompat')).toBeNull();
    expect(configuredUrl.searchParams.get('application_name')).toBe('flipmyera');
    expect(config.ssl).toEqual({
      ca: CA_CERTIFICATE,
      rejectUnauthorized: true,
    });
  });

  it('normalizes escaped PEM newlines from environment variables', () => {
    const escapedCertificate = CA_CERTIFICATE.replaceAll('\n', '\\n');
    const config = createPostgresPoolConfig(
      'postgresql://user:password@db.example.com:5432/postgres',
      escapedCertificate,
    );

    expect(config.ssl).toEqual({
      ca: CA_CERTIFICATE,
      rejectUnauthorized: true,
    });
  });

  it('decodes a base64 PEM value used by hosted environment variables', () => {
    const encodedCertificate = `base64:${Buffer.from(CA_CERTIFICATE).toString('base64')}`;
    const config = createPostgresPoolConfig(
      'postgresql://user:password@db.example.com:5432/postgres',
      encodedCertificate,
    );

    expect(config.ssl).toEqual({
      ca: CA_CERTIFICATE,
      rejectUnauthorized: true,
    });
  });

  it('rejects non-PEM certificate values', () => {
    expect(() => createPostgresPoolConfig(
      'postgresql://user:password@db.example.com:5432/postgres',
      'not a certificate',
    )).toThrow('DATABASE_CA_CERT must contain a PEM certificate');
  });
});
