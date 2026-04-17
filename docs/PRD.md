# PRD: GamePulse — Board Game Content Aggregator & Creator Platform

## Gap Analysis

| Gap Area | What Was Missing or Weak | Delivery Risk | Enhancement in This PRD |
|---|---|---|---|
| Vague requirements | "Aggregate reviews" and "taste matching" were described at a concept level only | Engineering cannot estimate or sequence work | Converted into explicit v1 functional requirements with IDs, dependencies, and acceptance criteria |
| Missing user stories | Users were named, but not tied to concrete jobs-to-be-done | Features may optimize for the wrong persona | Added persona goals, pain points, tech comfort, and user stories per requirement |
| Undefined scope boundaries | v1 mixed aggregation, creator monetization, publisher tooling, mobile, and short-form video | High risk of overbuilding and slipping launch | Split into v1 / out of scope / v2+ and narrowed v1 to a web MVP [INFERRED] |
| Missing edge cases | No handling for duplicate games, conflicting scores, missing APIs, or low-confidence matches | Poor data quality and brittle launch | Added edge cases for each functional requirement plus operational review flows |
| Missing acceptance criteria | No testable definition of done | Teams cannot verify completion consistently | Added Given/When/Then acceptance criteria for every requirement |
| Implicit assumptions | Assumed legal scraping rights, score comparability, and creator participation | Launch could fail due to legal or partner constraints | Explicitly called out assumptions, proposed defaults, and open questions marked [NEEDS INPUT] |
| Contradictions | Product vision was broad, but GTM phases implied a narrower MVP | Team confusion on what to build first | Reconciled by making aggregation the v1 core and moving taste matching / creator monetization to v2+ [INFERRED] |
| Missing NFRs | No performance, availability, accessibility, browser, security, or retention targets | Non-functional defects could block adoption and SEO | Added implementation-ready NFR targets with p95 goals, SLA, scale, WCAG, i18n, and retention |
| Missing prioritization | All features appeared equally important | Teams cannot make trade-offs under time/resource pressure | Added MoSCoW priority to each requirement and rollout sequencing |
| Missing metrics | Only annual business metrics were listed | Hard to know whether v1 is working operationally | Added launch KPIs, activation metrics, data quality targets, and rollout guardrails |

---

## 1. Overview

### Product Name
GamePulse

### One-Liner
A web platform that aggregates board game reviews, videos, articles, and deals into a single canonical game page with a transparent consensus score.

### Problem
Board game shoppers and hobbyists must currently piece together a buying decision across BoardGameGeek, YouTube, blogs, podcasts, Reddit, and store listings. This creates four core problems:
1. No single consensus score exists for board games across trusted critics.
2. Content discovery is fragmented across many sources and formats.
3. It is hard to tell which content is current, reputable, and relevant.
4. Smaller creators and publishers lack a shared discovery layer that connects their content to high-intent game research.

### Solution
GamePulse will launch as a search-optimized web MVP [INFERRED] that:
- creates one canonical page per game,
- ingests board game metadata and approved third-party content,
- normalizes critic review signals into a GamePulse Critics Score,
- displays BGG community data alongside critic consensus,
- surfaces related content and deal links with clear attribution,
- provides internal admin tooling to keep data quality high.

### v1 KPIs

| KPI | Target | Notes |
|---|---:|---|
| Indexed canonical game pages | 2,000 within 6 months | Preserves original year-1 ambition |
| Approved content sources live | 15 at launch | 10 YouTube + 5 written/RSS sources [INFERRED] |
| Content freshness SLA attainment | 95% of eligible sources refreshed on time | 6h API/RSS, 24h scrape targets |
| Public monthly unique visitors | 25,000 within 6 months; 100,000 by end of year 1 | SEO-led growth |
| Game page click-through to external content | >= 30% of sessions | Measures usefulness of aggregation |
| Pages with publishable critics score | >= 40% of indexed games | Requires minimum review coverage |
| Manual content-match correction rate | <= 10% after 8 weeks | Measures NLP/rules quality |
| Affiliate click-through rate on deal cards | >= 5% | Monetization leading indicator |
| Broken external content/deal links | < 2% weekly | Data quality guardrail |

---

## 2. Users & Personas

