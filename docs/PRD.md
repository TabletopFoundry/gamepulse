# PRD: GamePulse — Board Game Content Aggregator & Creator Platform

## Score: 6.8/10 (Worthiness & Feasibility)

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Market Size | ⭐⭐⭐⭐ | Millions of board gamers consume content; creator economy is massive |
| Feasibility | ⭐⭐⭐⭐ | Content aggregation is well-understood tech; video embedding, RSS, APIs |
| Innovation | ⭐⭐⭐ | "Rotten Tomatoes for board games" concept is straightforward; execution is the challenge |
| Competition | ⭐⭐⭐ | BGG has reviews but no aggregation; no dedicated "Rotten Tomatoes" exists |
| Revenue Potential | ⭐⭐⭐ | Affiliate revenue + sponsored content + premium subscriptions; modest per-user value |

---

## 1. Problem Statement

Board game content creation is thriving — Shut Up & Sit Down has 455K YouTube subscribers and 109M views, The Dice Tower has 300K+ subscribers, and dozens of smaller creators produce quality content. But for consumers, the content landscape is fragmented:

- **No aggregated review scores**: If you want to know if a game is good, you must check BGG ratings, watch 3 YouTube reviews, and browse Reddit. No "Rotten Tomatoes" consensus score exists.
- **Reviewer trust is unclear**: A new gamer doesn't know which reviewers match their taste. BGG ratings are a single number with no taste-weighting.
- **Content is scattered**: Reviews, how-to-play videos, strategy guides, news, and deals live on 20+ different platforms
- **Short-form content is underdeveloped**: The hobby's content is almost entirely long-form (30+ min videos). Gen Z discovers via TikTok/Reels but there's little board game short-form content
- **Creator monetization is poor**: Most board game creators rely on YouTube AdSense ($2-5 CPM) and Patreon; no platform helps them monetize their niche expertise effectively

---

## 2. Product Vision

**GamePulse** is a board game content hub that aggregates reviews from all major sources into a consensus score, helps gamers find reviewers who match their taste, and provides creators with tools to monetize their expertise through the platform.

### Vision Statement
> "The pulse of the board game world, in one place."

---

## 3. Target Users

### Primary: Board Game Enthusiasts (Content Consumers)
- Play regularly; actively research before buying
- Watch reviews, read BGG, browse Reddit
- Pain: Too many sources; don't know which reviewer to trust for their taste
- Willingness to pay: $3-5/month for premium features; primarily ad/affiliate-supported

### Secondary: Board Game Content Creators
- YouTube reviewers, podcasters, bloggers, TikTokers
- Pain: Low monetization; discoverability is YouTube-algorithm-dependent
- Willingness to pay: Revenue share model (not pay to participate)

### Tertiary: Game Publishers
- Need to track critical reception of their titles
- Want targeted promotion to relevant audiences
- Willingness to pay: $200-2,000/month for publisher dashboard + promoted content

---

## 4. Key Features

### 4.1 Aggregated Review Scores ("GamePulse Score")
- **Multi-Source Aggregation**: Combine scores/sentiment from:
  - BGG average rating + weight
  - YouTube reviews (SUSD, Dice Tower, No Pun Included, Rahdo, etc.)
  - Podcast reviews (BGDL, So Very Wrong About Games, etc.)
  - Written reviews (BoardGameQuest, Ars Technica, Dicebreaker, etc.)
  - Reddit sentiment analysis (r/boardgames)
- **Dual Score System**:
  - **Critics Score**: Weighted average from recognized reviewers (like Rotten Tomatoes critics score)
  - **Community Score**: Average from all user ratings (like audience score)
- **Reviewer Credibility Weighting**: Reviewers weighted by track record, consistency, and community trust
- **Consensus Badge**: "Critically Acclaimed" / "Community Favorite" / "Hidden Gem" / "Divisive"

