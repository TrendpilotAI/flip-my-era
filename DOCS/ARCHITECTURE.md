# FlipMyEra Architecture Overview

## 🏗️ System Architecture

### Current Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                Web App (React/TypeScript)                       │
│  - Modular Component Architecture                              │
│  - Clerk Authentication                                        │
│  - Real-time Streaming UI                                      │
│  - Responsive Design with Tailwind CSS                        │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                   SUPABASE BACKEND                              │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   Database      │  Edge Functions │  Auth System    │  Storage  │
│   (PostgreSQL)  │                 │  (Clerk)        │  (S3)     │
│                 │                 │                 │           │
│ - User Profiles │ - Story Gen     │ - JWT Tokens    │ - Images  │
│ - Stories       │ - Ebook Gen     │ - Sessions      │ - PDFs    │
│ - Memory Books  │ - Credit Mgmt   │ - User Mgmt     │ - Assets  │
│ - Analytics     │ - TikTok Share  │ - Permissions   │           │
│ - Credit System │ - TTS/Audio     │                 │           │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                   AI SERVICES LAYER                             │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ Story Gen   │ Image Gen   │ Audio Gen   │ Video Gen   │ Queue   │
│ (Groq)      │ (RUNWARE)   │ (TTS)       │ (Future)    │ Mgmt    │
│             │             │             │             │         │
│ - Llama 3.1  │ - FLUX 1.1  │ - ElevenLabs│ - RunwayML  │ - Rate  │
│ - Streaming  │ - Pro       │ - Natural   │ - ML        │ Limiting│
│ - JSON Mode  │ - High Res  │ - Voices    │             │         │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

## 🧩 Current Modular Frontend Architecture

### Implemented Module Structure

```typescript
// Current src/modules/ structure
src/modules/
├── auth/                    # Authentication & user session management
│   ├── components/         # Auth UI components (Auth.tsx, AuthCallback.tsx, ResetPassword.tsx)
│   ├── contexts/           # ClerkAuthContext for authentication state
│   └── index.ts            # Module exports
├── story/                  # Story generation and management
│   ├── components/         # Story UI (Stories.tsx, StoryForm.tsx, StoryResult.tsx, etc.)
│   ├── hooks/              # useStoryGeneration, useStreamingGeneration
│   ├── services/           # AI service integration (ai.ts)
│   ├── types/              # personality.ts (story types)
│   ├── utils/              # storyPrompts.ts, enchantedQuillPrompt.ts, etc.
│   └── index.ts
├── ebook/                  # Ebook creation and reading experience
│   ├── components/         # EbookGenerator.tsx, BookReader.tsx, ChapterView.tsx, etc.
│   └── index.ts
├── user/                   # User profile and dashboard
│   ├── components/         # UserDashboard.tsx, Settings.tsx, CreditPurchaseModal.tsx, etc.
│   └── index.ts
└── shared/                 # Shared utilities and components
    ├── components/         # UI components, Layout.tsx, ProtectedRoute.tsx, etc.
    ├── hooks/              # use-toast.ts, useApiCheck.ts
    ├── utils/              # API utilities, credit pricing, download utils, etc.
    └── index.ts
```

### Current Module Implementations

#### 1. Authentication Module (`src/modules/auth/`)
- **Components**: Auth.tsx, AuthCallback.tsx, ResetPassword.tsx
- **Context**: ClerkAuthContext providing useClerkAuth hook
- **Integration**: Clerk authentication with JWT tokens
- **Features**: Google OAuth, session management, protected routes

#### 2. Story Module (`src/modules/story/`)
- **Components**: StoryForm, StoryResult, StreamingText, TikTokShareSection
- **Hooks**: useStoryGeneration (streaming), useStreamingGeneration
- **Services**: AI service integration with Groq API
- **Utils**: Story prompts, personality types, image prompt extraction
- **Features**: Real-time streaming generation, Taylor Swift themed prompts

