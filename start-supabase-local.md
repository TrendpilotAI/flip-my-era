# Starting Supabase Edge Functions Locally

## Quick Fix for 503 Service Unavailable Errors

If you're getting 503 errors when trying to fetch credits, it's because the Supabase Edge Functions aren't running locally. Here are your options:

### Option 1: Use Development Mode (Recommended for Testing)

The application now includes fallback handling for development mode. When you get a 503 error in development:

- **Credit Balance**: Will show 5 mock credits
- **Credit Validation**: Will allow unlocks without spending credits
- **Credit Wall**: Will work with mock data

This allows you to test the credit-based flow without needing to run Edge Functions locally.

### Option 2: Start Supabase Edge Functions Locally

If you want to test with real data, you can start the Supabase Edge Functions:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Start Supabase locally**:
   ```bash
   supabase start
   ```

3. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy credits
   supabase functions deploy credits-validate
   ```

4. **Verify functions are running**:
   ```bash
   supabase functions list
   ```

### Option 3: Use Production Edge Functions

If you have Edge Functions deployed to production, you can update the API endpoints to use the production URLs:

```typescript
// In ClerkAuthContext.tsx, CreditBalance.tsx, etc.
const response = await fetch('https://your-project.supabase.co/functions/v1/credits', {
  // ... rest of the code
});
```

## Current Development Behavior

With the latest changes, the application will:

1. **Try to fetch real credit data** from `/api/functions/credits`
2. **If 503 error occurs** (Edge Functions not running):
   - Show 5 mock credits in development
   - Allow credit validation to pass in development
   - Display appropriate development mode messages
3. **If real data is available**:
   - Use the actual credit balance
   - Perform real credit validation
   - Work with production credit system

## Testing the Credit Flow

You can now test the complete credit-based ebook generation flow:

1. **Generate an ebook** - This works without credits
2. **See the credit wall** - Shows mock credits in development
3. **Unlock the story** - Works with mock validation in development
4. **Purchase credits** - Opens Stripe modal (works with real Stripe)

The flow is fully functional for testing purposes, even without local Edge Functions running. 