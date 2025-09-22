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

## Credit Pricing System

### AI Usage Cost Structure

Credits are consumed based on the type, complexity, and speed of AI operations performed.

#### **Story Generation (LLM Models)**
| Operation | Basic Model | Advanced Model | Priority Speed |
|-----------|-------------|----------------|----------------|
| **Short Story** (500-1,500 words) | 1 credit | 2 credits | +0.5 credits |
| **Chapter Generation** | 1.5 credits | 3 credits | +0.5 credits |
| **Novel Outline** | 2 credits | 4 credits | +0.5 credits |
| **Character Development** | 1 credit | 2 credits | +0.5 credits |
| **Plot Enhancement** | 1.5 credits | 3 credits | +0.5 credits |

#### **Image Generation (Visual Models)**
| Operation | Basic Quality | High Quality | Ultra Quality | Priority Speed |
|-----------|----------------|--------------|----------------|----------------|
| **Story Illustration** | 0.5 credits | 1 credit | 2 credits | +0.5 credits |
| **Character Portrait** | 1 credit | 2 credits | 4 credits | +0.5 credits |
| **Scene Background** | 0.8 credits | 1.5 credits | 3 credits | +0.5 credits |
| **Cover Art** | 1.5 credits | 3 credits | 6 credits | +0.5 credits |
| **Multi-Panel Spread** | 2 credits | 4 credits | 8 credits | +0.5 credits |

#### **Video Generation (A/V Models)**
| Operation | Basic Quality | High Quality | Ultra Quality | Priority Speed |
|-----------|----------------|--------------|----------------|----------------|
| **Story Recap Video** (15s) | 5 credits | 10 credits | 20 credits | +2 credits |
| **Character Introduction** (30s) | 8 credits | 15 credits | 30 credits | +3 credits |
| **Scene Animation** (60s) | 12 credits | 25 credits | 50 credits | +5 credits |
| **Full Story Adaptation** | 25 credits | 50 credits | 100 credits | +10 credits |

#### **Audio Generation (Text-to-Speech)**
| Operation | Basic Voice | Premium Voice | Celebrity Voice | Priority Speed |
|-----------|-------------|----------------|-----------------|----------------|
| **Narration** (per minute) | 0.5 credits | 1 credit | 3 credits | +0.2 credits |
| **Sound Effects** | 0.3 credits | 0.6 credits | 1.2 credits | +0.1 credits |
| **Background Music** | 0.8 credits | 1.5 credits | 3 credits | +0.3 credits |

#### **Advanced Features**
| Feature | Credit Cost | Description |
|---------|-------------|-------------|
| **Commercial License** | +50% of base cost | Allows commercial use/sale of generated content |
| **Bulk Generation** | -10% per item (5+ items) | Volume discount for batch processing |
| **Custom Model Training** | 100 credits | Train custom AI model on user data |
| **API Access** | 10 credits/month | Direct API access for integrations |

### Credit Cost Examples

#### **Complete Story Package Examples:**

**Basic Story Package** (Free/Swiftie Starter):
- Story generation: 1 credit (basic)
- 3 illustrations: 3 × 0.5 = 1.5 credits
- PDF export: 0 credits (included)
- **Total: 2.5 credits**

**Premium Story Package** (Swiftie Deluxe/Opus VIP):
- Story generation: 2 credits (advanced model)
- 5 high-quality illustrations: 5 × 1 = 5 credits
- Priority speed: +1 credit
- Audio narration (10 min): 10 × 1 = 10 credits
- Commercial license: +50% of total
- **Total: 22 credits** (18 + 50% commercial)

**Ultimate Creator Package** (Opus VIP):
- Novel outline: 4 credits (advanced)
- 20 chapters: 20 × 3 = 60 credits
- 50 illustrations: 50 × 1.5 = 75 credits
- Full story video: 50 credits
- Audio narration: 120 minutes × 1 = 120 credits
- Commercial license: +50% of total
- **Total: 512 credits** (341 + 50% commercial)