| Persona | Goals | Pain Points | Tech Comfort |
|---|---|---|---|
| **Morgan the Research-Heavy Buyer** (primary) | Decide whether a game is worth buying; compare multiple trusted opinions quickly | Has to open 5-10 tabs, scores are inconsistent, spoilers waste time | High; comfortable with BGG, YouTube, Reddit, comparison shopping |
| **Avery the Curious Casual Gamer** (secondary) [INFERRED] | Get a fast recommendation without deep hobby research | Long-form content is overwhelming; doesn't know which creators matter | Medium; uses Google, YouTube, mobile web, not deep into BGG culture |
| **Riley the Board Game Creator** (future-facing secondary) | Get more discoverability and attributable outbound clicks | Discovery depends on opaque platform algorithms; traffic is fragmented | High; comfortable with YouTube Studio, affiliate tools, analytics |
| **Jordan the Publisher Marketer** (future-facing tertiary) | Track title reception and spot influential coverage | Hard to monitor all reviews and compare competitor buzz | Medium-High; comfortable with SaaS dashboards and campaign tools |

**v1 primary user:** Morgan the Research-Heavy Buyer.

**v1 persona implication [INFERRED]:** Product decisions should favor research depth, attribution clarity, and SEO discoverability over social/community features.

---

## 3. Scope

### In Scope for v1
1. Public web experience only (desktop and mobile-responsive web).
2. Canonical game pages populated from BGG metadata.
3. Approved-source ingestion for YouTube and written/RSS review sources.
4. Review signal extraction and score normalization.
5. GamePulse Critics Score with transparent data provenance.
6. Display of BGG rating/community data alongside critic score.
7. Search and browse by game title plus core metadata filters.
8. Deal links with affiliate disclosure and click tracking.
9. Trending/recently updated discovery modules [INFERRED].
10. Internal admin tools for source management, manual content matching, and failed-ingestion review.
11. Product analytics, SEO metadata, sitemap generation, and structured data markup.

### Out of Scope for v1
1. Native mobile apps.
2. Personalized taste matching / "Your Critics".
3. First-party user accounts, collections, or ratings.
4. Creator dashboards, affiliate payout tooling, or sponsored marketplace workflows.
5. Publisher dashboard and competitive intelligence tooling.
6. Podcast transcript ingestion and TikTok/Reels ingestion.
7. Reddit sentiment being included in the published critics score.
8. Full e-commerce checkout; GamePulse only refers users to partner stores.
9. Community comments, forums, or moderation-heavy social features.

### Future Scope (v2+)
1. Taste-matched critic recommendations.
2. First-party user ratings and collections.
3. Creator profiles, analytics, and revenue-share tooling.
4. Publisher dashboards and paid promotion.
5. Short-form vertical content feed.
6. Podcast ingestion and transcript search.
7. Region/currency localization and multilingual UI.

---

## 4. Functional Requirements


### FR-001 — Canonical Game Catalog
- **User story:** As a board game shopper, I want one canonical page per game so I can research it without guessing which title variation is correct.
- **Description:** The system must ingest core game metadata from BGG and create a canonical `Game` record with a stable slug. Fields must include title, alternate titles, BGG ID, year published, player count, play time, complexity/weight, publisher, categories/mechanics if available, and primary image URL.
- **Acceptance criteria:**
  - **Given** a new game exists in the BGG source feed, **when** the scheduled import runs, **then** a canonical game record is created or updated with the mapped metadata fields.
  - **Given** two records share the same BGG ID, **when** the import runs, **then** the system updates the existing record instead of creating a duplicate.
  - **Given** a public game page URL has already been published, **when** title metadata changes, **then** the canonical slug remains stable or a 301 redirect is created.
- **Edge cases:** reprints/editions vs base games; alternate-language titles; missing image; missing or malformed BGG fields.
- **Priority:** Must
- **Dependencies:** BGG integration, slugging rules, admin override tooling.

### FR-002 — Approved Source Registry
- **User story:** As an internal editor, I want to manage which creators and sites are trusted so only approved content appears on public pages.
- **Description:** Admin users must be able to register, enable, disable, and classify sources by type (`youtube`, `rss`, `website`, `affiliate`). Each source must store display name, source URL/channel/feed, default critic weight tier, attribution text, ingestion method, and legal status (`approved`, `pending_review`, `blocked`) [INFERRED].
- **Acceptance criteria:**
  - **Given** an admin creates a source with valid required fields, **when** they save it, **then** the source is stored and eligible for ingestion if status is `approved`.
  - **Given** a source is set to `blocked`, **when** the next ingestion job runs, **then** no new public content from that source is published.
  - **Given** a source changes weight tier, **when** scores are recalculated, **then** future score calculations use the new weight.