#### 3. Ebook Module (`src/modules/ebook/`)
- **Components**: EbookGenerator, BookReader, ChapterView, StreamingChapterView
- **Features**: Chapter-by-chapter generation, illustration creation, PDF export
- **UI**: Immersive reading mode, progress tracking, bookmark management
- **Integration**: RUNWARE for image generation, streaming content

#### 4. User Module (`src/modules/user/`)
- **Components**: UserDashboard, Settings, CreditPurchaseModal, PersonalitySelector
- **Features**: Profile management, subscription handling, credit system
- **UI**: Dashboard with story/ebook management, settings panel

#### 5. Shared Module (`src/modules/shared/`)
- **Components**: Layout, ProtectedRoute, AdminRoute, UI components (shadcn/ui)
- **Hooks**: use-toast, useApiCheck
- **Utils**: API retry logic, credit pricing, download utilities, social sharing
- **Features**: Cross-module utilities and reusable components

## 🔧 Current Backend Implementation

### Supabase Edge Functions Architecture

The backend is implemented using Supabase Edge Functions (serverless Deno functions) deployed globally via Supabase's infrastructure. This provides:

#### Edge Functions Overview
- **Runtime**: Deno (secure TypeScript runtime)
- **Deployment**: Global CDN with automatic scaling
- **Database**: Direct PostgreSQL access with connection pooling
- **Authentication**: JWT token validation with Clerk integration

#### Current Edge Functions
```typescript
supabase/functions/
├── story-generation/     # Main story creation endpoint
├── ebook-generation/     # Chapter-by-chapter ebook creation
├── credits/             # Credit balance management
├── credits-validate/    # Credit validation for operations
├── check-subscription/  # Subscription status checking
├── create-checkout/     # Stripe checkout session creation
├── customer-portal/     # Stripe customer portal access
├── tiktok-share-analytics/ # Social sharing analytics
├── text-to-speech/      # Audio narration generation
└── admin-credits/       # Administrative credit management
```

#### Database Schema (Current)
- **profiles**: User profiles with Clerk integration
- **stories**: Generated stories with metadata
- **ebook_generations**: Ebook creation tracking
- **memory_books**: Completed ebooks
- **user_credits**: Credit system management
- **credit_transactions**: Transaction history
- **tiktok_shares**: Social media analytics

#### Authentication Flow
1. User authenticates via Clerk (frontend)
2. Clerk provides JWT token with user claims
3. Edge functions validate JWT and extract user ID
4. Database operations use RLS policies with user context

### Key Technical Decisions

#### Why Supabase Edge Functions?
- **Serverless**: No server management, automatic scaling
- **TypeScript**: Type-safe backend development
- **Global CDN**: Low latency for users worldwide
- **PostgreSQL Direct Access**: Efficient database operations
- **Built-in Auth**: Seamless Clerk integration

#### Modular Architecture Benefits
- **Separation of Concerns**: Each module handles specific functionality
- **Maintainability**: Clear boundaries and responsibilities
- **Testability**: Isolated modules can be tested independently
- **Scalability**: Modules can be optimized and scaled individually
- **Developer Experience**: Focused development on specific features

### Data Flow Architecture

```
User Request → Clerk Auth → Edge Function → Database (RLS) → AI Services → Response
```

1. **Authentication**: Clerk handles user authentication and provides JWT
2. **Authorization**: Edge functions validate tokens and enforce RLS policies
3. **Business Logic**: Serverless functions process requests and manage credits
4. **AI Integration**: Direct API calls to Groq, RUNWARE, and other services
5. **Data Persistence**: PostgreSQL with row-level security ensures data isolation

## 🎯 Architecture Benefits

### Scalability
- **Serverless Backend**: Automatic scaling with Supabase Edge Functions
- **Modular Frontend**: Independent module optimization and deployment
- **CDN Delivery**: Global content delivery for static assets

### Developer Experience
- **TypeScript**: End-to-end type safety from frontend to backend
- **Modular Development**: Clear separation of concerns and responsibilities
- **Consistent Patterns**: Standardized hooks, services, and component structures

### Maintainability
- **Clear Boundaries**: Each module has defined responsibilities
- **Testable Units**: Isolated modules enable focused testing
- **Documentation**: Comprehensive inline documentation and API specs

