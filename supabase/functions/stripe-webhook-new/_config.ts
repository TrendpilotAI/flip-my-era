import { Config } from '../_shared/utils'

export const config: Config = {
  authRequired: false,
  cors: {
    enabled: true,
    origins: ['*'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Stripe-Signature']
  }
} 