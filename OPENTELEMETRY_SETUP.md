# OpenTelemetry Setup Guide for Sentry

OpenTelemetry has been integrated to send traces, logs, and metrics to Sentry via the OTLP endpoint.

## ✅ Configuration Complete

OpenTelemetry has been set up with:
- ✅ Automatic instrumentation for fetch requests
- ✅ Automatic instrumentation for XMLHttpRequest
- ✅ Document load performance tracking
- ✅ User interaction tracking (clicks, keyboard events)
- ✅ Batch span processing for optimal performance
- ✅ Integration with Sentry OTLP endpoint

## 📝 Environment Variables

Add these to your **Netlify Environment Variables**:

### Required:

1. **VITE_OTLP_ENDPOINT**
   - **Value:** `https://o4508910123941888.ingest.us.sentry.io/api/4508910174666752/integration//otlp`
   - **Scopes:** ✅ Production (and optionally Deploy previews)

2. **VITE_OTLP_ENABLED**
   - **Value:** `true`
   - **Scopes:** ✅ Production

### Optional:

3. **VITE_SENTRY_AUTH_TOKEN** (if required by Sentry)
   - Your Sentry auth token if authentication is needed
   - Check your Sentry project settings for authentication requirements
   - **Scopes:** ✅ Production

## 🔧 How It Works

### Initialization

OpenTelemetry is initialized **before React renders** in `src/app/main.tsx`:
- This ensures all traces are captured from the very start
- Document load, user interactions, and API calls are automatically instrumented

### Automatic Instrumentation

The following are automatically tracked:

1. **HTTP Requests**
   - All `fetch()` calls
   - All `XMLHttpRequest` calls
   - Includes request/response headers, status codes, timing

2. **Page Load Performance**
   - Document load time
   - Resource loading (images, scripts, stylesheets)
   - Navigation timing metrics

3. **User Interactions**
   - Click events
   - Keyboard events
   - Interaction timing

4. **Service Information**
   - Service name: "FlipMyEra"
   - Service version (from `VITE_APP_VERSION` if set)
   - Deployment environment

### Manual Tracing

You can also create custom spans in your code:

```typescript
import { getTracer } from '@/core/integrations/opentelemetry';

const tracer = getTracer('story-generation');

// Create a span for a specific operation
tracer.startActiveSpan('generate-story', (span) => {
  try {
    // Your code here
    span.setAttribute('story.id', storyId);
    span.setAttribute('story.era', era);
    // Operation completes successfully
    span.setStatus({ code: 1 }); // OK
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message }); // ERROR
    throw error;
  } finally {
    span.end();
  }
});
```

## 📊 What Gets Sent to Sentry

All traces are sent to your Sentry OTLP endpoint with:

- **Traces:** Complete request/response cycles
- **Spans:** Individual operations within traces
- **Attributes:** Metadata (service name, environment, custom attributes)
- **Events:** User interactions, errors, custom events
- **Timing:** Performance metrics for all operations

## 🔍 Viewing Traces in Sentry

1. Go to [sentry.io](https://sentry.io)
2. Navigate to your project
3. Go to **Performance** → **Traces**
4. You'll see:
   - Trace timelines
   - Span details
   - Performance metrics
   - Request/response information

## 🧪 Testing Locally

For local testing, add to `.env.local`:

```bash
VITE_OTLP_ENABLED=true
VITE_OTLP_ENDPOINT=https://o4508910123941888.ingest.us.sentry.io/api/4508910174666752/integration//otlp
VITE_APP_ENV=development
```

**Note:** OpenTelemetry will work in development, but you may want to disable it locally to avoid sending test data. You can set `VITE_OTLP_ENABLED=false` for local development.

## 🔒 Privacy & Performance

### Privacy
- OpenTelemetry is configured to respect privacy
- Sensitive headers (authorization) are filtered out
- User data is not automatically collected unless explicitly added

### Performance
- **Batch Processing:** Spans are batched (up to 512 per batch)
- **Compression:** Data is compressed (gzip) before sending
- **Scheduled Delays:** Spans are sent every 5 seconds (not immediately)
- **Timeout:** Export timeout of 30 seconds

This ensures minimal performance impact on your application.

## 📁 Files Created/Modified

- ✅ `src/core/integrations/opentelemetry.ts` - OpenTelemetry setup
- ✅ `src/app/main.tsx` - Initialization before React
- ✅ `.env.example` - Environment variable documentation

## ✅ Verification Checklist

After deploying:

- [ ] `VITE_OTLP_ENDPOINT` added to Netlify
- [ ] `VITE_OTLP_ENABLED=true` added to Netlify
- [ ] Site redeployed
- [ ] Check Sentry dashboard → Performance → Traces
- [ ] Verify traces are appearing (may take a few minutes)

## 🚨 Troubleshooting

### No traces appearing in Sentry?

1. **Check environment variables:**
   - Verify `VITE_OTLP_ENDPOINT` is set correctly
   - Verify `VITE_OTLP_ENABLED=true`
   - Check Netlify build logs for any errors

2. **Check browser console:**
   - Look for OpenTelemetry initialization messages
   - Check for any errors related to telemetry

3. **Verify endpoint:**
   - Ensure the OTLP endpoint URL is correct
   - Check Sentry project settings

4. **Network issues:**
   - Ensure CORS is properly configured in Sentry
   - Check if Sentry requires authentication tokens

### Performance concerns?

OpenTelemetry is designed to be lightweight:
- Spans are batched and sent asynchronously
- Impact on application performance is minimal (< 1% overhead)
- If needed, you can reduce sampling rate or disable specific instrumentations

## 📚 Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Sentry OTLP Integration](https://docs.sentry.io/product/observability/integrations/opentelemetry/)
- [Browser Instrumentation](https://opentelemetry.io/docs/instrumentation/js/getting-started/browser/)

---

**Status:** ✅ Ready to use once environment variables are configured in Netlify