- **Edge cases:** duplicate channel/feed URLs; a source changing platform handle; ingestion method unavailable; legal approval unresolved.
- **Priority:** Must
- **Dependencies:** admin authentication/RBAC, ingestion scheduler.

### FR-003 — Content Ingestion & Deduplication
- **User story:** As a shopper, I want all relevant review content for a game to appear in one place without duplicates.
- **Description:** The platform must ingest content from approved sources on a schedule, normalize items into a common `ContentItem` model, and deduplicate using source-native IDs plus canonical URL fallback. Required fields: title, source, published timestamp, content type, external URL, embeddable flag, summary/description, and thumbnail when available.
- **Acceptance criteria:**
  - **Given** an approved YouTube channel or RSS feed has new content, **when** the scheduled job runs, **then** new items are stored within the freshness window.
  - **Given** the same external content is discovered twice, **when** deduplication runs, **then** only one public content item remains active.
  - **Given** ingestion for a source fails, **when** the job completes, **then** the item is not partially published and the failure is visible in admin monitoring.
- **Edge cases:** deleted videos/articles; updated titles after publication; source rate limits; malformed feeds; transient network failures.
- **Priority:** Must
- **Dependencies:** FR-002, background job infrastructure, observability.

### FR-004 — Content-to-Game Matching
- **User story:** As a shopper, I want content attached to the correct game so I do not read unrelated reviews.
- **Description:** The system must match ingested content to one or more canonical games using deterministic rules first (exact title, BGG references, known aliases) and confidence-scored heuristics second [INFERRED]. Items below the publish threshold must enter a manual review queue.
- **Acceptance criteria:**
  - **Given** a content item references exactly one canonical title match, **when** matching runs, **then** the item is automatically linked to that game.
  - **Given** a content item has ambiguous matches or confidence below threshold, **when** matching runs, **then** the item is withheld from public pages and placed in a manual review queue.
  - **Given** an editor manually links or unlinks a content item, **when** they save the decision, **then** the public game page updates on the next publish cycle.
- **Edge cases:** expansions vs base game; series reviews covering multiple games; top-10 list videos; misspellings; localized titles.
- **Priority:** Must
- **Dependencies:** FR-001, FR-003, admin review tooling.

### FR-005 — Review Signal Extraction & Normalization
- **User story:** As a shopper, I want scores on a common scale so I can compare opinions across sources.
- **Description:** For each matched content item, the system must derive a structured review signal. v1 should prioritize explicit scores in metadata/page text; where no explicit score exists, the system may assign a sentiment band (`positive`, `mixed`, `negative`) mapped to a normalized score only if the source is configured to allow inferred sentiment scoring [INFERRED]. All stored signals must include provenance and extraction method.
- **Acceptance criteria:**
  - **Given** a content item contains an explicit 5-star, 10-point, letter-grade, or percentage score, **when** extraction runs, **then** the system stores the normalized score on a 0-100 scale with the original raw value and scale.
  - **Given** a content item has no explicit score and inferred sentiment is disabled for that source, **when** extraction runs, **then** the content item remains visible but contributes no numeric review signal.
  - **Given** extraction confidence is below threshold, **when** the item is processed, **then** the signal is not published until manually reviewed.
- **Edge cases:** joke headlines/sarcasm; multiple scores in one article; previews mistaken for reviews; updated review scores.
- **Priority:** Must
- **Dependencies:** FR-003, FR-004, NLP/rule extraction pipeline.

### FR-006 — GamePulse Critics Score
- **User story:** As a shopper, I want a fast consensus indicator so I can decide whether to investigate a game further.
- **Description:** The system must compute a `GamePulse Critics Score` from normalized review signals on a 0-100 scale. v1 default algorithm [INFERRED]: weighted mean of valid review signals using source weight tiers and freshness decay; minimum publish threshold is 3 review signals from at least 2 unique approved sources. If the threshold is not met, the game page must show `Not enough critic data` instead of a score.
- **Acceptance criteria:**
  - **Given** a game has at least 3 valid review signals from 2 or more approved sources, **when** score calculation runs, **then** the critics score is published with `review_count` and `last_updated_at`.
  - **Given** a game falls below the minimum threshold, **when** score calculation runs, **then** no critics score is displayed publicly.
  - **Given** a source weight or review signal changes, **when** recalculation runs, **then** the public score reflects the latest valid inputs.