### Performance
- **Streaming Generation**: Real-time content delivery for better UX
- **Lazy Loading**: Component-level code splitting for faster initial loads
- **Edge Computing**: Reduced latency through global function deployment

## 🚀 Future Enhancements

### Planned Improvements
- **Mobile App**: React Native implementation using shared modules
- **Advanced AI**: Integration with additional AI models and capabilities
- **Analytics Dashboard**: Enhanced user behavior tracking and insights
- **API Access**: Third-party developer API for integrations
  
  // Story analytics
  GET  /stories/:id/analytics
  POST /stories/:id/views
}
```

#### 3. Ebook Service
```typescript
// backend/services/ebook-service/src/
interface EbookServiceAPI {
  // Ebook CRUD
  POST /ebooks
  GET  /ebooks/:id
  PUT  /ebooks/:id
  DELETE /ebooks/:id
  
  // Ebook generation
  POST /ebooks/:id/chapters
  POST /ebooks/:id/illustrations
  POST /ebooks/:id/pdf
  POST /ebooks/:id/epub
  
  // Publishing
  POST /ebooks/:id/publish
  GET  /ebooks/:id/status
}
```

#### 4. AI Service
```typescript
// backend/services/ai-service/src/
interface AIServiceAPI {
  // Text generation
  POST /ai/generate/story
  POST /ai/generate/chapters
  POST /ai/enhance/prompt
  
  // Image generation
  POST /ai/generate/image
  POST /ai/generate/cover
  POST /ai/enhance/image
  
  // Service management
  GET  /ai/services/status
  POST /ai/services/switch
}
```

## 💾 Database Architecture

### Database Design Principles

1. **Single Source of Truth**: Supabase PostgreSQL as primary database
2. **Data Consistency**: ACID transactions for critical operations
3. **Performance**: Optimized indexes and query patterns
4. **Scalability**: Horizontal scaling through read replicas
5. **Security**: Row-level security and data encryption

### Core Tables Schema

```sql
-- Users and Authentication
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    prompt_data JSONB,
    generation_settings JSONB,
    metadata JSONB DEFAULT '{}',
    status story_status DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Memory Books (Ebooks)
CREATE TABLE memory_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_story_id UUID REFERENCES stories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    chapters JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    cover_image_url TEXT,
    generation_settings JSONB,
    style_preferences JSONB,
    status book_status DEFAULT 'draft',
    published_at TIMESTAMP,
    pdf_url TEXT,
    epub_url TEXT,
    images JSONB DEFAULT '[]',
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Activities (Analytics)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Performance Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);

-- Composite indexes
CREATE INDEX idx_stories_user_status ON stories(user_id, status);
CREATE INDEX idx_books_user_status ON memory_books(user_id, status);
```

## 🔐 Security Architecture

### Authentication & Authorization

```typescript
// Security middleware stack
interface SecurityMiddleware {
  // Authentication
  clerkAuth: ClerkAuthMiddleware
  sessionValidation: SessionValidationMiddleware
  
  // Authorization
  rbac: RoleBasedAccessControl
  permissions: PermissionMiddleware
  
  // Security headers
  helmet: HelmetMiddleware
  cors: CorsMiddleware
  rateLimit: RateLimitMiddleware
  
  // Input validation
  validation: ValidationMiddleware
  sanitization: SanitizationMiddleware
}
```

### Data Protection

```typescript
interface DataProtection {
  // Encryption
  encryption: {
    atRest: 'AES-256-GCM'
    inTransit: 'TLS 1.3'
    keys: 'AWS KMS'
  }
  
  // Access control
  accessControl: {
    authentication: 'Clerk'
    authorization: 'RBAC'
    sessionManagement: 'JWT + Refresh Tokens'
  }
  
  // Audit logging
  auditLog: {
    events: string[]
    retention: '7 years'
    compliance: 'SOC 2'
  }
}
```

## 📊 Monitoring & Observability

### Monitoring Stack

```typescript
interface MonitoringStack {
  // Application monitoring
  apm: {
    service: 'New Relic'
    metrics: ['response_time', 'throughput', 'error_rate']
    alerts: AlertConfig[]
  }
  
