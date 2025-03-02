# Supabase Edge Functions

This directory contains serverless edge functions that run on Deno Deploy through Supabase Edge Functions.

## Structure

- `_shared/` - Shared utilities used across multiple functions
- `brevo-email/` - Function to send emails using the Brevo API
- `generate-video/` - Function to generate videos from text prompts
- `migrate-email-templates/` - Function to migrate email templates to Brevo
- `samcart-webhook/` - Function to handle SamCart webhook events
- `text-to-speech/` - Function to convert text to speech using ElevenLabs
- `tiktok-auth/` - Function to handle TikTok authentication
- `tiktok-share-analytics/` - Function to track TikTok share analytics

## Shared Utilities

The `_shared/utils.ts` file contains common utilities used across functions:

- `corsHeaders` - Standard CORS headers for all functions
- `handleCors()` - Helper to handle CORS preflight requests
- `initSupabaseClient()` - Initialize Supabase client with error handling
- `formatErrorResponse()` - Standard error response formatter
- `formatSuccessResponse()` - Standard success response formatter

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `BREVO_API_KEY` - Your Brevo API key (for email functions)
- `ELEVEN_LABS_API_KEY` - Your ElevenLabs API key (for text-to-speech)
- `TIKTOK_CLIENT_KEY` - Your TikTok client key (for TikTok integration)
- `TIKTOK_CLIENT_SECRET` - Your TikTok client secret (for TikTok integration)

## Deployment

To deploy these functions, use the Supabase CLI:

```bash
supabase functions deploy <function-name>
```

For example:

```bash
supabase functions deploy brevo-email
```

## Testing Locally

To test these functions locally, use the Supabase CLI:

```bash
supabase start
supabase functions serve <function-name> --env-file .env.local
```

## Recent Improvements

1. **Standardized Dependencies**:
   - All functions now use the same version of the Deno standard library (`@0.190.0`)
   - All functions now use the same version of the Supabase client (`@2.39.7`)

2. **Shared Utilities**:
   - Created a shared utility module for common functionality
   - Standardized CORS handling across all functions
   - Standardized error handling and response formatting

3. **Type Safety**:
   - Replaced `any` types with proper TypeScript interfaces
   - Added proper type checking for request and response objects

4. **Error Handling**:
   - Improved error handling with detailed error messages
   - Added consistent error response format across all functions

5. **Environment Variable Handling**:
   - Standardized environment variable access using `Deno.env.get()`
   - Added proper null checking for environment variables

## Future Improvements

1. **Rate Limiting**: Add rate limiting to protect against abuse
2. **Authentication**: Add proper authentication for function calls
3. **Logging**: Enhance logging for better debugging and monitoring
4. **Unit Tests**: Add unit tests for each function
5. **Documentation**: Add JSDoc comments to all functions and interfaces 