- **Edge cases:** one source publishes multiple videos about the same game; all reviews are stale; conflicting highly positive and highly negative signals; source later blocked.
- **Priority:** Must
- **Dependencies:** FR-002, FR-005.

### FR-007 — Public Game Page
- **User story:** As a shopper, I want a complete game page so I can see summary data, critic consensus, community context, and related content in one place.
- **Description:** Each public game page must include game metadata, GamePulse Critics Score (if eligible), BGG community score/rank, attributed content modules, deal cards, last updated timestamp, and SEO/social metadata. Content should be filterable by type (`review`, `how to play`, `strategy`, `news`) where available.
- **Acceptance criteria:**
  - **Given** a published game page exists, **when** a user opens it, **then** they see core metadata, score state, and content modules without requiring login.
  - **Given** a game has no critics score yet, **when** the page loads, **then** the page shows an empty-state explanation and still displays available content/community data.
  - **Given** a content item is attributed to an external source, **when** the user interacts with it, **then** the source name and outbound destination are clearly labeled.
- **Edge cases:** no content yet; no deals; image unavailable; embedded content blocked by provider; mature/off-topic content manually suppressed.
- **Priority:** Must
- **Dependencies:** FR-001, FR-003, FR-006, design system/SSR web app.

### FR-008 — Search & Browse
- **User story:** As a shopper, I want to search for a game or browse relevant filters so I can quickly find a title I am considering.
- **Description:** Users must be able to search by title and browse by publisher, player count, complexity, and release year [INFERRED]. Search results should return canonical games only and show score availability. Autocomplete is recommended for launch but not mandatory if exact search performs adequately [INFERRED].
- **Acceptance criteria:**
  - **Given** a user enters a full or partial game title, **when** search executes, **then** the system returns matching canonical games ordered by relevance.
  - **Given** a user applies browse filters, **when** results load, **then** only games matching those filters are shown.
  - **Given** a game has no critics score, **when** it appears in search results, **then** the result clearly indicates `Score pending` rather than a blank field.
- **Edge cases:** common-word titles; misspellings; identical titles across editions; no matching results.
- **Priority:** Must
- **Dependencies:** FR-001, search index.

### FR-009 — Deal Links & Affiliate Attribution
- **User story:** As a shopper, I want to see current buying options so I can act immediately after researching a game.
- **Description:** Game pages may display partner store deal cards with price, retailer, affiliate disclosure, and outbound click tracking. v1 does not require real-time inventory guarantees; prices may be delayed by the data refresh SLA [INFERRED].
- **Acceptance criteria:**
  - **Given** a game has one or more active partner offers, **when** the user views the page, **then** deal cards show retailer name, latest known price, and affiliate disclosure.
  - **Given** a user clicks a deal card, **when** the redirect occurs, **then** the event is tracked with game ID, retailer, and timestamp.
  - **Given** no active offer exists, **when** the page loads, **then** the deals module is hidden or shows a non-broken empty state.
- **Edge cases:** expired offers; unavailable currency/region; partner API outage; duplicate retailer listings.
- **Priority:** Should
- **Dependencies:** retailer/affiliate integrations, analytics.

### FR-010 — Trending & Recently Updated Discovery
- **User story:** As a shopper, I want to discover games with new critical attention so I can spot what is worth researching now.
- **Description:** The home/discovery experience should include `Trending` and `Recently Updated` modules. v1 trending default [INFERRED]: rank games by weighted count of new valid content items and new review signals in the last 7 days, with decay after 72 hours.
- **Acceptance criteria:**
  - **Given** enough activity data exists, **when** the home page loads, **then** it shows ranked trending and recently updated game modules.
  - **Given** a game receives multiple new valid content items, **when** the trending job runs, **then** its ranking updates within the freshness window.
  - **Given** activity data is insufficient, **when** the home page loads, **then** the modules fall back to recently scored or editor-curated games [INFERRED].
