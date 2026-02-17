# Performance Audit — FlipMyEra

> Generated 2026-02-17

## Build Output Summary

Build time: **23.3s** | Total chunks: ~25

### Chunk Sizes (notable)

| Chunk | Size | Gzipped | Status |
|-------|------|---------|--------|
| `index-DwdrgzQ6.js` (main bundle) | **654 KB** | 215 KB | 🔴 Over 500KB limit |
| `html2canvas.esm` | 201 KB | 48 KB | ⚠️ Large, lazy-load candidate |
| `vendor-supabase` | 170 KB | 45 KB | ✅ Chunked |
| `vendor-react` | 150 KB | 49 KB | ✅ Chunked |
| `index.es` (jsPDF) | 151 KB | 52 KB | ⚠️ Should be lazy-loaded |
| `vendor-sentry` | 127 KB | 44 KB | ✅ Chunked |
| `vendor-framer` | 113 KB | 37 KB | ✅ Chunked |
| `vendor-radix` | 111 KB | 36 KB | ✅ Chunked |
| `UserDashboard` | 90 KB | 21 KB | ✅ Lazy-loaded |
| `vendor-clerk` | 82 KB | 23 KB | ✅ Chunked |

## Lazy Loading

✅ **All protected/admin routes are lazy-loaded** with `React.lazy()` and `Suspense`.  
✅ **Custom skeleton fallbacks** for dashboard and checkout routes.  
✅ **Public routes** (Index, Auth, NotFound) are eagerly loaded — correct for landing page performance.

## Recommendations

### 1. Split the 654KB main chunk
The main `index` chunk likely contains: TanStack Query, OpenTelemetry (9 packages!), Groq SDK, DOMPurify, and shared utilities.

**Actions:**
- Add `'@tanstack/react-query': 'vendor-tanstack'` to `manualChunks`
- Add OpenTelemetry packages to a `'vendor-otel'` manual chunk
- Dynamic import `jspdf` and `html2canvas` in `downloadUtils.ts` (only needed on PDF download)

### 2. Lazy-load jsPDF + html2canvas (combined ~350KB)
These are only used in `downloadUtils.ts` for PDF export. Use dynamic `import()`:
```ts
// Instead of: import { jsPDF } from 'jspdf';
const { jsPDF } = await import('jspdf');
```

### 3. Potentially unused dependencies
- **`groq-sdk`** — Used in `EbookGenerator.tsx` via `groq` util, but may be called server-side via Supabase edge function instead. Verify if the client-side SDK is actually needed.
- **`axios`** — Used in 3 files. Could be replaced with native `fetch` to save ~15KB.
- **9 OpenTelemetry packages** — Heavy for a frontend app. Consider if the value justifies the bundle cost, or lazy-load the init.

### 4. Consider removing `@opentelemetry/exporter-otlp-http` (deprecated)
The `^0.26.0` version is very old. You already have `@opentelemetry/exporter-trace-otlp-http`. This may be a duplicate.

## Test Results

- **18 test files passed**, 5 skipped
- **177 tests passed**, 57 skipped
- Duration: 10.8s
- No failures

## Action Items

- [ ] Add `jspdf` and `html2canvas` as dynamic imports in `downloadUtils.ts`
- [ ] Add `@tanstack/react-query` to `manualChunks` in vite config
- [ ] Add OpenTelemetry packages to a vendor chunk
- [ ] Evaluate removing `groq-sdk` from client bundle
- [ ] Remove deprecated `@opentelemetry/exporter-otlp-http` if unused
