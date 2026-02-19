# FlipMyEra — Market Launch Plan

**Date:** 2025-02-17  
**Project:** FlipMyEra — AI-powered Taylor Swift-themed ebook creator  
**Goal:** First paying users within 30 days

---

## 1. Target Audience

### Primary: Swifties (13-25)
- Taylor Swift fans who create fan fiction, mood boards, and aesthetic content
- Active on TikTok, Instagram, and Reddit r/TaylorSwift (2M+ members)
- Already spending money on Swift merch, concert tickets, and fan content
- Value aesthetics, personalization, and shareability

### Secondary: YA Fiction Writers & Ebook Creators
- Teens/young adults writing on Wattpad, AO3, Tumblr
- Want professional-looking output without design skills
- Interest in AI-assisted creative writing

### Tertiary: Gift Buyers
- Parents/friends buying personalized story ebooks as gifts
- Birthday, graduation, holiday market

---

## 2. Competitive Landscape

| Competitor | What They Do | FlipMyEra Advantage |
|------------|-------------|-------------------|
| **ChatGPT/Claude** | Generic AI story writing | Era-themed, illustrated ebook output |
| **Canva** | Design templates | AI-generated content + illustrations, not just layout |
| **Wattpad** | Community writing platform | Professional ebook output, AI assistance |
| **Sudowrite** | AI writing assistant ($19/mo) | Cheaper per-use, Taylor Swift theming, illustrated |
| **Kindle Direct** | Self-publishing | One-click generation vs manual publishing process |
| **AI Dungeon** | Interactive AI fiction | Finished product (ebook) vs endless gameplay |

**Moat:** Taylor Swift era theming + illustrated ebook output + streaming generation UX. No one else combines these three.

---

## 3. Pricing Strategy

### Current Pricing (Credit-Based)
- **$25** → 25 credits (Starter Pack)
- **$50** → 55 credits (10% bonus)
- **$100** → 120 credits (20% bonus)
- **Subscriptions:** $12.99/mo (30 credits), $25/mo (75), $49.99/mo (150)

### Recommended Changes
1. **Add a $4.99 "First Era" pack** (5 credits) — remove friction for first purchase
2. **Add 3 free credits on signup** — let users generate one short preview story
3. **Clarify credit costs:** How many credits = 1 story? 1 illustration? Make this obvious in UI
4. **Consider $2.99 per-story** flat pricing as alternative (simpler to understand)
5. **Gift cards** — "Give your Swiftie friend a custom story" ($9.99, $24.99)

---

## 4. Marketing Channels

### Tier 1: High-Impact, Low-Cost
1. **TikTok** — Record screen captures of story generation streaming in real-time. The "watch AI write your Taylor Swift story" moment is inherently viral. Target #SwiftTok, #BookTok
2. **Reddit r/TaylorSwift** — Share sample stories, get feedback. Be genuine, not spammy. Also r/FanFiction, r/WritingPrompts
3. **Instagram Reels** — Aesthetic ebook pages with era-themed visuals. Carousel posts showing "before prompt → after ebook"

### Tier 2: Community Building
4. **Discord server** — Swiftie writers community. Share stories, vote on eras, suggest prompts
5. **Twitter/X** — Taylor Swift fan accounts, writing community. Quote-tweet with generated stories
6. **Wattpad/AO3 communities** — Cross-post, link to FlipMyEra for illustrated versions

### Tier 3: Paid/Partnership
7. **TikTok ads** — Target #SwiftTok audience, 18-25 demographic
8. **Swiftie influencer partnerships** — Send free credits to fan accounts with 10K+ followers
9. **Taylor Swift fan blogs/newsletters** — Sponsor or guest post
10. **Product Hunt launch** — "AI Ebook Creator for Taylor Swift Fans"

---

## 5. Launch Timeline (30 Days)

### Week 1: Cleanup & Deploy (Days 1-7)
- [ ] **Day 1-2:** Delete stale docs (keep README, AUDIT, this file). Remove duplicate files (`src/App.tsx` vs `src/app/App.tsx`). Remove dead code (SamCart, video generation)
- [ ] **Day 2-3:** Configure Sentry DSN in Netlify. Set all env vars. Deploy to production
- [ ] **Day 3-4:** Run full smoke test on production (auth → era select → generate → download)
- [ ] **Day 4-5:** Add 3 free credits on signup. Add $4.99 starter pack in Stripe
- [ ] **Day 5-6:** Test Stripe checkout end-to-end in test mode, then live mode
- [ ] **Day 6-7:** Set up GitHub Actions CI (lint + test on PR)

