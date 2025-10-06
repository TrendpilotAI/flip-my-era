# ERA-Based Story Generation Testing Guide

## Quick Start

```bash
# 1. Ensure you're on the feature branch
git checkout feature/era-based-story-generation

# 2. Install dependencies (if needed)
bun install

# 3. Start development server
bun run dev

# 4. Open browser
open http://localhost:8081
```

## Testing Checklist

### ✅ Phase 1: Landing Page & Hero

- [ ] Hero gallery animates in smoothly
- [ ] ERA photos display and animate into position
- [ ] Draggable photos work on desktop
- [ ] "Choose Your Era" button scrolls to wizard
- [ ] Auth CTA displays for non-logged-in users
- [ ] Mobile responsive (photos stack appropriately)

### ✅ Phase 2: ERA Selection

- [ ] All 7 ERA cards display in Bento grid
- [ ] Cards have appropriate sizes (varying spans)
- [ ] Images load (currently placeholders)
- [ ] Hover effects work (border, shadow, sparkles)
- [ ] ERA names and descriptions visible
- [ ] Click transitions to prompt selection
- [ ] Grid is responsive on mobile

### ✅ Phase 3: Story Prompt Selection

- [ ] Smooth transition animation from ERA grid
- [ ] 5 prompts display for selected ERA
- [ ] Images load in 3:4 vertical format
- [ ] Vibe Check and GenZ Hook visible
- [ ] Hover reveals Swiftie Signal
- [ ] "Create Your Own" card displays
- [ ] Back button returns to ERAs
- [ ] Click prompt advances to characters
- [ ] Mobile: cards stack vertically

### ✅ Phase 4: Character Selection

- [ ] Archetypes match selected ERA
- [ ] All archetypes for ERA display
- [ ] Hover effects work
- [ ] Click selects with checkmark
- [ ] Trait badges display
- [ ] Continue button enables after selection
- [ ] Back button returns to prompts
- [ ] Selection persists if user goes back

### ✅ Phase 5: Story Details Form

- [ ] Selected archetype displays in card
- [ ] Character name input works
- [ ] Gender radio buttons work
- [ ] Location input works
- [ ] Custom prompt textarea (if applicable)
- [ ] Validation prevents empty submission
- [ ] "Generate Storyline" button state
- [ ] Loading state during generation

### ✅ Phase 6: Storyline Generation

- [ ] Button shows loading spinner
- [ ] Groq API call succeeds
- [ ] Master System Prompt loads
- [ ] ERA-specific prompt loads
- [ ] Combined prompt sent to Groq
- [ ] Structured JSON response received
- [ ] Error handling for API failures
- [ ] Toast notifications display

### ✅ Phase 7: Storyline Preview

- [ ] Logline displays prominently
- [ ] Three acts color-coded correctly
- [ ] Act 1 (blue), Act 2 (purple), Act 3 (pink)
- [ ] All act elements display
- [ ] Chapter outline cards display
- [ ] Word counts shown
- [ ] Theme badges display
- [ ] Edit button returns to form
- [ ] Regenerate button works
- [ ] Continue advances to formats

### ✅ Phase 8: Format Selection

- [ ] 3 format cards display
- [ ] Icons, names, descriptions correct
- [ ] Stats accurate (chapters, words, time, cost)
- [ ] Features list complete
- [ ] "Recommended" badge on Short Story
- [ ] Hover effects work
- [ ] Selection shows checkmark
- [ ] Back button returns to storyline
- [ ] Selection advances to generation

### ✅ Phase 9: Story Generation (Integration)

- [ ] EbookGenerator receives storyline
- [ ] Format parameter used for chapter count
- [ ] Streaming generation starts
- [ ] Progress indicators update
- [ ] Chapters reference storyline structure
- [ ] Act-appropriate content in chapters
- [ ] Generation completes successfully
- [ ] Existing ebook features work
- [ ] Image generation works
- [ ] Download/share features work

## ERA-Specific Testing

Test each ERA individually to ensure proper theming:

### Showgirl Era Test
- [ ] Orange/mint color scheme applied
- [ ] Prompts: Bathtub Confession, Ophelia Rewrite, False Lashes, Show Must Go On, Orange Dreams
- [ ] Archetypes: Performer, Rescued Heart, Rising Star, Partner, Veteran, Protégé
- [ ] Storyline reflects glamour, duality, performance themes
- [ ] Generated chapters match showgirl aesthetic

