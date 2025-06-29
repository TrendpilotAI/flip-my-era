# FlipMyEra Architecture Overview

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React/TypeScript)  │  Mobile App (React Native)      │
│  - Modular Components        │  - Shared Components             │
│  - State Management          │  - Offline Capabilities          │
│  - Service Workers           │  - Push Notifications            │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
┌─────────────────▼───────────────────────────────▼───────────────┐
│                      API GATEWAY                                │
│  - Authentication Middleware  - Rate Limiting                   │
│  - Request Routing            - Response Caching                │
│  - Load Balancing            - API Versioning                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                   MICROSERVICES LAYER                           │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ Auth        │ Story       │ Ebook       │ User        │ AI      │
│ Service     │ Service     │ Service     │ Service     │ Service │
│             │             │             │             │         │
│ - Clerk     │ - Story     │ - Chapter   │ - Profile   │ - Groq  │
│   Integration│   Generation│   Creation  │   Mgmt      │ - RUNWARE│
│ - Session   │ - Validation│ - PDF Gen   │ - Settings  │ - OpenAI│
│   Mgmt      │ - Storage   │ - Image Gen │ - Analytics │         │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                     DATA LAYER                                  │
├─────────────────┬───────────────────────────────┬───────────────┤
│   Supabase      │        File Storage           │     Cache     │
│   PostgreSQL    │                               │               │
│                 │  - AWS S3 (Images/PDFs)       │  - Redis      │
│  - User Data    │  - CloudFront CDN             │  - Session    │
│  - Stories      │  - Image Optimization         │    Store      │
│  - Memory Books │  - Backup & Versioning        │  - API Cache  │
│  - Analytics    │                               │               │
└─────────────────┴───────────────────────────────┴───────────────┘
```

## 🧩 Modular Frontend Architecture

### Module Structure

```typescript
// src/modules/auth/
export interface AuthModule {
  components: {
    LoginForm: React.FC<LoginFormProps>
    SignupForm: React.FC<SignupFormProps>
    AuthGuard: React.FC<AuthGuardProps>
    UserProfile: React.FC<UserProfileProps>
  }
  hooks: {
    useAuth: () => AuthState
    useSession: () => SessionState
    usePermissions: () => PermissionState
  }
  services: {
    authService: AuthService
    sessionService: SessionService
  }
  types: {
    User: UserType
    AuthState: AuthStateType
    Session: SessionType
  }
}
```

### Core Modules

#### 1. Authentication Module (`src/modules/auth/`)
```typescript
interface AuthService {
  // Authentication methods
  signIn(credentials: LoginCredentials): Promise<AuthResult>
  signUp(userData: SignupData): Promise<AuthResult>
  signOut(): Promise<void>
  
  // Session management
  getCurrentUser(): Promise<User | null>
  refreshToken(): Promise<string>
  validateSession(): Promise<boolean>
  
  // Permissions
  hasPermission(permission: string): boolean
  getUserRoles(): string[]
}
```

#### 2. Story Module (`src/modules/story/`)
```typescript
interface StoryService {
  // Story generation
  generateStory(prompt: StoryPrompt): Promise<Story>
  regenerateStory(storyId: string): Promise<Story>
  
  // Story management
  saveStory(story: Story): Promise<string>
  getStory(storyId: string): Promise<Story>
  getUserStories(userId: string): Promise<Story[]>
  deleteStory(storyId: string): Promise<void>
  
  // Story validation
  validateStoryContent(content: string): ValidationResult
  sanitizeStoryContent(content: string): string
}
```

#### 3. Ebook Module (`src/modules/ebook/`)
```typescript
interface EbookService {
  // Ebook creation
  createEbook(story: Story, settings: EbookSettings): Promise<Ebook>
  generateChapters(story: Story): Promise<Chapter[]>
  generateIllustrations(chapters: Chapter[]): Promise<string[]>
  
  // File generation
  generatePDF(ebook: Ebook): Promise<Blob>
  generateEPUB(ebook: Ebook): Promise<Blob>
  generateCover(ebook: Ebook): Promise<string>
  
  // Ebook management
  saveEbook(ebook: Ebook): Promise<string>
  getEbook(ebookId: string): Promise<Ebook>
  getUserEbooks(userId: string): Promise<Ebook[]>
  publishEbook(ebookId: string): Promise<void>
}
```

#### 4. User Module (`src/modules/user/`)
```typescript
interface UserService {
  // Profile management
  getProfile(userId: string): Promise<UserProfile>
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void>
  
  // Preferences
  getPreferences(userId: string): Promise<UserPreferences>
  updatePreferences(userId: string, preferences: UserPreferences): Promise<void>
  
  // Analytics
  trackActivity(userId: string, activity: UserActivity): Promise<void>
  getUserAnalytics(userId: string): Promise<UserAnalytics>
  
  // Subscription
  getSubscription(userId: string): Promise<Subscription>
  updateSubscription(userId: string, tier: SubscriptionTier): Promise<void>
}
```

#### 5. Shared Module (`src/modules/shared/`)
```typescript
interface SharedModule {
  components: {
    Button: React.FC<ButtonProps>
    Modal: React.FC<ModalProps>
    LoadingSpinner: React.FC<LoadingSpinnerProps>
    ErrorBoundary: React.FC<ErrorBoundaryProps>
  }
  hooks: {
    useApi: <T>(endpoint: string) => ApiState<T>
    useLocalStorage: <T>(key: string) => [T, (value: T) => void]
    useDebounce: <T>(value: T, delay: number) => T
  }
  utils: {
    formatDate: (date: Date) => string
    sanitizeInput: (input: string) => string
    generateId: () => string
    validateEmail: (email: string) => boolean
  }
}
```

## 🔧 Backend Microservices Architecture

### Service Communication

```typescript
// Service-to-service communication patterns
interface ServiceCommunication {
  // Synchronous communication (REST)
  http: {
    baseUrl: string
    timeout: number
    retries: number
    headers: Record<string, string>
  }
  
  // Asynchronous communication (Message Queue)
  messageQueue: {
    publisher: MessagePublisher
    subscriber: MessageSubscriber
    topics: string[]
  }
  
  // Service discovery
  discovery: {
    register: (service: ServiceInfo) => Promise<void>
    discover: (serviceName: string) => Promise<ServiceInfo>
    healthCheck: () => Promise<HealthStatus>
  }
}
```

### Individual Services

#### 1. Authentication Service
```typescript
// backend/services/auth-service/src/
interface AuthServiceAPI {
  // Clerk integration
  POST /auth/clerk/webhook
  POST /auth/clerk/validate
  
  // Session management
  POST /auth/sessions/create
  GET  /auth/sessions/validate
  DELETE /auth/sessions/destroy
  
  // User management
  GET  /auth/users/:id
  PUT  /auth/users/:id
  DELETE /auth/users/:id
  
  // Permissions
  GET  /auth/permissions/:userId
  POST /auth/permissions/check
}
```

#### 2. Story Service
```typescript
// backend/services/story-service/src/
interface StoryServiceAPI {
  // Story CRUD
  POST /stories
  GET  /stories/:id
  PUT  /stories/:id
  DELETE /stories/:id
  
  // Story generation
  POST /stories/generate
  POST /stories/:id/regenerate
  
  // User stories
  GET  /users/:userId/stories
  
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