### Week 2: Content & Landing (Days 8-14)
- [ ] **Day 8-9:** Create 5 sample stories (one per era) as showcase content
- [ ] **Day 9-10:** Build landing page with: hero video, sample stories, pricing, CTA
- [ ] **Day 10-11:** Record 3 TikTok-style screen recordings of story generation
- [ ] **Day 11-12:** Write Reddit posts for r/TaylorSwift and r/SideProject
- [ ] **Day 12-13:** Set up PostHog analytics (funnels: signup → era select → generate → pay)
- [ ] **Day 13-14:** Create Instagram account, post 5 aesthetic ebook page images

### Week 3: Soft Launch (Days 15-21)
- [ ] **Day 15:** Post on Reddit r/TaylorSwift with sample story + link
- [ ] **Day 16:** Post TikTok video #1
- [ ] **Day 17:** Share on Twitter, tag Swiftie fan accounts
- [ ] **Day 18:** Post on Product Hunt
- [ ] **Day 19-20:** Monitor feedback, fix bugs, respond to comments
- [ ] **Day 21:** Post TikTok video #2, Instagram carousel

### Week 4: Iterate (Days 22-30)
- [ ] Analyze PostHog funnels — where do users drop off?
- [ ] A/B test pricing (free trial vs $4.99 starter)
- [ ] Reach out to 5 Swiftie influencers with free credits
- [ ] Add most-requested feature from user feedback
- [ ] Post TikTok video #3
- [ ] Write blog post: "How I Built an AI Ebook Creator for Swifties"

---

## 6. Specific Tasks to Ship (Prioritized)

### Must-Do (Blocks Launch) 🔴
1. **Clean up duplicate/dead files** — resolve `src/App.tsx` vs `src/app/App.tsx`, remove `ClerkAuthContext.fixed.tsx`
2. **Configure Sentry DSN** in Netlify environment variables
3. **Deploy to production** and run smoke test
4. **Test Stripe checkout** end-to-end with real test cards
5. **Add free credits on signup** (3 credits = 1 short story preview)
6. **Add $4.99 starter credit pack** in Stripe
7. **Verify credit deduction** actually works during story generation

### Should-Do (Launch Quality) 🟡
8. **Set up GitHub Actions** — run tests on PR, block merge on failure
9. **Create 5 sample stories** as social proof / showcase
10. **Build simple landing page** or improve Index.tsx with pricing + samples
11. **Add "How many credits does this cost?"** indicator before generation
12. **Remove debug HTML files** from root (image-manager.html, debug-*.html, test-*.html)
13. **Lazy-load heavy components** (StoryWizard, EbookGenerator) for faster initial load

### Nice-to-Have (Growth) 🔵
14. **Social sharing** — one-click share ebook excerpt to TikTok/Instagram
15. **Referral system** — "Give 3 credits, get 3 credits"
16. **Gift purchase flow** — buy credits for someone else
17. **COPPA compliance review** — if targeting under-13s, need parental consent
18. **SEO** — meta tags, Open Graph images for shared stories

---

## 7. Success Metrics (30 Days Post-Launch)

| Metric | Target |
|--------|--------|
| Signups | 200+ |
| Stories generated | 100+ |
| Paying users | 10+ |
| Revenue | $100+ |
| TikTok views | 10K+ |
| Reddit post engagement | 50+ upvotes |
| Error rate (Sentry) | < 1% |
| Story generation success rate | > 95% |

---

## 8. Risks

| Risk | Mitigation |
|------|-----------|
| Taylor Swift IP concerns | Stories are "inspired by" themes, not using her name/lyrics directly. Review prompts for trademark issues |
| Low conversion (free → paid) | Free trial with clear upgrade path. Show "premium" quality in preview |
| AI-generated content quality | Curate system prompts carefully. Allow regeneration. Show samples |
| Target audience can't pay (teens) | Gift card option. Low entry price ($4.99). Consider Apple Pay/Google Pay |
| Stripe account issues | Ensure TOS compliance. Don't promise Taylor Swift content in Stripe product descriptions |

---

*The core product works. The gap is between "code complete" and "market ready" — that's 70% cleanup/config and 30% marketing. Ship it.* 🚀
