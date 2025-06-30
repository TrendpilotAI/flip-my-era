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
      anonKey: string
    }
    clerk?: {
      publishableKey: string
    }
  }
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development'
  
  const baseConfig = {
    api: {
      baseUrl: import.meta.env.VITE_APP_URL || 'http://localhost:8080',
      timeout: 10000,
    },
    services: {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  }

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        features: {
          enableDebugMode: true,
          enableTestData: true,
          enableAnalytics: false,
        },
      }
    
    case 'staging':
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          baseUrl: 'https://staging.flipmyera.com',
        },
        features: {
          enableDebugMode: true,
          enableTestData: false,
          enableAnalytics: true,
        },
      }
    
    case 'production':
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          baseUrl: 'https://flipmyera.com',
          timeout: 5000,
        },
        features: {
          enableDebugMode: false,
          enableTestData: false,
          enableAnalytics: true,
        },
      }
    
    default:
      throw new Error(`Unknown environment: ${env}`)
  }
} 