- **Edge cases:** content spikes from one source only; stale games reappearing due to duplicate ingestion; no recent activity across sources.
- **Priority:** Should
- **Dependencies:** FR-003, FR-005, analytics/content activity jobs.

### FR-011 — SEO, Analytics & Monitoring
- **User story:** As the product team, we want search visibility and operational visibility so the site can grow reliably and defects can be fixed quickly.
- **Description:** The platform must generate sitemap files, canonical tags, Open Graph/Twitter metadata, and structured data markup for public pages. It must also capture analytics events (page view, content click, deal click, search, zero-result search) and operational events (ingestion success/failure, manual override actions).
- **Acceptance criteria:**
  - **Given** a public game page is published, **when** search engines crawl it, **then** the page exposes canonical URL metadata and valid structured data markup.
  - **Given** a user performs a tracked action, **when** the event is emitted, **then** it is stored with the required identifiers and timestamp.
  - **Given** an ingestion or scoring job fails, **when** monitoring evaluates the run, **then** the failure is visible in admin/alerts within 15 minutes [INFERRED].
- **Edge cases:** duplicate canonicals; bot traffic polluting analytics; partial outages; sitemap entries for unpublished pages.
- **Priority:** Must
- **Dependencies:** web app, analytics stack, monitoring/alerting.

### FR-012 — Admin Review Queue & Manual Overrides
- **User story:** As an internal editor, I want to resolve ambiguous matches and extraction issues so public data remains trustworthy.
- **Description:** Admin users must have a queue for failed ingestions, low-confidence matches, low-confidence score extractions, and duplicate conflicts. Editors must be able to approve, reject, merge, remap, or suppress content items, with an audit trail.
- **Acceptance criteria:**
  - **Given** a content item fails auto-match or extraction confidence rules, **when** processing completes, **then** the item appears in the review queue with the failure reason.
  - **Given** an editor resolves a queue item, **when** they save the action, **then** the action is logged and reflected in public data on the next publish cycle.
  - **Given** an editor suppresses a content item, **when** a user visits the game page, **then** the suppressed item is not shown publicly.
- **Edge cases:** simultaneous edits by two admins; mistaken suppression; reprocessing after source data changes.
- **Priority:** Must
- **Dependencies:** FR-002 through FR-006, admin auth/RBAC, audit logging.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Public game page SSR response time p95 < 800 ms for cached pages and < 1.5 s for uncached pages [INFERRED]. Largest Contentful Paint p95 < 2.5 s on mobile 4G for public game pages. Search API p95 < 500 ms for title queries returning up to 20 results. Admin queue page p95 < 2 s for 100-item queue view. |
| **Freshness** | API/RSS sources refreshed every <= 6 hours; approved scraped sources every <= 24 hours; score recalculation completed within 30 minutes of successful ingestion batch. |
| **Availability** | Public site monthly uptime SLA: 99.5% [INFERRED]. Admin tools monthly uptime target: 99.0% [INFERRED]. Scheduled maintenance should be announced and kept under 4 hours/month. |
| **Scalability** | v1 must support 100k monthly unique visitors, 500k monthly page views, 10k canonical games, 50k content items, 250 sources, and sustained 50 read RPS without re-architecture [INFERRED]. |
| **Security model** | Public browsing is anonymous. Admin/editor access requires authenticated accounts, RBAC, MFA for admin roles [INFERRED], TLS in transit, encrypted secrets storage, and audit logging for manual overrides. No third-party creator/store credentials stored in plaintext. |
| **Privacy & PII** | v1 PII should be limited to admin account data and optional newsletter/waitlist email capture if enabled [INFERRED]. PII must be encrypted at rest where supported by platform defaults and deleted within 30 days of a verified deletion request. |
| **Accessibility** | Public site and admin tools must meet WCAG 2.1 AA for keyboard navigation, contrast, visible focus, semantic headings, alt text, and screen reader labels. |
| **Internationalization** | v1 UI is English-only [INFERRED], but the system must support UTF-8 titles, alternate-language aliases, and locale-safe formatting for dates/numbers. Strings should be externalized to enable future localization. |
| **Data retention** | Raw ingestion logs retained 30 days; normalized content and score provenance retained 12 months; product analytics event-level data retained 24 months; aggregated reporting may be retained longer. [NEEDS INPUT: confirm legal/compliance policy] |
| **Browser support** | Latest two stable versions of Chrome, Safari, Firefox, and Edge; iOS Safari 16+; Chrome on Android 12+ [INFERRED]. |
| **Reliability/quality** | Published critics scores must be reproducible from stored inputs. Broken outbound links must stay below 2% weekly. Match precision on audited samples should reach >= 90% before public launch [INFERRED]. |
| **Compliance/legal** | Every source must have a recorded legal basis for ingestion (`API terms`, `RSS allowed`, `written approval`, or `blocked`). [NEEDS INPUT: legal review owner and approval workflow] |

