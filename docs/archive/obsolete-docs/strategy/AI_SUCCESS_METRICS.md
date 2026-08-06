# AI Success Metrics — Playmorrow

Measurable KPIs for Playmorrow AI features. Every KPI has a clear definition, data source, and target. No vanity metrics.

---

## Discovery Metrics

| KPI | Definition | Data Source | Target |
|-----|-----------|-------------|--------|
| Recommendation CTR | % of AI-generated recommendations that receive a click (`clicks / impressions`) | Frontend analytics (tracked via `data-ai-rec` attributes + click handlers) | >15% |
| Wishlist Conversion | % of AI-recommended games that are wishlisted within 24h of discovery (`wishlists / impressions`) | API endpoint logs + `wishlist` table, joined on `userId` + `gameId` + `source = 'ai_recommendation'` | >8% |
| Unique Games Discovered | Average number of distinct games a user discovers via AI features per session | Session analytics — track `gameId` × `source = 'ai'` per session, count distinct | >2/session |
| Serendipity Score | Ratio of genre-diverse recommendations to genre-similar recommendations (`diverseRecs / totalRecs`), where diverse = different primary genre from user's most-played | Recommendation engine output logs — compare `recGenre` to `userTopGenre` | >0.3 |
| Zero-Result Search Rate | % of searches returning 0 results (`emptySearches / totalSearches`) | Search service logs — count queries where `results.length === 0` | <5% |
| Time to Discovery | Median seconds from search initiation to first game page view | Frontend analytics — `searchStarted` timestamp to first `gamePageView` with `source = 'search'` | <30s |
| Search-to-Click Rate | % of searches where user clicks at least one result (`searchesWithClick / totalSearches`) | Search service logs + click tracking | >60% |
| Semantic Search Usage | % of searches using natural language (≥3 words, contains non-tag tokens) vs. keyword/tag searches | Search service — regex match for natural language patterns | >20% |

---

## Studio Productivity Metrics

| KPI | Definition | Data Source | Target |
|-----|-----------|-------------|--------|
| Devlog Publishing Frequency | Average devlogs published per studio per month, compared to pre-AI baseline | `devlog` table — `SELECT studioId, COUNT(*) GROUP BY DATE_TRUNC('month', createdAt)` — compare pre/post AI launch | +30% |
| AI Draft Acceptance Rate | % of AI-generated devlog drafts published without major structural changes (>50% text preserved) | LLM analytics — compare `draftText` to `publishedText` using diff ratio; accept if similarity > 0.5 | >40% |
| Store Page Optimization Requests | Number of unique studios using the AI store page analysis feature per month | Analytics — count distinct `studioId` hitting `POST /ai/analyze/store-page` | >50/month |
| Launch Readiness Score Accuracy | Pearson correlation between AI-predicted wishlist count (30 days post-launch) and actual wishlist count | Analytics pipeline — run correlation monthly on all games launched ≥30 days ago | r > 0.7 |
| Sentiment Analysis Accuracy | % of AI sentiment classifications that studios agree with when prompted for feedback | Studio feedback — after each analysis, prompt thumbs up/down; track agreement rate | >80% |
| Time Saved Per Studio | Estimated hours saved per studio per month: sum of (AI-assisted action count × estimated minutes saved per action) / 60 | Calculated from usage logs — devlog draft = 45 min, store analysis = 30 min, sentiment report = 15 min, pricing suggestion = 10 min | >5h |

---

## Revenue Metrics

| KPI | Definition | Data Source | Target |
|-----|-----------|-------------|--------|
| AI-Influenced Revenue | Marketplace purchase revenue where AI played a role in the decision path (recommendation → view → purchase within session) | Attribution tracking — `Transaction` table with `attributionSource = 'ai'` flag, joined to `purchased_licenses` for amount | >20% of total |
| Bundle Conversion Rate | % of AI-suggested bundles that result in at least one purchase (`bundlesPurchased / bundlesSuggested`) | Marketplace analytics — track bundle suggestions via `POST /ai/suggest-bundle` and correlate with purchases | >5% |
| Pricing Intelligence Adoption | % of studios with active marketplace listings that have used AI pricing suggestions at least once | Analytics — `COUNT(DISTINCT studioId WHERE usedPricingAI = true) / COUNT(DISTINCT studioId WITH listings)` | >30% |
| Creator Commission Growth | % increase in referral commissions attributed to AI-driven discovery paths | `Transaction` table — filter `type = 'REFERRAL_COMMISSION'` and `attributionSource = 'ai'`, compare month-over-month | +15% |