### 4.2 Taste-Matched Reviews
- **"Your Critics"**: After rating 10+ games, GamePulse identifies which reviewers most closely match your taste
- **Personalized Score**: "Based on reviewers who match your taste, this game scores 8.7/10 for you"
- **Taste Profile**: Visual breakdown of your preferences (theme, weight, mechanics)
- **"You'll Disagree With"**: Flag reviews from critics whose taste diverges from yours

### 4.3 Content Hub
- **Game Pages**: Single page per game with all content aggregated:
  - Reviews (video, audio, written) — embedded/linked
  - How-to-play tutorials
  - Strategy guides
  - News & announcements
  - Deals & prices
  - Crowdfunding status
- **Content Feed**: Personalized feed of new content based on your collection and interests
- **Newsletter**: Weekly digest of top content matching your preferences
- **Short-Form Section**: TikTok/Reels-style vertical video feed for quick game previews

### 4.4 Creator Tools
- **Creator Profile**: Portfolio page with all reviews, analytics, audience demographics
- **Affiliate Link Management**: Centralized affiliate links (Amazon, Miniature Market, etc.) with click tracking
- **Sponsored Content Marketplace**: Publishers post campaigns → matched creators apply → managed through platform
- **Cross-Promotion**: "Viewers of SUSD also watch these creators" discovery engine
- **Analytics Dashboard**: Which reviews drive the most engagement, clicks, conversions

### 4.5 Publisher Dashboard
- **Reception Tracker**: Real-time aggregation of all reviews and sentiment for their titles
- **Competitive Intelligence**: How their games compare to competitors in the same category
- **Review Copy Management**: Track which creators have review copies; manage outreach
- **Promoted Content**: Pay to feature their games in relevant content feeds

### 4.6 Trending & Discovery
- **Trending Games**: Real-time "buzz" based on content volume, sentiment velocity, social mentions
- **"Rising" Games**: Games gaining positive attention before they hit mainstream
- **Awards Tracker**: All major awards (BGG Golden Geek, Spiel des Jahres, BGQ Awards, etc.) in one view
- **Release Calendar**: Upcoming releases with aggregated anticipation metrics

---

## 5. Technical Architecture

### Data Pipeline
- **YouTube API**: Pull reviews from tracked creator channels (metadata, transcripts)
- **Podcast RSS**: Aggregate podcast episodes with game mentions (NLP for game identification)
- **Web Scraping**: Review sites (BGQ, Dicebreaker, Ars Technica) with structured data extraction
- **BGG API**: Ratings, rankings, metadata
- **Reddit API**: r/boardgames post sentiment analysis
- **NLP Pipeline**: Sentiment analysis, game mention detection, score extraction from unstructured reviews

### Scoring Engine
- **Score Normalization**: Different reviewers use different scales; normalize to 0-100
- **Credibility Weighting**: Based on review count, consistency, community validation
- **Taste Matching**: Collaborative filtering on user-reviewer rating correlation
- **Freshness Decay**: Recent reviews weighted more heavily

### Platform
- **Web**: Next.js with SSR (SEO critical for game pages)
- **Mobile**: React Native (content consumption optimized)
- **Backend**: Python (NLP pipeline) + Node.js (API), PostgreSQL, Elasticsearch, Redis
- **ML**: Sentiment analysis models, taste-matching collaborative filtering

---

## 6. Business Model

### Revenue Streams

#### 1. Affiliate Revenue (Primary)
- Commission on game purchases through aggregated deal links (3-8% per sale)
- Revenue shared with creators whose reviews drove the purchase (50/50 split)
- Estimated: $3-8 per conversion

#### 2. Publisher Advertising (Primary)
- Promoted game pages, sponsored content placements, featured in recommendation feeds
- CPM: $15-30 (high-intent niche audience)
- Publisher dashboard subscription: $199-999/month

#### 3. Premium Subscription
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | GamePulse scores, basic reviews, deal alerts |
| Pulse+ | $3.99/mo | Taste-matched reviews, personalized feed, ad-free, newsletter |