---

## 6. User Flows


### Flow 1 — User searches for a game and evaluates it
**Happy path**
1. User lands on the homepage or search bar.
2. User types `Wingspan`.
3. Search returns canonical game results with thumbnail and score state.
4. User opens the game page.
5. User sees critics score, BGG community context, recent reviews, and deal links.
6. User clicks a review or deal card.

**Error/alternate paths**
- If no results match, show `No games found` plus suggested nearby titles.
- If the game has no critics score, show `Not enough critic data yet` and still render available content.
- If an external embed is unavailable, show a non-broken outbound link with source attribution.

### Flow 2 — Scheduled ingestion publishes new content
**Happy path**
1. Scheduler triggers source jobs.
2. Source connector fetches new content.
3. Content is normalized and deduplicated.
4. Matching engine links item to a canonical game.
5. Score extraction/normalization runs.
6. Score recalculation updates affected game pages.
7. Monitoring records a successful run.

**Error/alternate paths**
- If source fetch fails, mark source run failed and do not publish partial data.
- If content match confidence is low, route item to admin review queue.
- If extraction fails, publish the content item without numeric score contribution when safe.

### Flow 3 — Admin resolves ambiguous content match
**Happy path**
1. Editor opens the admin review queue.
2. Editor filters to `Ambiguous match` items.
3. Editor reviews content metadata and candidate games.
4. Editor selects the correct game or suppresses the item.
5. System logs the decision.
6. Next publish cycle updates the public page.

**Error/alternate paths**
- If the editor cannot determine the correct game, item remains in queue with `needs research` note [INFERRED].
- If two editors attempt to modify the same item, system prevents silent overwrites and surfaces a conflict message.

### Flow 4 — User clicks an affiliate deal link
**Happy path**
1. User reads a game page and views retailer offers.
2. User clicks a deal card.
3. System records click event and redirects to partner URL.
4. User completes purchase on the partner site.

**Error/alternate paths**
- If a deal has expired, the card is removed at the next refresh or click redirected to the generic retailer page [INFERRED].
- If partner API is down, the module falls back to last known valid price timestamp or hides the price.

### Flow 5 — Trending module updates from new coverage
**Happy path**
1. Multiple approved sources publish new reviews for a newly released game.
2. Ingestion and scoring complete.
3. Trending job recalculates ranks.
4. Home page highlights the game in `Trending`.
5. Users click through into the game page.

**Error/alternate paths**
- If only one source publishes multiple posts, caps prevent the game from being over-weighted [INFERRED].
- If not enough recent activity exists, the module falls back to editor-curated or recently scored games.

---

## 7. Data Model

### Conceptual Entities

| Entity | Description | Key Relationships | PII? |
|---|---|---|---|
| **Game** | Canonical board game record | 1-to-many with `ContentItem`, 1-to-many with `Deal`, 1-to-1 current `AggregatedScore` | No |
| **GameAlias** | Alternate titles, spellings, localized names | Many-to-1 with `Game` | No |
| **Source** | Approved content/deal origin | 1-to-many with `ContentItem`, 1-to-many with `IngestionRun` | No |
| **ContentItem** | Normalized external video/article/post | Many-to-1 with `Source`; many-to-many with `Game` via match table if multi-game content is allowed [INFERRED] | No |
| **ReviewSignal** | Extracted normalized review score or sentiment | Many-to-1 with `ContentItem`; many-to-1 with `Game` | No |
| **AggregatedScore** | Current and historical GamePulse critics score snapshots | Many-to-1 with `Game` | No |
| **CommunityStat** | Imported BGG rating/rank/community values | 1-to-1 or 1-to-many history with `Game` | No |
| **Deal** | Affiliate/store offer for a game | Many-to-1 with `Game`; many-to-1 with `Source` or retailer integration | No |
| **IngestionRun** | Log of each source sync attempt | Many-to-1 with `Source` | No |
| **AdminUser** | Internal operator account | 1-to-many with `ManualOverride`, `AuditLog` | Yes |
| **ManualOverride** | Admin action on match, suppression, merge, or score correction | Many-to-1 with `AdminUser`; relates to `ContentItem`, `Game`, or `ReviewSignal` | Yes (actor only) |
| **AnalyticsEvent** | Product telemetry for page/search/click actions | References `Game`, `ContentItem`, `Deal` where relevant | Potentially yes if IP/user identifiers stored [NEEDS INPUT] |
| **NewsletterSubscriber** | Optional waitlist/newsletter signup if enabled in v1 | Standalone or CRM-sync entity | Yes |

