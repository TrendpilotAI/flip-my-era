interface EnvironmentConfig {
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    enableDebugMode: boolean
    enableTestData: boolean
    enableAnalytics: boolean
  }
  services: {
    supabase: {
      url: string
      publishableKey: string
      secretKey: string // Add secret key for server-side operations if needed
    }
  }
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development'
  
  // Environment validation (no logging in production)
  // Only log in development to avoid exposing config in production
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Environment Config] Detected environment:', env);
  }
  
  const baseConfig = {
    api: {
      baseUrl: import.meta.env.VITE_APP_URL || 'http://localhost:8080',
      timeout: 10000,
    },
      services: {
        supabase: {
          url: import.meta.env.VITE_SUPABASE_URL,
          publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          // Note: Secret keys should never be exposed to client-side code
          // Remove this field or ensure it's only used server-side
          secretKey: '', // Client-side code should not have access to secret keys
        },
      },
  }

  const config = {
    ...baseConfig,
    features: {
      enableDebugMode: false,
      enableTestData: false,
      enableAnalytics: false,
    },
  };

  switch (env) {
    case 'development':
      config.features = {
        enableDebugMode: true,
        enableTestData: true,
        enableAnalytics: false,
      };
      break;
    
    case 'staging':
      config.api.baseUrl = 'https://staging.flipmyera.com';
      config.features = {
        enableDebugMode: true,
        enableTestData: false,
        enableAnalytics: true,
      };
      break;
    
    case 'production':
      config.api.baseUrl = 'https://flipmyera.com';
      config.api.timeout = 5000;
      config.features = {
        enableDebugMode: false,
        enableTestData: false,
        enableAnalytics: true,
      };
      break;
    
    default:
      throw new Error(`Unknown environment: ${env}`);
  }

  // Validate API baseUrl
  if (!config.api.baseUrl || !isValidUrl(config.api.baseUrl)) {
    throw new Error(`Invalid or missing API base URL (${config.api.baseUrl}) configured for ${env} environment. Please set VITE_APP_URL.`);
  }

  // Validate Supabase configuration
  if (!config.services.supabase.url) {
    throw new Error(`Missing Supabase URL for ${env} environment. Please set VITE_SUPABASE_URL.`);
  }
  if (!isValidUrl(config.services.supabase.url)) {
    throw new Error(`Invalid Supabase URL (${config.services.supabase.url}) configured for ${env} environment. Please set a valid VITE_SUPABASE_URL.`);
  }
  if (!config.services.supabase.publishableKey) {
    throw new Error(`Missing Supabase Publishable Key for ${env} environment. Please set VITE_SUPABASE_PUBLISHABLE_KEY.`);
  }

  // Helper function to validate URLs
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  return config;
};