#### 4. Creator Revenue Share
- Platform takes 20% of sponsored content deals facilitated through GamePulse
- Affiliate revenue split: 50% creator / 50% platform

### Revenue Projections
- Year 1: $120K (affiliate + early publisher partnerships)
- Year 2: $500K (affiliate + publisher dashboards + premium subscriptions)
- Year 3: $1.5M (scaled affiliate + advertising + 15K premium subscribers + creator marketplace)

---

## 7. Go-to-Market Strategy

### Phase 1: Aggregation MVP (Months 1-4)
- Launch with game pages aggregating BGG + 10 major YouTube creators + 5 written review sites
- GamePulse Score (critics + community)
- Basic deal tracking
- SEO-optimized game pages (rank for "[game name] review")

### Phase 2: Taste Matching & Creator Onboarding (Months 5-8)
- User accounts with ratings and taste profiles
- Taste-matched reviewer recommendations
- Creator profiles and analytics
- Affiliate link management for creators
- Target: 50 creators onboarded, 50K monthly visitors

### Phase 3: Publisher Tools & Monetization (Months 9-14)
- Publisher dashboard launch
- Sponsored content marketplace
- Premium subscription tier
- Short-form content feed
- Newsletter with 25K+ subscribers

### Marketing Channels
- **SEO**: Game page rankings ("Wingspan review", "best board games 2026")
- **Creator partnerships**: Creators promote their GamePulse profile for analytics/affiliate benefits
- **Reddit**: Organic engagement; "here's the aggregated review score for [new game]"
- **Newsletter**: Weekly board game content digest (high-value for growth)
- **Social**: TikTok/Instagram short-form content reposts with attribution

---

## 8. Competitive Moat

1. **Aggregation data**: Multi-source sentiment analysis pipeline is complex to build and maintain
2. **Taste matching**: Personalized reviewer recommendations improve with user data; cold start advantage
3. **Creator network**: Creators who get analytics and affiliate tools are incentivized to stay
4. **SEO authority**: Game pages that aggregate all content rank highly; organic traffic compounds
5. **Publisher relationships**: Dashboard utility creates recurring B2B revenue and data moat

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Creators don't want aggregation (want traffic on their own channels) | Medium | High | Revenue share on affiliate links; analytics tools add value; traffic is additive not competitive |
| BGG has all the review data | Medium | Medium | BGG doesn't aggregate external reviews or provide taste matching; complementary not competitive |
| NLP accuracy for sentiment extraction | Medium | Medium | Start with structured reviews (scored); expand to unstructured with validation |
| Low premium conversion | High | Medium | Affiliate and publisher revenue don't require premium; premium is gravy |
| Publisher resistance to transparency | Medium | Medium | Aggregated scores benefit good games; publisher dashboard provides private insights |

---

## 10. Success Metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Monthly Unique Visitors | 100,000 |
| Registered Users | 25,000 |
| Games with GamePulse Scores | 2,000 |
| Creators Onboarded | 50 |
| Premium Subscribers | 1,000 |
| Affiliate Revenue | $80K |
| Newsletter Subscribers | 25,000 |
| Average Time on Site | 5 minutes |

---

## 11. Innovation Factor

**What's truly new here:**
- **Aggregated multi-source review score** for board games doesn't exist. Rotten Tomatoes, Metacritic, and OpenCritic all serve film/games but nothing serves board games.
- **Taste-matched reviewer discovery** ("these are the critics who share your taste") is novel. Currently gamers randomly find reviewers through YouTube's algorithm.
- **Creator-platform revenue sharing on affiliate links** creates aligned incentives between creators and the platform — no board game platform does this.
- **Sentiment extraction from video/audio reviews** using NLP to generate structured scores from unstructured content is technically innovative.

**Inspiration drawn from:**
- Rotten Tomatoes (aggregated critic + audience scores) — applied to board games
- Metacritic (weighted critic scores) — applied to board game reviews
- RateYourMusic/Album of the Year (music aggregation) — applied to board games
- Substack (creator monetization through platform) — applied to board game content