### Relationship Notes
- A `Game` can have many `ContentItem`s.
- A `ContentItem` belongs to exactly one `Source`.
- A `ContentItem` may link to one primary `Game` in v1; support for multi-game items should be suppressed or handled via manual review unless explicitly enabled [INFERRED].
- A `ReviewSignal` is derived from one `ContentItem` and contributes to one `Game` score.
- `AggregatedScore` should store both current value and historical versions for auditability.

---

## 8. Integration Points

| Integration | Purpose | v1 Status | Notes |
|---|---|---|---|
| **BoardGameGeek API/data source** | Canonical game metadata, ratings, rank/community context | In scope | [NEEDS INPUT] confirm API limits/usage policy and caching requirements |
| **YouTube Data API** | Creator video metadata and channel ingestion | In scope | Embedding allowed where YouTube policy permits |
| **RSS/Atom feeds** | Written review/news ingestion for participating sites | In scope | Preferred over scraping where available |
| **Website scraping connectors** | Structured extraction for approved written sources lacking feeds/APIs | In scope, limited | Launch only after legal/ToS review [NEEDS INPUT] |
| **Affiliate retailer feeds/APIs** | Deal cards and outbound tracking | In scope for selected partners | Default launch partners: 1-2 retailers [INFERRED] |
| **Email service provider** | Optional newsletter/waitlist capture | Optional v1 | Can launch after core aggregation if needed |
| **Analytics platform** | User behavior and conversion tracking | In scope | Must support event taxonomy defined in FR-011 |
| **Monitoring/alerting platform** | Job health and operational alerts | In scope | Required for ingestion reliability |
| **Podcast feeds/transcripts** | Audio review ingestion | Out of scope v1 | Candidate for v2+ |
| **Reddit API** | Discussion/buzz signals | Out of scope for score; optional discovery later | Avoid score pollution in v1 [INFERRED] |
| **TikTok/Instagram APIs** | Short-form content | Out of scope v1 | Requires separate legal/product review |

---

## 9. UX/UI Requirements

### Key Screens
1. **Homepage / Discovery**
   - Search-first layout.
   - Modules for Trending, Recently Updated, and Editor Picks fallback [INFERRED].
   - Clear explanation of what the GamePulse Critics Score means.
2. **Game Detail Page**
   - Hero area with title, image, key metadata, critics score, BGG community score, last updated.
   - Tabs or stacked sections for Reviews, How to Play, Strategy, News, Deals.
   - Source attribution on every external content card.
3. **Search Results / Browse Page**
   - Search box, filters, sortable result list.
   - Score badge state: score available / score pending.
4. **Admin Source Management**
   - Source list, status, ingestion health, legal status, last sync.
5. **Admin Review Queue**
   - Low-confidence matches, extraction failures, duplicates, suppressions.

### Loading States
- Skeleton loaders for game hero and content lists.
- Search should show immediate loading feedback within 150 ms [INFERRED].
- Trending/home modules should render placeholders rather than causing layout shift.

### Empty States
- No score yet: explain minimum review threshold.
- No deals available: hide module or show `No current deals available`.
- No search results: show spellcheck guidance and nearby titles.
- No reviews yet: show community data and `Check back soon` messaging.

### Error States
- If page data fails to load, show retry CTA and avoid rendering broken embeds/cards.
- If external media is blocked, degrade to a standard link card.
- If admin actions fail to save, preserve unsaved work and show actionable error text.

