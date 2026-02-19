# Credit-Based Ebook Generation Flow

## Overview

This document describes the credit-based ebook generation flow that monetizes the ebook generation feature. The flow ensures users can generate ebooks but must spend credits to unlock the complete content, implementing a freemium model.

## User Experience Flow

### 1. Initial Generation (Free)
- User clicks "Generate Ebook" button
- Story is generated using the existing AI system
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
Location: `src/modules/ebook/components/CreditWallModal.tsx`

**Features:**
- Displays the credit wall interface
- Shows story preview (first 100 words)
- Handles credit validation and purchase flow
- Integrates with StripeCreditPurchaseModal

**Props:**
```typescript
interface CreditWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  currentBalance: number;
  storyTitle: string;
  previewContent: string;
  totalChapters: number;
  totalWords: number;
  onBalanceRefresh?: () => void;
}
```

**Usage Example:**
```tsx
import { CreditWallModal } from '@/modules/ebook/components/CreditWallModal';
import { useState } from 'react';

const YourComponent = () => {
  const [showCreditWall, setShowCreditWall] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);

  const handleGenerationComplete = (generatedChapters: Chapter[]) => {
    setChapters(generatedChapters);
    setShowCreditWall(true); // Show credit wall after generation
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    setShowCreditWall(false);
  };

  const getPreviewContent = () => {
    if (chapters.length === 0) return '';
    const words = chapters[0].content.split(' ');
    return words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');
  };

  const getTotalWords = () => {
    return chapters.reduce((total, chapter) => {
      return total + chapter.content.split(' ').length;
    }, 0);
  };

  return (
    <>
      {/* Your ebook generator component */}
      
      <CreditWallModal
        isOpen={showCreditWall}
        onClose={() => setShowCreditWall(false)}
        onUnlock={handleUnlock}
        currentBalance={creditBalance}
        storyTitle={chapters[0]?.title || 'Your Story'}
        previewContent={getPreviewContent()}
        totalChapters={chapters.length}
        totalWords={getTotalWords()}
        onBalanceRefresh={fetchCreditBalance}
      />
      
      {/* Display full content if unlocked */}
      {isUnlocked && chapters.map(chapter => (
        <div key={chapter.id}>
          <h2>{chapter.title}</h2>
          <p>{chapter.content}</p>
        </div>
      ))}
    </>
  );
};
```

### Integration with Existing EbookGenerator

The existing `EbookGenerator.tsx` already has:
- ✅ Credit system integration
- ✅ Credit validation
- ✅ Credit balance tracking
- ✅ Purchase modal integration

To add credit wall functionality:

1. **Add state for unlock status:**
```typescript
const [isContentUnlocked, setIsContentUnlocked] = useState(false);
const [showCreditWall, setShowCreditWall] = useState(false);
```

2. **Show credit wall after generation:**
```typescript
const handleGenerationComplete = () => {
  // After chapters are generated
  setShowCreditWall(true);
  setIsContentUnlocked(false);
};
```

3. **Conditional content display:**
```typescript
// Show preview or full content based on unlock status
{isContentUnlocked ? (
  <FullChapterView chapters={chapters} />
) : (
  <PreviewView preview={getPreviewContent()} />
)}
```

## Credit System Integration

### Credit Validation
- Uses existing `/api/functions/credits-validate` endpoint (via `supabase.functions.invoke`)
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
GET {SUPABASE_URL}/functions/v1/credits
Headers: Authorization: Bearer <clerk_token>
```

### Credit Validation
```
POST {SUPABASE_URL}/functions/v1/credits-validate
Headers: 
  Authorization: Bearer <clerk_token>
  Content-Type: application/json
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
- Beautiful card layout with stats

### Unlock Options
- "Unlock with 1 Credit" button (enabled if sufficient credits)
- "Purchase Credits" button (opens Stripe modal)
- Current balance display with visual indicators
- Feature list showing what user gets after unlock

