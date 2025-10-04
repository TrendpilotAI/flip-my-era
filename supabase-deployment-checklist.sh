#!/bin/bash

# Supabase Deployment Checklist Script
# This script provides commands to deploy all Supabase configurations

echo "================================================"
echo "    Supabase Deployment Checklist for Flip My Era"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Prerequisites:${NC}"
echo "1. Supabase CLI installed (npm install -g supabase)"
echo "2. Logged in to Supabase CLI (supabase login)"
echo "3. Project linked (supabase link --project-ref YOUR_PROJECT_REF)"
echo ""

echo -e "${GREEN}Step 1: Apply Database Migrations${NC}"
echo "----------------------------------------"
echo "Go to your Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]/sql/new"
echo ""
echo "Then copy and paste the contents of APPLY_MIGRATIONS.sql"
echo ""
read -p "Press enter when migrations are applied..."

echo -e "${GREEN}Step 2: Set Environment Variables${NC}"
echo "----------------------------------------"
echo "Run these commands to set secrets in Supabase:"
echo ""
echo "# Required for AI features:"
echo "supabase secrets set GROQ_API_KEY=your_groq_api_key_here"
echo ""
echo "# Required for authentication:"
echo "supabase secrets set CLERK_JWT_KEY=your_clerk_jwt_signing_key"
echo ""
echo "# Required for email:"
echo "supabase secrets set BREVO_API_KEY=your_brevo_api_key"
echo ""
echo "# Optional but recommended:"
echo "supabase secrets set ELEVEN_LABS_API_KEY=your_elevenlabs_key"
echo "supabase secrets set TIKTOK_CLIENT_KEY=your_tiktok_key"
echo "supabase secrets set TIKTOK_CLIENT_SECRET=your_tiktok_secret"
echo "supabase secrets set STRIPE_SECRET_KEY=your_stripe_key"
echo "supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret"
echo ""
read -p "Press enter when environment variables are set..."

echo -e "${GREEN}Step 3: Deploy Edge Functions${NC}"
echo "----------------------------------------"
echo "Deploying core functions..."
echo ""

# Core functions that should be deployed
FUNCTIONS=(
    "credits"
    "credits-validate"
    "ebook-generation"
    "stream-chapters"
    "brevo-email"
    "check-subscription"
    "admin-credits"
)

for func in "${FUNCTIONS[@]}"
do
    echo "Deploy command for $func:"
    echo "supabase functions deploy $func"
done

echo ""
echo "Optional functions (deploy if needed):"
echo "- generate-video"
echo "- text-to-speech"
echo "- tiktok-auth"
echo "- tiktok-share-analytics"
echo "- stripe-portal"
echo "- customer-portal"
echo "- samcart-webhook"
echo ""
read -p "Press enter when functions are deployed..."

echo -e "${GREEN}Step 4: Verify Deployment${NC}"
echo "----------------------------------------"
echo "Run these SQL queries in Supabase SQL Editor to verify:"
echo ""
echo "-- Check tables exist:"
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
echo ""
echo "-- Check RLS policies:"
echo "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
echo ""
echo "-- Check specific table structure:"
echo "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';"
echo ""

echo -e "${GREEN}Step 5: Test Functions${NC}"
echo "----------------------------------------"
echo "Test the credits function:"
echo "curl -X GET https://[PROJECT_REF].supabase.co/functions/v1/credits \\"
echo "  -H \"Authorization: Bearer [YOUR_CLERK_TOKEN]\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo -e "${GREEN}Step 6: Configure Clerk (if not done)${NC}"
echo "----------------------------------------"
echo "1. Go to Clerk Dashboard: https://dashboard.clerk.com"
echo "2. Create JWT template named 'supabase'"
echo "3. Copy the signing key to Supabase JWT settings"
echo "4. Update Supabase JWT secret with Clerk signing key"
echo ""

echo -e "${YELLOW}Cleanup Tasks:${NC}"
echo "----------------------------------------"
echo "1. Remove duplicate migration files (*2.sql files)"
echo "2. Update credits/index.ts to remove mock user ID"
echo "3. Test full authentication flow"
echo ""

echo -e "${GREEN}✅ Deployment Checklist Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clear browser cache"
echo "2. Test authentication flow"
echo "3. Verify database operations"
echo "4. Check edge function logs in Supabase Dashboard"
echo ""
<<<<<<< HEAD
echo "================================================"
=======
echo "================================================"
>>>>>>> cursor/verify-supabase-deployment-and-integrity-85d4

