interface DeploymentEnvironment {
  readonly BETTER_AUTH_URL?: string;
  readonly VERCEL_ENV?: string;
  readonly VERCEL_URL?: string;
  readonly VERCEL_PROJECT_PRODUCTION_URL?: string;
}

const STABLE_AUTH_ORIGINS = [
  'https://flipmyera.com',
  'https://www.flipmyera.com',
  'https://flip-my-era.vercel.app',
  'https://flip-my-era-trendpilotais-projects.vercel.app',
  'https://flip-my-era-preview.vercel.app',
] as const;

function normalizeDeploymentUrl(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return new URL(withProtocol).origin;
}

export function getBetterAuthUrl(
  environment: DeploymentEnvironment = process.env,
): string {
  const vercelUrl = environment.VERCEL_ENV === 'production'
    ? environment.VERCEL_PROJECT_PRODUCTION_URL || environment.VERCEL_URL
    : environment.VERCEL_URL || environment.VERCEL_PROJECT_PRODUCTION_URL;
  const candidate = environment.BETTER_AUTH_URL || vercelUrl || 'https://flipmyera.com';

  return normalizeDeploymentUrl(candidate.trim());
}

export function getBetterAuthTrustedOrigins(baseUrl: string): string[] {
  return [...new Set([normalizeDeploymentUrl(baseUrl), ...STABLE_AUTH_ORIGINS])];
}
