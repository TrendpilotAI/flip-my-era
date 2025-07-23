# Credit-Based Ebook Generation Flow

## Overview

This document describes the new credit-based ebook generation flow that was implemented to monetize the ebook generation feature. The flow ensures users can generate ebooks for free but must spend credits to view the complete content.

## User Experience Flow

### 1. Initial Generation (Free)
- User clicks "Generate Ebook" button
- Story is generated using the existing memory-enhanced AI system
- **No credits are charged** for the initial generation
- User sees a preview with only the first 100 words visible

### 2. Credit Wall (Paid)
- After generation completes, a credit wall modal appears
- Modal shows:
  - Preview of the first 100 words
  - Total word count and chapter count
  - Current credit balance
  - Options to unlock with credits or purchase more credits

### 3. Unlocking Content (1 Credit)
- User can unlock the full story for 1 credit
- If user has insufficient credits, they're prompted to purchase
- Credit validation happens through the existing Supabase Edge Function
- Once unlocked, user can read, download, and share the complete story

## Technical Implementation

### New Components

#### 1. `CreditWallModal.tsx`
- Displays the credit wall interface
- Shows story preview (first 100 words)
- Handles credit validation and purchase flow
- Integrates with existing Stripe credit purchase modal

#### 2. `CreditBasedEbookGenerator.tsx`
- Wraps the existing `MemoryEnhancedEbookGenerator`
- Manages the credit-based flow state
- Handles preview vs. full content display
- Integrates credit balance fetching and validation

### Modified Components

#### 1. `MemoryEnhancedEbookGenerator.tsx`
- Added optional props for external state management
- Added progress callback support
- Maintains backward compatibility

### Updated Usage

All existing usage of `MemoryEnhancedEbookGenerator` has been updated to use `CreditBasedEbookGenerator`:

- `StoryResult.tsx` - Story result page
- `IllustratedStorySection.tsx` - Story sections
- `UserDashboard.tsx` - User dashboard
- `MemorySystemDemo.tsx` - Demo page

## Credit System Integration

### Credit Validation
- Uses existing `/api/functions/credits-validate` endpoint
- Validates user has sufficient credits (1 credit required)
- Creates transaction record when credits are spent
- Updates user's credit balance

### Credit Balance
- Fetches current balance from `/api/functions/credits` endpoint
- Displays balance in credit wall modal
- Updates after successful credit spending

## API Endpoints Used

### Credit Balance
```
GET /api/functions/credits
Headers: Authorization: Bearer <clerk_token>
```

### Credit Validation
```
POST /api/functions/credits-validate
Headers: Content-Type: application/json
Body: {
  "credits_required": 1,
  "story_type": "ebook_generation"
}
```

## Database Integration

### Ebook Generations Table
- Records are created with `story_type: 'credit-based'`
- Tracks credits used and payment method
- Maintains full story content for unlocked users

### Credit Transactions Table
- Records credit spending for ebook unlocks
- Links to specific ebook generation records
- Maintains audit trail for financial transactions

## User Interface Features

### Preview Mode
- Shows first 100 words with fade-out effect
- Displays total word count and chapter count
- Clear indication that content continues

### Unlock Options
- "Unlock with 1 Credit" button (enabled if sufficient credits)
- "Purchase Credits" button (opens Stripe modal)
- Current balance display with visual indicators

### Full Content Mode
- Complete story display with proper formatting
- Download functionality for text files
- Share functionality (native share API or clipboard fallback)

## Error Handling

### Insufficient Credits
- Clear messaging about credit requirements
- Direct link to credit purchase
- Graceful fallback to purchase modal

### Network Errors
- Toast notifications for API failures
- Retry mechanisms for credit validation
- Fallback to mock data in development

### Authentication Issues
- Redirects to login if not authenticated
- Preserves return path for post-login flow
- Clear messaging about authentication requirements

## Development Notes

### Environment Setup
- Requires Supabase Edge Functions for credit system
- Requires Clerk authentication integration
- Requires Stripe integration for credit purchases

### Testing
- Test credit validation with insufficient balance
- Test credit purchase flow
- Test story unlock with sufficient credits
- Test download and share functionality

### Deployment
- Ensure all Edge Functions are deployed
- Verify credit system database tables exist
- Test credit purchase flow in production
- Monitor credit transaction logs

## Future Enhancements

### Potential Improvements
- Multiple credit tiers (1, 3, 5 credits for different story lengths)
- Subscription-based unlimited access
- Bulk credit purchases with discounts
- Credit earning through referrals or engagement

### Analytics
- Track conversion rates from preview to unlock
- Monitor credit purchase patterns
- Analyze user engagement with unlocked content
- Measure revenue impact of credit system

## Migration Notes

### Existing Users
- No impact on existing stories or data
- New flow only applies to new ebook generations
- Existing stories remain accessible without credits

### Backward Compatibility
- All existing components continue to work
- Memory-enhanced generation still available
- Credit system is additive, not replacing existing features 