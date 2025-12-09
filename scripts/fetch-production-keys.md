# Fetching Production Keys

## Stripe Live API Keys

Stripe doesn't allow programmatic retrieval of API keys for security reasons. You need to retrieve them manually:

### Method 1: Stripe Dashboard (Recommended)

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com/login
2. **Switch to Live Mode**: Toggle "Test mode" off in the top right
3. **Navigate to API Keys**:
   - Click **Developers** in the sidebar
   - Click **API keys**
4. **Copy Keys**:
   - **Publishable key**: Starts with `pk_live_...` (visible by default)
   - **Secret key**: Click "Reveal live key" and copy (starts with `sk_live_...`)

### Method 2: Stripe CLI (After Authentication)

1. **Install Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Authenticate**:
   ```bash
   stripe login
   ```
   This will open a browser for authentication.

3. **List API Keys**:
   ```bash
   stripe api-keys list
   ```
   
   Note: This shows restricted API keys, not your secret keys. You still need the dashboard for secret keys.

## Sentry Production DSN

### Via Sentry Dashboard

1. **Log in to Sentry**: https://sentry.io/auth/login/
2. **Select Your Project**: Choose your production project
3. **Go to Settings**: Click **Settings** → **Projects** → Your Project
4. **Client Keys (DSN)**: 
   - Find the DSN under **Client Keys (DSN)**
   - Copy the full DSN URL (starts with `https://...`)

### Via Sentry CLI

1. **Install Sentry CLI**:
   ```bash
   brew install getsentry/tools/sentry-cli
   ```

2. **Authenticate**:
   ```bash
   sentry-cli login
   ```

3. **List Projects**:
   ```bash
   sentry-cli projects list
   ```

4. **Get DSN**:
   ```bash
   sentry-cli projects info --org YOUR_ORG --project YOUR_PROJECT
   ```

## Using the Update Script

Once you have the keys, update `.env.production`:

### Option 1: Interactive Script
```bash
node scripts/update-production-env.js
```

The script will prompt you for each value.

### Option 2: Environment Variables
```bash
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_... \
STRIPE_LIVE_SECRET_KEY=sk_live_... \
SENTRY_PRODUCTION_DSN=https://... \
node scripts/update-production-env.js
```

### Option 3: Manual Edit
Edit `.env.production` directly and update:
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_SECRET_KEY=sk_live_...`
- `VITE_STRIPE_SECRET_KEY=sk_live_...` (if exists)
- `VITE_SENTRY_DSN=https://...`
- `VITE_SENTRY_ENVIRONMENT=production`