### Folklore/Evermore Era Test
- [ ] Earth tones color scheme
- [ ] Prompts: Cardigan, American Dynasty, Invisible String, Manuscript, Herbal Tea
- [ ] Archetypes: Dreamer, Wise Friend, Lost Soul, Creative, Healer
- [ ] Storyline reflects introspection, nature themes
- [ ] Generated chapters match folklore aesthetic

### 1989 Era Test
- [ ] Sky blue/pink color scheme
- [ ] Prompts: NYC, Sustainable Style, Blank Space, Out Woods, Clean
- [ ] Archetypes: Self-Discoverer, Heart Healer, Bridge Builder, Planner, Gentle Rebel
- [ ] Storyline reflects urban, confident themes
- [ ] Generated chapters match 1989 aesthetic

### Red Era Test
- [ ] Deep red/orange color scheme
- [ ] Prompts: Podcast, Trouble, Lucky One, Begin Again, Moment I Knew
- [ ] Archetypes: Deep Feeler, Survivor, Empath, Artist, Wisdom Seeker
- [ ] Storyline reflects intense emotion themes
- [ ] Generated chapters match red aesthetic

### Reputation Era Test
- [ ] Black/gray color scheme
- [ ] Prompts: Revenge Era, Fighting Back, Reclamation, Call It Want, Activism
- [ ] Archetypes: Phoenix, Activist, Protector, Truth-Teller, Transformer
- [ ] Storyline reflects empowerment themes
- [ ] Generated chapters match reputation aesthetic

### Lover Era Test
- [ ] Pink/rainbow color scheme
- [ ] Prompts: Pride, All Forms, The Man, Daylight, Paper Rings
- [ ] Archetypes: (Same as 1989)
- [ ] Storyline reflects celebration, acceptance themes
- [ ] Generated chapters match lover aesthetic

### Midnights Era Test
- [ ] Midnight blue/lavender color scheme
- [ ] Prompts: Anti-Hero, Lavender Haze, Midnight Rain, Question, Mastermind
- [ ] Archetypes: Late Night Thinker, Anti-Hero, Dreamer, Path Diverger, Mastermind
- [ ] Storyline reflects vulnerability, anxiety themes
- [ ] Generated chapters match midnights aesthetic

## State Persistence Testing

1. **Forward Navigation**:
   - [ ] Start wizard
   - [ ] Select ERA, prompt, character, fill form
   - [ ] Refresh page
   - [ ] Verify state restored to last step

2. **Backward Navigation**:
   - [ ] Navigate to storyline preview
   - [ ] Click back multiple times
   - [ ] Verify all selections preserved

3. **Reset**:
   - [ ] Complete wizard
   - [ ] Start new story
   - [ ] Verify state cleared properly

## Error Testing

### Network Errors:
- [ ] Disconnect internet during storyline generation
- [ ] Verify graceful error message
- [ ] Retry works after reconnection

### API Errors:
- [ ] Invalid Groq API key
- [ ] Rate limit exceeded
- [ ] Malformed response
- [ ] Verify user-friendly error messages

### Validation Errors:
- [ ] Try to continue without selection
- [ ] Submit form with empty fields
- [ ] Verify validation messages clear

## Performance Testing

- [ ] Wizard loads quickly (<2s)
- [ ] Animations smooth (60fps)
- [ ] No memory leaks during navigation
- [ ] State updates don't cause flicker
- [ ] Images lazy load properly
- [ ] Large storylines don't slow UI

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG AA
- [ ] Alt text on all images
- [ ] ARIA labels where appropriate

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Known Issues & Limitations

1. **Image Placeholders**: Currently using placehold.co URLs
   - Solution: Run image generation script with Runway API
   
2. **Markdown Import Types**: Vite needs `?raw` suffix
   - Already configured in vite.config.ts
   
3. **sessionStorage Limits**: Max ~5MB
   - Should be sufficient for wizard state
   
4. **Groq Rate Limits**: May hit limits with frequent testing
   - Solution: Add rate limiting or caching

## Rollback Plan

If issues arise:

```bash
# Switch back to main
git checkout main

# Or revert specific commits
git revert <commit-hash>

# Old workflow still works in:
# - UserDashboard
# - Direct use of StoryForm
```

## Sign-Off Checklist

Before merging:
- [ ] All manual tests passed
- [ ] All ERA-specific tests passed
- [ ] State persistence verified
- [ ] Error handling confirmed
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Documentation complete
- [ ] Team review completed

---

**Status**: Implementation complete, ready for testing phase.
