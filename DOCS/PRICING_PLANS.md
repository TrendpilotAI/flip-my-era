# FlipMyEra Pricing Plans & Strategy

## Overview

This document outlines the current and proposed pricing structures for FlipMyEra, a Taylor Swift-themed story generation platform.

### Proposed Pricing Ladder
```
Free ($0) → Swiftie Starter ($12.99) → Swiftie Deluxe ($25) → Opus VIP ($49.99)
```

## Current Pricing Structure

### Subscription Plans
- **Free Plan**: $0/month - 3 credits/month (refreshed monthly), basic story generation
- **Basic Plan**: $9.99/month - 10 stories/month, basic illustrations, PDF downloads
- **Premium Plan**: $19.99/month - Unlimited stories, high-quality illustrations, PDF/ePub downloads, video generation
- **Family Plan**: $29.99/month - Everything in Premium + up to 5 family members, shared library

### Payment Processing
- **Provider**: Stripe via SamCart integration
- **Billing**: Monthly recurring subscriptions
- **Trial**: No trial period currently

## Proposed Pricing Structures

### Plan 1: Swiftie Deluxe – "Era-Explorer Pass"

**Tagline:** "Flip every feeling into a visual album."

**Price:** $25/month

**Key Features:**
- **25 Credits/month** - Enough juice to turn all your moods into multi-era masterpieces
- **Taylor-coded prompts** - One-tap templates for heartbreak ballads, cottage-core love stories, and stadium-sized epics
- **Cinematic spreads** - Double-page artwork and animated page turns perfect for TikTok reveals
- **Priority GPU Boost** - Stories hit the presses up to 3× faster during peak hours
- **30% off extra Credits** - Marathon session? Stock up without paying retail

**Marketing Copy:**
*"Era-Explorer Pass" is your front-row ticket to rewrite every chapter of your life in any era you imagine—again and again.*

**Target Audience:**
- Dedicated Taylor Swift fans
- Content creators who want premium visual storytelling
- Users who need frequent access to advanced features
- Social media influencers creating TikTok content

**Business Rationale:**
- Positions as premium Taylor Swift-themed offering
- Emphasizes visual and social media aspects
- Credit-based system allows flexibility
- GPU boost addresses performance concerns
- Discount on extra credits encourages upselling

**Technical Implementation:**
- Credit allocation: 25 credits per month
- Template system for Taylor-themed prompts
- Enhanced illustration generation with cinematic features
- Queue prioritization for GPU processing
- Discount logic for additional credit purchases

### Plan 2: Opus - Creator Studio VIP

**Tagline:** "Power-write novels, serialize on socials, and still have Credits to spare."

**Price:** $49.99/month

**Key Features:**
- **60 Credits every month** - Churn out daily chapters, anthology series, or a full graphic novel
- **AI audio narration** - Auto-generate podcast-quality readings for each book—no mic, no studio
- **Insight dashboard** - Track word count, art style popularity, and reader engagement metrics
- **Commercial license** - Sell your e-books royalty-free on Kindle, Gumroad, or your own store

**Marketing Copy:**
*"Creator Studio VIP" turns FlipMyEra into your personal publishing house—just add imagination.*

**Target Audience:**
- Professional writers and authors
- Content creators building serialized stories
- Podcasters and audiobook creators
- Entrepreneurs wanting to monetize their writing
- Users creating commercial content

**Business Rationale:**
- Targets professional creators willing to pay premium for commercial use
- High credit allocation supports heavy usage patterns
- Audio narration differentiates from competitors
- Commercial licensing enables monetization
- Analytics dashboard supports creator growth
- Positions as professional publishing solution

**Technical Implementation:**
- Credit allocation: 60 credits per month
- AI audio generation integration (text-to-speech)
- Analytics dashboard with engagement metrics
- Commercial licensing framework and watermark removal
- Enhanced export options for multiple platforms
- Creator monetization tracking

### Plan 3: Swiftie Starter – "Fan Fiction Fundamentals"

**Tagline:** "Your first chapter in the Taylor Swift multiverse."

**Price:** $12.99/month

**Key Features:**
- **12 Credits/month** - Perfect for exploring your favorite Taylor eras
- **Taylor Swift theme library** - Access to Fearless, 1989, Folklore, and Midnights templates
- **Basic illustrations** - Simple artwork for your stories
- **PDF exports** - Share your creations with friends
- **Community features** - Connect with other Swifties in the fan community

**Marketing Copy:**
*Start your Taylor Swift storytelling journey. When you're ready to go deeper, upgrade to Era-Explorer Pass for cinematic visuals and unlimited creativity.*

**Target Audience:**
- New Taylor Swift fans discovering the platform
- Casual storytellers who love Taylor's music
- Users testing the waters before committing to premium features
- Swifties wanting to dip their toes into fan fiction

**Business Rationale:**
- Lower price point than current Basic plan to attract Swiftie audience
- Taylor-themed features create emotional connection immediately
- Credit limit encourages upgrading to Swiftie Deluxe (25 credits) or Opus VIP (60 credits)
- Community features build user engagement and retention
- Positions as natural entry point for Taylor Swift ecosystem

**Technical Implementation:**
- Credit allocation: 12 credits per month (higher than current Basic but lower than Deluxe)
- Taylor Swift theme library with era-specific templates
- Basic illustration generation (no cinematic features)
- Community forum integration
- Clear upgrade prompts and feature teasers for higher plans

## Implementation Notes

### Technical Requirements
- Update Stripe product/price IDs for new plans
- Modify checkout flow to accommodate new pricing structure
- Update user interface components (UpgradePlan.tsx, Checkout.tsx)
- Database schema changes if needed for new plan types

### Business Considerations
- Revenue optimization
- User acquisition vs retention balance
- Competitive positioning
- Market research validation

## Migration Strategy

### Current Users
- Grandfather existing users at current rates
- Clear communication about changes
- Upgrade incentives

### New Users
- Seamless onboarding with new pricing
- A/B testing of different price points
- Feature gating based on plan tiers

## Success Metrics

### Key KPIs to Track
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Churn Rate by plan tier
- Conversion rates between plans
- Average Revenue Per User (ARPU)

### Analytics Implementation
- Stripe webhook tracking
- User behavior analytics
- Revenue attribution
- Plan upgrade/downgrade tracking
