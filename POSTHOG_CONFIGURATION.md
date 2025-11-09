# PostHog Analytics Configuration Guide

## Overview

PostHog has been fully integrated into FlipMyEra for comprehensive product analytics, user behavior tracking, and feature flag management.

---

## ✅ Implementation Complete

### Core Integration
- ✅ PostHog service created (`src/core/integrations/posthog.ts`)
- ✅ Initialized in `main.tsx` before React renders
- ✅ User identification integrated with Clerk authentication
- ✅ Page view tracking for React Router
- ✅ Event tracking throughout application

### Event Tracking Coverage

**Authentication Events**:
- `user_signed_up` - New user registration
- `user_signed_in` - User login
- `user_signed_out` - User logout

**Wizard Navigation Events**:
- `era_selected` - ERA selection
- `prompt_selected` - Story prompt selection
- `character_selected` - Character archetype selection
- `format_selected` - Story format selection

**Story Generation Events**:
- `storyline_generation_started` - Storyline generation begins
- `storyline_generation_completed` - Storyline generation succeeds
- `storyline_generation_failed` - Storyline generation fails
- `story_generation_started` - Story generation begins
- `chapter_completed` - Individual chapter completion
- `story_generation_completed` - Story generation succeeds
- `story_generation_failed` - Story generation fails
- `story_generation_aborted` - User cancels generation

**Page View Events**:
- `$pageview` - Automatic page view tracking for all routes

---

## Environment Variables

### Required Variables

Add these to your **Netlify Environment Variables**:

1. **VITE_POSTHOG_KEY**
   - **Description**: PostHog project API key
   - **How to get**: PostHog Dashboard → Project Settings → Project API Key
   - **Scopes**: ✅ Production (and optionally Deploy previews)
   - **Example**: `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **VITE_POSTHOG_HOST** (Optional)
   - **Description**: PostHog API host URL
   - **Default**: `https://app.posthog.com`
   - **Use custom host**: If using self-hosted PostHog
   - **Scopes**: ✅ Production

### Optional Variables

3. **VITE_POSTHOG_ENABLED**
   - **Description**: Enable/disable PostHog (default: true if API key exists)
   - **Values**: `true` or `false`
   - **Default**: `true` (if API key is set)
   - **Scopes**: ✅ Production

---

## Configuration Steps

### Step 1: Get PostHog API Key