  // Error tracking
  errorTracking: {
    service: 'Sentry'
    environments: ['development', 'staging', 'production']
    notifications: NotificationConfig[]
  }
  
  // Logging
  logging: {
    service: 'Winston + ELK Stack'
    levels: ['error', 'warn', 'info', 'debug']
    retention: '90 days'
  }
  
  // Infrastructure monitoring
  infrastructure: {
    service: 'Datadog'
    metrics: ['cpu', 'memory', 'disk', 'network']
    dashboards: DashboardConfig[]
  }
}
```

## 🚀 Deployment Architecture

### Environment Strategy

```typescript
interface EnvironmentStrategy {
  development: {
    infrastructure: 'Local Docker Compose'
    database: 'Local PostgreSQL'
    storage: 'Local filesystem'
    monitoring: 'Basic logging'
  }
  
  staging: {
    infrastructure: 'AWS ECS'
    database: 'Supabase Staging'
    storage: 'AWS S3'
    monitoring: 'Full monitoring stack'
  }
  
  production: {
    infrastructure: 'AWS EKS'
    database: 'Supabase Production'
    storage: 'AWS S3 + CloudFront'
    monitoring: 'Full monitoring + alerting'
  }
}
```

### CI/CD Pipeline

```yaml
# Deployment pipeline stages
stages:
  - build
  - test
  - security-scan
  - deploy-staging
  - integration-tests
  - deploy-production
  - smoke-tests
  - monitoring-check
```

## 🔄 Data Flow Architecture

### Request Flow

```
User Request → Load Balancer → API Gateway → Auth Middleware → 
Service Router → Microservice → Database → Response Pipeline → 
Cache Layer → CDN → User Response
```

### Event-Driven Architecture

```typescript
interface EventDrivenFlow {
  events: {
    'user.registered': UserRegisteredEvent
    'story.created': StoryCreatedEvent
    'ebook.generated': EbookGeneratedEvent
    'payment.completed': PaymentCompletedEvent
  }
  
  handlers: {
    onUserRegistered: (event: UserRegisteredEvent) => Promise<void>
    onStoryCreated: (event: StoryCreatedEvent) => Promise<void>
    onEbookGenerated: (event: EbookGeneratedEvent) => Promise<void>
    onPaymentCompleted: (event: PaymentCompletedEvent) => Promise<void>
  }
  
  queues: {
    'user-events': EventQueue
    'content-events': EventQueue
    'payment-events': EventQueue
  }
}
```

## 📈 Scalability Considerations

### Horizontal Scaling

1. **Frontend**: CDN distribution and edge caching
2. **API Gateway**: Load balancer with multiple instances
3. **Microservices**: Auto-scaling based on demand
4. **Database**: Read replicas and connection pooling
5. **File Storage**: CDN with global distribution

### Performance Optimization

```typescript
interface PerformanceOptimization {
  frontend: {
    bundleSplitting: 'Module-based chunks'
    lazyLoading: 'Route and component level'
    caching: 'Service worker + browser cache'
    imageOptimization: 'WebP + lazy loading'
  }
  
  backend: {
    caching: 'Redis for API responses'
    databaseOptimization: 'Query optimization + indexes'
    compression: 'Gzip + Brotli'
    cdn: 'Static asset distribution'
  }
}
```

## 🎯 Architecture Benefits

### Modularity Benefits
- **Maintainability**: Clear separation of concerns
- **Testability**: Isolated modules for unit testing
- **Scalability**: Independent scaling of services
- **Team Productivity**: Parallel development capabilities

### Production Readiness
- **Reliability**: Fault tolerance and graceful degradation
- **Security**: Defense in depth approach
- **Performance**: Optimized for speed and efficiency
- **Monitoring**: Comprehensive observability

---

*This architecture supports FlipMyEra's growth from startup to enterprise scale while maintaining code quality and development velocity.* 