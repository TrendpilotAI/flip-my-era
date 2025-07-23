# Deploy Stories Edge Function

## Prerequisites
Make sure you have the Supabase CLI installed and logged in:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

## Deploy the Stories Function

Run this command in your project root to deploy the stories function:

```bash
supabase functions deploy stories
```

## Verify Deployment

After deployment, you can test the function:

```bash
# Test with curl
curl -X OPTIONS https://YOUR_PROJECT_REF.supabase.co/functions/v1/stories \
  -H "Origin: http://localhost:8081" \
  -v
```

The response should include CORS headers like:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Environment Variables

Make sure your Edge Function has access to these environment variables in Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

You can set these in the Supabase dashboard under Settings > Edge Functions.

## Troubleshooting

If you still get CORS errors after deployment:

1. **Check the function logs** in Supabase Dashboard > Edge Functions > stories
2. **Verify environment variables** are set correctly
3. **Test the preflight request** manually with curl
4. **Clear browser cache** and try again

## Alternative: Test Locally

You can also test the function locally:

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve stories --no-verify-jwt

# Test locally
curl -X POST http://localhost:54321/functions/v1/stories \
  -H "Authorization: Bearer your-test-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","initial_story":"Test story"}'
``` 