### UX Principles
- Optimize for trust: show source names, timestamps, and score provenance.
- Optimize for scanability: score and key metadata must be above the fold on common laptop and mobile breakpoints.
- Avoid dark patterns: affiliate disclosure must be visible before click-out.
- Preserve SEO: public content must be server-rendered or prerendered where relevant.

---

## 10. Release & Rollout

### Suggested Rollout Plan [INFERRED]

#### Phase 0 — Internal Alpha (Weeks 1-4)
- 250 canonical games
- 5 approved sources
- Admin tooling only for source setup, ingestion review, manual correction
- Exit criteria:
  - >= 90% audited match precision on 100-item sample
  - No critical data model blockers
  - Public page performance within 20% of target

#### Phase 1 — Closed Beta (Weeks 5-8)
- 1,000 canonical games
- 10-12 approved sources
- Public game pages, search, score calculation, analytics
- Invite-only testing with 100-250 hobby users and 5-10 friendly creators [INFERRED]
- Exit criteria:
  - Broken link rate < 3%
  - 95% scheduled jobs complete on time for 2 consecutive weeks
  - >= 30% of beta sessions click through to at least one content item

#### Phase 2 — Public v1 Launch (Weeks 9-12)
- 2,000 canonical games
- 15 approved sources
- Deal links live with at least 1 affiliate partner
- SEO artifacts submitted and monitored
- Launch guardrails:
  - Match precision >= 90%
  - Public site uptime >= 99.5% during launch month
  - p95 LCP < 2.5 s on top 100 game pages
  - Legal approval completed for every active source [NEEDS INPUT]

### Rollback / Global Disable Controls
- Source-level disable control to turn off problematic content sources.
- Score publish control to hide critics score site-wide if a calculation defect is found.
- Deal-module disable control if partner data becomes stale or non-compliant.

---

## 11. Open Questions with Proposed Defaults

| Open Question | Why It Matters | Proposed Default |
|---|---|---|
| **[NEEDS INPUT] What is the legal basis for scraping each written source?** | Launch risk and partner trust | Do not scrape any source without API, RSS, explicit permission, or written legal approval |
| **[NEEDS INPUT] Should BGG rating be labeled as `Community Score` in v1, or should GamePulse wait for first-party user ratings?** | Affects trust and terminology | Use `BGG Community Score` label in v1 to avoid implying GamePulse owns the community dataset |
| **[NEEDS INPUT] How transparent should critic weighting be publicly?** | Impacts trust vs gaming risk | Expose high-level methodology and review counts, but keep exact source weights internal at launch |
| **[NEEDS INPUT] How should expansions, deluxe editions, and reprints be represented?** | Impacts game matching and URL strategy | Treat each BGG item as its own canonical record; add manual linking between parent/base game relationships later |
| **[NEEDS INPUT] Which retailer/affiliate partners are launch-critical?** | Needed for monetization sequencing | Launch with 1-2 partners in the primary market, likely US-focused [INFERRED] |
| **[NEEDS INPUT] Is newsletter signup required for v1 launch?** | Impacts scope and PII handling | Make newsletter optional; ship core aggregation even if email capture is deferred |
| **[NEEDS INPUT] Should multi-game content (e.g., top-10 lists) appear on public game pages?** | Affects relevance and clutter | Exclude from v1 scoring; allow only if manually approved for discovery modules |
| **[NEEDS INPUT] Which geography and currency should v1 support?** | Affects deal accuracy and UX complexity | English-language, US-first launch [INFERRED], with explicit region note where pricing is unavailable |
| **[NEEDS INPUT] Who owns editorial governance for approved critics/sources?** | Needed for operational accountability | Assign a product/editorial owner who can approve sources and resolve disputes |
| **[NEEDS INPUT] Do we need user accounts in v1 for saved games or alerts?** | Could expand scope materially | No; anonymous browsing only for v1, revisit after traffic and score quality are proven |

---

## Appendix: Preserved Product Intent

The original PRD's core intent is preserved:
- build a "Rotten Tomatoes for board games" consensus layer,
- aggregate fragmented content into one destination,
- create future value for creators and publishers,
- use aggregation quality and SEO as early moat.

This version makes that intent implementation-ready by narrowing v1, specifying launch criteria, and explicitly deferring personalization, creator monetization, and publisher tooling until the core aggregation engine is reliable.