### Full Content Mode
- Complete story display with proper formatting
- Download functionality for text files
- Share functionality (native share API or clipboard fallback)
- Beautiful reading experience

## Error Handling

### Insufficient Credits
- Clear messaging about credit requirements
- Direct link to credit purchase
- Graceful fallback to purchase modal
- Auto-opens purchase modal

### Network Errors
- Toast notifications for API failures
- Retry mechanisms for credit validation
- Fallback to mock data in development
- Graceful degradation

### Authentication Issues
- Redirects to login if not authenticated
- Preserves return path for post-login flow
- Clear messaging about authentication requirements

## Development Notes

### Environment Setup
- Requires Supabase Edge Functions for credit system
- Requires Clerk authentication integration
- Requires Stripe integration for credit purchases

### Development Mode Features
- Mock credit validation if Edge Functions unavailable
- Clear console logging for debugging
- Development-only unlock bypass
- Toast messages indicate dev mode

### Testing
- Test credit validation with insufficient balance
- Test credit purchase flow
- Test story unlock with sufficient credits
- Test download and share functionality
- Test preview display with various content lengths

## Styling & Theming

The `CreditWallModal` uses:
- Theme-aware colors (`text-muted-foreground`, `bg-muted`, etc.)
- Dark mode support
- Responsive grid layout (stacks on mobile, side-by-side on desktop)
- Gradient buttons for primary actions
- Shadcn/ui components for consistency

## Future Enhancements

### Potential Improvements
- [ ] Multiple credit tiers (1, 3, 5 credits for different story lengths)
- [ ] Subscription-based unlimited access
- [ ] Bulk credit purchases with discounts
- [ ] Credit earning through referrals or engagement
- [ ] Partial unlocks (unlock specific chapters)
- [ ] Time-limited free access trials

### Analytics
- Track conversion rates from preview to unlock
- Monitor credit purchase patterns
- Analyze user engagement with unlocked content
- Measure revenue impact of credit system
- A/B test different pricing points

## Migration Notes

### Existing Users
- No impact on existing stories or data
- New flow only applies to new ebook generations
- Existing stories remain accessible without credits

### Backward Compatibility
- All existing components continue to work
- Credit system is additive, not replacing existing features
- Existing EbookGenerator still functions normally
- Optional integration allows gradual rollout

## Business Model

### Monetization Strategy
This implements a **freemium model**:
- ✅ Lower barrier to entry (free preview)
- ✅ Clear value proposition (see before you buy)
- ✅ Flexible pricing (buy credits as needed)
- ✅ Reduced subscription fatigue
- ✅ Higher conversion potential

### Pricing Recommendation
Based on ws branch implementation:
- **Single Credit**: $2.99 (try before commit)
- **3-Credit Bundle**: $7.99 (11% savings)
- **5-Credit Bundle**: $12.99 (13% savings) - Most Popular

### Success Metrics
- **Conversion Rate**: Preview views → Unlocks
- **Revenue Per User**: Average spent per user
- **Engagement**: Time spent with unlocked content
- **Retention**: Users who purchase multiple times

## Support & Resources

- **Stripe Integration**: See `STRIPE_FRONTEND_INTEGRATION.md`
- **Credit System**: Existing implementation in `EbookGenerator.tsx`
- **Auth Context**: `src/modules/auth/contexts/ClerkAuthContext.tsx`
- **Helper Functions**: `src/modules/story/utils/storyPersistence.ts`

## Troubleshooting

### "Failed to validate credits"
- Check Supabase Edge Function is deployed
- Verify Clerk token is valid
- Check CORS headers on Edge Function

### Credit balance not updating
- Ensure `onBalanceRefresh` callback is provided
- Check Supabase connection
- Verify user is authenticated

### Purchase modal not opening
- Check `StripeCreditPurchaseModal` is imported
- Verify Stripe integration is configured
- Check console for errors

### Preview showing wrong content
- Verify chapter structure is correct
- Check word splitting logic
- Ensure content is properly formatted