### Subscription Credit Allocations

Based on the new pricing system:

| Plan | Monthly Credits | Effective Value | Best For |
|------|----------------|-----------------|----------|
| **Free** | 3 credits | ~$1.00 value | Basic story creation |
| **Swiftie Starter** ($12.99) | 12 credits | ~$4.33 value | Casual creators |
| **Swiftie Deluxe** ($25) | 25 credits | ~$8.33 value | Content creators |
| **Opus VIP** ($49.99) | 60 credits | ~$20.00 value | Professional creators |

### Credit Purchasing Options

| Credit Package | Cost | Credits | Cost per Credit | Bonus Credits |
|----------------|------|---------|-----------------|---------------|
| Starter Pack | $4.99 | 5 credits | $1.00 | - |
| Creator Pack | $9.99 | 12 credits | $0.83 | +1 bonus |
| Pro Pack | $19.99 | 30 credits | $0.67 | +5 bonus |
| Studio Pack | $39.99 | 75 credits | $0.53 | +15 bonus |
| Enterprise | $99.99 | 200 credits | $0.50 | +50 bonus |

## Implementation Notes

### Technical Requirements
- **Credit Cost Calculation Engine**: Create `calculateCreditCost()` function that considers:
  - AI operation type (story/image/video/audio)
  - Model quality level (basic/advanced/ultra)
  - Speed priority (normal/priority)
  - Commercial licensing (+50% cost)
  - Bulk discounts (-10% for 5+ items)
- **Dynamic Pricing API**: Update `credits-validate` function to accept detailed operation parameters
- **UI Cost Display**: Show estimated credit costs before generation in all creation flows
- **Credit Cost Transparency**: Display breakdown of costs in user interfaces
- **Subscription Credit Allocation**: Update monthly credit refresh logic for new allocations
- **Stripe Product Updates**: Create new product/price IDs for updated subscription tiers
- **Database Schema**: Add fields for operation tracking and cost calculation
- **Admin Dashboard**: Analytics for credit usage by operation type and user tier

### Implementation Phases

#### Phase 1: Core Credit System
1. Create credit cost calculation engine
2. Update credits-validate function with detailed pricing
3. Modify UI to show cost breakdowns
4. Update subscription credit allocations

#### Phase 2: Advanced Features
1. Implement commercial licensing costs
2. Add bulk discount logic
3. Create priority speed queues
4. Add API access tier

#### Phase 3: Analytics & Optimization
1. Track usage patterns by operation type
2. Optimize pricing based on actual costs
3. Implement dynamic pricing for peak times
4. Add credit usage predictions

### Database Schema Updates

```sql
-- Add operation tracking to credit_transactions
ALTER TABLE credit_transactions ADD COLUMN operation_type TEXT;
ALTER TABLE credit_transactions ADD COLUMN model_quality TEXT;
ALTER TABLE credit_transactions ADD COLUMN speed_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE credit_transactions ADD COLUMN commercial_license BOOLEAN DEFAULT FALSE;
ALTER TABLE credit_transactions ADD COLUMN bulk_discount_applied DECIMAL(3,2) DEFAULT 0;

-- Add cost calculation metadata
ALTER TABLE credit_transactions ADD COLUMN cost_breakdown JSONB;
```

### API Updates

**New Credit Cost Endpoint:**
```typescript
POST /api/credit-cost
{
  "operation_type": "story_generation",
  "model_quality": "advanced",
  "speed_priority": true,
  "commercial_license": false,
  "quantity": 1
}
// Returns: { cost: 2.5, breakdown: {...} }
```

**Updated Validation Endpoint:**
```typescript
POST /api/credits-validate
{
  "operations": [
    {
      "type": "story_generation",
      "quality": "advanced",
      "priority": true,
      "commercial": false
    },
    {
      "type": "image_generation",
      "quality": "high",
      "subject": "character_portrait",
      "priority": false
    }
  ]
}
// Returns: { total_cost: 4.5, can_afford: true, breakdown: [...] }
```

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