1. **Sign up/Login** to [PostHog](https://posthog.com)
2. **Create a Project** (if you don't have one)
3. **Get API Key**:
   - Go to **Project Settings** → **Project API Key**
   - Copy the API key (starts with `phc_`)

### Step 2: Add to Netlify Environment Variables

**Via Netlify CLI**:
```bash
netlify env:set VITE_POSTHOG_KEY "phc_your_api_key_here" --context production
netlify env:set VITE_POSTHOG_HOST "https://app.posthog.com" --context production
```

**Via Netlify Dashboard**:
1. Go to **Site Settings** → **Environment Variables**
2. Click **Add a variable**
3. Add:
   - **Key**: `VITE_POSTHOG_KEY`
   - **Value**: [Your PostHog API key]
   - **Scopes**: Production
4. (Optional) Add `VITE_POSTHOG_HOST` if using custom host

### Step 3: Verify Configuration

After deployment, verify PostHog is working:

1. **Visit your production site**
2. **Open browser DevTools** → Console
3. **Check for PostHog initialization** (should see no errors)
4. **Perform an action** (e.g., select an ERA)
5. **Check PostHog Dashboard** → **Events** → Verify events appear

---

## Usage Examples

### Tracking Custom Events

```typescript
import { posthogService, posthogEvents } from '@/core/integrations/posthog';

// Using helper functions
posthogEvents.eraSelected('1989');
posthogEvents.storyGenerationStarted({ format: 'short-story' });

// Using service directly
posthogService.capture('custom_event', {
  property1: 'value1',
  property2: 'value2',
});
```

### User Identification

User identification is automatically handled when users sign in/up. To manually identify:

```typescript
import { posthogService } from '@/core/integrations/posthog';

posthogService.identify(userId, {
  email: userEmail,
  name: userName,
  subscription_status: 'premium',
});
```

### Feature Flags

```typescript
import { posthogService } from '@/core/integrations/posthog';

// Check if feature is enabled
if (posthogService.isFeatureEnabled('new-feature')) {
  // Show new feature
}

// Get feature flag value
const flagValue = posthogService.getFeatureFlag('feature-flag', 'default-value');
```

### Setting User Properties

```typescript
import { posthogService } from '@/core/integrations/posthog';

posthogService.setPersonProperties({
  subscription_status: 'premium',
  credits: 100,
  favorite_era: '1989',
});
```

---

## Event Properties

All events include relevant context:

**Story Generation Events**:
- `era` - Selected ERA
- `format` - Story format (preview, short-story, novella)
- `numChapters` - Number of chapters
- `chapterCount` - Total chapters
- `wordCount` - Total word count
- `characterName` - Character name
- `characterArchetype` - Character archetype

**Error Events**:
- `error` - Error message
- `errorType` - Error type/name
- `component` - Component where error occurred

**User Events**:
- `userId` - User ID
- `email` - User email
- `subscription_status` - Subscription tier

---

## Privacy & Compliance

### Privacy Settings

PostHog is configured with:
- ✅ **Respect DNT**: Respects Do Not Track headers
- ✅ **Session Recording Disabled**: Disabled by default for privacy
- ✅ **Autocapture Enabled**: Captures clicks, form submissions, etc.
- ✅ **Page View Tracking**: Automatic for SPA navigation

### GDPR Compliance

- User data is only sent to PostHog when users are identified
- Users can opt-out via browser DNT settings
- No PII is captured without user identification

---

## Troubleshooting

### PostHog Not Initializing

1. **Check Environment Variable**:
   ```bash
   netlify env:get VITE_POSTHOG_KEY --context production
   ```
   Should return your API key

2. **Check Browser Console**:
   - Look for PostHog initialization errors
   - Verify `VITE_POSTHOG_KEY` is available at build time

3. **Verify Production Build**:
   - PostHog only initializes in production builds
   - Check `import.meta.env.PROD` is true

### Events Not Appearing

1. **Check PostHog Dashboard**:
   - Go to **Events** → **Live Events**
   - Verify events are being received

2. **Check Network Tab**:
   - Open DevTools → Network
   - Filter for `posthog` or `batch`
   - Verify requests are being sent

3. **Check User Identification**:
   - Events may be anonymous if user not identified
   - Verify user sign-in triggers identification

### Feature Flags Not Working

1. **Verify Feature Flag Exists**:
   - Check PostHog Dashboard → **Feature Flags**
   - Ensure flag is created and enabled

2. **Check User Identification**:
   - Feature flags require user identification
   - Verify user is identified before checking flags

3. **Reload Flags**:
   ```typescript
   posthogService.reloadFeatureFlags();
   ```

---

## Integration Points

### Files Modified

1. **`src/core/integrations/posthog.ts`**
   - PostHog service implementation
   - Event helper functions
   - Initialization logic

2. **`src/app/main.tsx`**
   - PostHog initialization before React renders

3. **`src/App.tsx`**
   - Page view tracking component

4. **`src/modules/auth/contexts/ClerkAuthContext.tsx`**
   - User identification on sign-in/sign-up
   - User reset on sign-out

5. **`src/modules/story/components/StoryWizard.tsx`**
   - Wizard navigation event tracking

6. **`src/modules/story/services/storylineGeneration.ts`**
   - Storyline generation event tracking

7. **`src/modules/story/hooks/useStreamingGeneration.ts`**
   - Story generation lifecycle event tracking

---

## Next Steps

1. ✅ **Add PostHog API Key** to Netlify environment variables
2. ✅ **Deploy** site to apply changes
3. ✅ **Verify Events** in PostHog dashboard
4. ✅ **Set up Dashboards** in PostHog for key metrics
5. ✅ **Create Feature Flags** as needed
6. ✅ **Set up Alerts** for critical events

---

## PostHog Dashboard Links

- **Events**: https://app.posthog.com/events
- **Insights**: https://app.posthog.com/insights
- **Feature Flags**: https://app.posthog.com/feature_flags
- **Persons**: https://app.posthog.com/persons
- **Project Settings**: https://app.posthog.com/project/settings

---

**Last Updated**: 2025-11-09
**Status**: ✅ Fully Configured - Ready for Production