---

## Trust & Safety Metrics

| KPI | Definition | Data Source | Target |
|-----|-----------|-------------|--------|
| Moderation Accuracy | % of AI-flagged content items that are confirmed as violations by human review (`truePositives / totalFlagged`) | Moderation queue — each flag has `aiFlagged: boolean` and `humanConfirmed: boolean` | >95% |
| False Positive Rate | % of AI-flagged content that human review overturns as legitimate (`falsePositives / totalFlagged`) | Moderation queue — `aiFlagged = true AND humanConfirmed = false` | <2% |
| Spam Detection Rate | % of spam content caught by AI before any user report is filed (`aiCaughtSpam / (aiCaughtSpam + userReportedSpam)`) | Moderation analytics — cross-reference AI detections with user reports table on same content item | >80% |
| User Reports Per Day | Average daily user-submitted content reports (should decrease as AI moderation improves) | `reports` table — `SELECT COUNT(*) GROUP BY DATE(createdAt)` | -50% (from baseline) |
| Recommendation Acceptance Rate | % of users who do not dismiss/hide AI recommendations within 7 days of first seeing them | Frontend analytics — track `dismissRecommendation` events; accept = no dismiss within 7 days | >70% |

---

## Platform Health Metrics

| KPI | Definition | Data Source | Target |
|-----|-----------|-------------|--------|
| Daily AI Users | Unique users interacting with any AI feature in a 24h window | Analytics — `COUNT(DISTINCT userId) WHERE feature LIKE 'ai/%' GROUP BY DATE(timestamp)` | >500 |
| Monthly AI Cost | Total LLM API spend across all providers per calendar month | Provider dashboards (OpenAI, Anthropic) + `AIMetricsService` cost tracking | <$500 |
| Cost Per Request | Average LLM API cost per AI endpoint call (`totalCost / totalRequests`) | `AIMetricsService` — sum cost column / count requests | <$0.01 |
| Average Latency | P95 response time in milliseconds for AI endpoints | `AIMetricsService` — `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latencyMs)` | <3s |
| Provider Uptime | % of AI requests that complete without error (HTTP 2xx) | `AIMetricsService` — `successfulRequests / totalRequests` | >99% |
| Cache Hit Rate | % of embedding requests served from cache rather than recomputed | `EmbeddingService` — track `cacheHits / (cacheHits + cacheMisses)` | >60% |
| Player AI Satisfaction | Net Promoter Score from players who have used AI features (survey: "How likely are you to recommend Playmorrow AI features?" 0-10) | User survey — sent to active AI users monthly; NPS = % promoters (9-10) - % detractors (0-6) | >40 |
| Studio AI Satisfaction | Net Promoter Score from studio users who have used AI features | Studio survey — same methodology, sent to studios with ≥3 AI interactions | >40 |

---

## Measurement Cadence

| Frequency | Metrics |
|-----------|---------|
| **Real-time** | Cost, latency, errors (`AIMetricsService` dashboards) |
| **Daily** | DAU, CTR, searches, recommendations served |
| **Weekly** | Conversion rates, moderation stats, cache hit rate, cost-per-request trend |
| **Monthly** | NPS, revenue attribution, studio productivity, wishlist conversion |
| **Quarterly** | Strategic review of all KPIs; target adjustments; feature prioritization |

---

## Data Pipeline

```
User Action → Frontend Event → API Log → PostgreSQL (metrics tables)
                                         → AIMetricsService (cost/latency)
                                         → Provider Dashboard (billing)
```

All metrics tables use the schema:

```sql
CREATE TABLE ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}',  -- { userId, gameId, feature, provider, model }
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_metrics_name_date ON ai_metrics(metric_name, recorded_at);
```

---

## Governance

- **Ownership:** AI metrics reviewed monthly by engineering lead
- **Alerting:** Cost exceeds $500/month triggers Slack notification; P95 latency > 5s triggers on-call
- **Data retention:** Raw metrics kept 12 months; aggregated kept indefinitely
- **Privacy:** No PII in metrics tables; user-level data pseudonymized via `userId` hash
