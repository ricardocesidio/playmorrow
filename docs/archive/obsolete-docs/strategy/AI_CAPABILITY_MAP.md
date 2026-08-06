# AI Capability Map

**Status:** Active — official brain map of Playmorrow AI
**Last updated:** 2026-08-05
**Purpose:** Define every AI capability by domain, with inputs, outputs, business value, and metrics

---

## Player Intelligence (16 capabilities)

### 1. Semantic Search
- **Purpose:** Natural language game search. "Cozy farming sim with romance" → relevant games.
- **Inputs:** Natural language query, user taste profile (optional)
- **Outputs:** Ranked game list with relevance scores and explanations
- **Business Value:** 50% fewer zero-result searches, 40% more search-to-wishlist conversion
- **Primary KPI:** Zero-result rate <5%
- **Models:** Embeddings (text-embedding-3-small), Semantic ranking
- **Cost:** Low ($0.00002/1K tokens embedding, cached)
- **Privacy:** Query logged anonymously unless user opts in to personalization
- **Milestone:** M26

### 2. Recommendation Engine
- **Purpose:** Personalized game recommendations based on taste profile, follows, wishlists, and play patterns
- **Inputs:** User interaction history, gaming taste profile, game embeddings
- **Outputs:** Ranked recommendations with "because you..." explanations
- **Business Value:** 35% CTR improvement, 20% more wishlists
- **Primary KPI:** CTR >15%
- **Models:** Collaborative filtering, content-based ranking
- **Cost:** Medium (batch processing + online inference)
- **Privacy:** Requires opt-in personalization
- **Milestone:** M23

### 3. Mood-Based Discovery
- **Purpose:** Find games by emotional experience
- **Inputs:** Emotion categories (cozy, tense, melancholic, exciting, peaceful, thrilling, thought-provoking, joyful)
- **Outputs:** Games ranked by emotional classification score
- **Business Value:** New discovery vector — opens games that don't match genre tags
- **Primary KPI:** Emotion-based search conversion rate >10%
- **Models:** Text classification (fine-tuned on game descriptions)
- **Cost:** Low (cached classifications)
- **Privacy:** No personal data needed
- **Milestone:** M26

### 4. Gaming Taste Profile
- **Purpose:** Inferred player profile from behavior, preferences, and interaction patterns
- **Inputs:** Follows, wishlists, reactions, views, play history, review sentiment
- **Outputs:** Taste profile vector (genres, mechanics, moods, difficulty preferences, price sensitivity)
- **Business Value:** Powers all personalized features
- **Primary KPI:** Profile freshness (updated within 24h of interaction)
- **Models:** Embedding aggregation, clustering
- **Cost:** Low (batch processing)
- **Privacy:** Requires opt-in; profile visible and editable by player
- **Milestone:** M23

### 5. Hidden Gems Finder
- **Purpose:** Surface high-quality games that algorithmic sorting buries
- **Inputs:** Game catalog, review data, player counts
- **Outputs:** "Hidden Gems" collection — high positive ratio, low review count, recent activity
- **Business Value:** Counters platform bias toward popular games; unique differentiator
- **Primary KPI:** Hidden gems CTR >12%
- **Models:** Classification, anomaly detection
- **Cost:** Low (daily batch)
- **Privacy:** No personal data
- **Milestone:** M23

### 6. Game Comparison
- **Purpose:** Side-by-side comparison of similar games
- **Inputs:** 2-3 game IDs
- **Outputs:** Comparison across mechanics, difficulty, length, price, reviews, art style, community size
- **Business Value:** Helps players make informed decisions between similar titles
- **Primary KPI:** Comparison-to-wishlist rate >20%
- **Models:** Text generation, structured data extraction
- **Cost:** Low-Medium (on-demand, cached)
- **Privacy:** No personal data
- **Milestone:** Post-M26

### 7. Wishlist Intelligence
- **Purpose:** Tell players when to buy based on price history and studio behavior
- **Inputs:** Wishlist, price history, studio discount patterns
- **Outputs:** "Buy now" / "Wait for sale" / "Expected sale: March"
- **Business Value:** Increases purchase confidence; reduces "wishlist and forget"
- **Primary KPI:** Purchase from wishlist within 7 days of insight >15%
- **Models:** Time-series forecasting
- **Cost:** Low (batch + cached)
- **Privacy:** Uses wishlist data with implicit consent
- **Milestone:** M25

### 8. Backlog Prioritizer
- **Purpose:** Suggest which owned/wishlisted game to play next
- **Inputs:** Library, play history, time availability, taste profile
- **Outputs:** "Play this next" with explanation
- **Business Value:** Increases play time; reduces "paradox of choice" in large backlogs
- **Primary KPI:** Backlog suggestion play rate >25%
- **Models:** Ranking, classification
- **Cost:** Low (batch)
- **Privacy:** Requires library access consent
- **Milestone:** Post-M26

### 9. Game Explainer
- **Purpose:** Concise, accurate game summaries with key selling points
- **Inputs:** Game ID, user context (what they've played, what they like)
- **Outputs:** 2-3 sentence summary tailored to user's interests
- **Business Value:** Faster decisions; fewer "I don't get this game" moments
- **Primary KPI:** Time-on-page before action >30% faster than non-AI
- **Models:** Text generation, personalization layer
- **Cost:** Low (cached)
- **Privacy:** Context from opted-in profile
- **Milestone:** M22

### 10. Review Summarizer
- **Purpose:** Summarize community reviews into pros/cons
- **Inputs:** All reviews for a game
- **Outputs:** "Players love: X, Y, Z. Players are frustrated by: A, B."
- **Business Value:** Saves players reading 50 reviews; builds trust in summaries
- **Primary KPI:** Summary-to-full-review click rate >30%
- **Models:** Summarization, sentiment clustering
- **Cost:** Low (batch, updated weekly)
- **Privacy:** Attributes to real players, anonymized aggregation
- **Milestone:** M23

### 11. Difficulty Recommendation
- **Purpose:** Recommend games matching player's preferred difficulty
- **Inputs:** Taste profile (difficulty preference), game difficulty metadata
- **Outputs:** Filtered recommendations by difficulty tier
- **Business Value:** Reduces refunds from difficulty mismatch
- **Primary KPI:** Difficulty-matched games play time >baseline
- **Models:** Classification
- **Cost:** Low
- **Privacy:** From inferred profile
- **Milestone:** M23

### 12. Accessibility Recommendation
- **Purpose:** Recommend games matching accessibility needs
- **Inputs:** Accessibility preferences, game accessibility metadata
- **Outputs:** Filtered games by accessibility features
- **Business Value:** Opens gaming to players with accessibility needs
- **Primary KPI:** Accessibility-filtered wishlist rate >baseline
- **Models:** Classification, structured extraction from descriptions
- **Cost:** Low (batch)
- **Privacy:** Accessibility preferences private
- **Milestone:** Post-M26

### 13. Completion Predictor
- **Purpose:** Estimate how long a game takes to complete based on player style
- **Inputs:** Game metadata, community completion data, player pace
- **Outputs:** "For you: ~12 hours main story"
- **Business Value:** Better time investment decisions
- **Primary KPI:** Predictor accuracy ±20% of actual
- **Models:** Regression, clustering by player type
- **Cost:** Low
- **Privacy:** Anonymized aggregation
- **Milestone:** Post-M26

### 14. Replay Value Predictor
- **Purpose:** Estimate replayability based on game structure and community data
- **Inputs:** Game features (multiple endings, NG+, procedural generation)
- **Outputs:** Replay score with explanation
- **Business Value:** Highlights games with deep value
- **Primary KPI:** Replay-rated games wishlist rate >baseline
- **Models:** Classification
- **Cost:** Low
- **Privacy:** No personal data
- **Milestone:** Post-M26

### 15. Game Similarity Engine
- **Purpose:** Find genuinely similar games, not just same-genre
- **Inputs:** Game ID, similarity dimensions (mechanics, mood, difficulty, price)
- **Outputs:** Ranked similar games with similarity dimension breakdown
- **Business Value:** Better than genre-based "similar games" sections
- **Primary KPI:** Similarity recommendation CTR >12%
- **Models:** Embedding cosine similarity
- **Cost:** Low (cached per game)
- **Privacy:** No personal data
- **Milestone:** M23

### 16. Gaming News Personalization
- **Purpose:** Surface platform news (devlogs, events, launches) relevant to player
- **Inputs:** Taste profile, followed studios, wishlisted games
- **Outputs:** Personalized feed ordering
- **Business Value:** Feed engagement +25%
- **Primary KPI:** Personalized feed CTR >non-personalized by 30%
- **Models:** Ranking
- **Cost:** Low
- **Privacy:** From opted-in profile
- **Milestone:** M23

---

## Studio Intelligence (12 capabilities)

### 17. Store Page Optimizer
- **Purpose:** Analyze store page for discoverability and conversion
- **Inputs:** Game title, description, tags, screenshots, genre
- **Outputs:** Improvement suggestions with priority and expected impact
- **Business Value:** +25% store page conversion
- **Primary KPI:** Optimization acceptance rate >40%
- **Models:** Text analysis, image analysis, competitive benchmarking
- **Cost:** Medium (on-demand)
- **Privacy:** Studio-owned data
- **Milestone:** M25

### 18. Wishlist Forecaster
- **Purpose:** Predict launch-day wishlists based on current trajectory
- **Inputs:** Historical wishlist data, game metadata, genre benchmarks
- **Outputs:** Predicted wishlist count with confidence interval
- **Business Value:** Helps studios set realistic expectations and marketing budgets
- **Primary KPI:** Forecast accuracy r>0.7
- **Models:** Time-series regression
- **Cost:** Low (batch)
- **Privacy:** Studio data, compared against anonymized benchmarks
- **Milestone:** M25

### 19. Player Sentiment Analyzer
- **Purpose:** Cluster community comments into themes
- **Inputs:** All comments, reviews, reactions for a game
- **Outputs:** "Players love: X (23 mentions). Frustrated by: Y (8 mentions)."
- **Business Value:** Actionable feedback without reading every comment
- **Primary KPI:** Studio agreement with sentiment classification >80%
- **Models:** Sentiment analysis, topic clustering
- **Cost:** Low (batch, updated weekly)
- **Privacy:** Anonymized aggregation
- **Milestone:** M25

### 20. Competitor Analysis
- **Purpose:** Compare game against similar titles in genre/price range
- **Inputs:** Game ID, competitor set (auto-detected or manual)
- **Outputs:** Competitive positioning report (strengths, gaps, opportunities)
- **Business Value:** Strategic insights without manual research
- **Primary KPI:** Analysis reports viewed >50/month
- **Models:** Comparative analysis, benchmarking
- **Cost:** Medium (on-demand)
- **Privacy:** Uses public data only
- **Milestone:** M25

### 21. Launch Readiness Score
- **Purpose:** Composite score predicting launch success
- **Inputs:** Wishlists, followers, press kit completeness, social signals, devlog frequency
- **Outputs:** Score out of 100 with improvement suggestions
- **Business Value:** Actionable pre-launch checklist
- **Primary KPI:** Correlation between score and week-1 sales r>0.6
- **Models:** Composite scoring, regression
- **Cost:** Low (batch)
- **Privacy:** Studio-owned data
- **Milestone:** M25

### 22. Devlog Topic Suggester
- **Purpose:** Suggest devlog topics based on community interest and studio progress
- **Inputs:** Community questions, trending topics, game roadmap updates
- **Outputs:** Ranked topic suggestions with rationale
- **Business Value:** +30% devlog publishing frequency
- **Primary KPI:** Suggested topic adoption rate >40%
- **Models:** Topic extraction, trend detection
- **Cost:** Low
- **Privacy:** Community data aggregated
- **Milestone:** M22

### 23. AI Devlog Draft
- **Purpose:** Generate devlog draft based on topic and studio voice
- **Inputs:** Topic, game context, studio voice profile
- **Outputs:** Draft devlog with edit suggestions
- **Business Value:** Saves 30-60 min per devlog; +40% publishing frequency
- **Primary KPI:** Draft acceptance rate >50%
- **Models:** Text generation
- **Cost:** Low-Medium (on-demand)
- **Privacy:** Studio-owned; never published without approval
- **Milestone:** M22

### 24. Tag Optimizer
- **Purpose:** Suggest optimal Steam/Playmorrow tags for discoverability
- **Inputs:** Game description, genre, audience
- **Outputs:** Tag suggestions with estimated reach impact
- **Business Value:** Better tag coverage → better discoverability
- **Primary KPI:** Tag suggestion adoption rate >60%
- **Models:** Classification, search volume analysis
- **Cost:** Low
- **Privacy:** Uses public data
- **Milestone:** M25

### 25. Pricing Benchmark
- **Purpose:** Compare game price against genre peers
- **Inputs:** Game metadata, genre, features, review quality
- **Outputs:** Price positioning analysis with recommendations
- **Business Value:** Helps studios price competitively
- **Primary KPI:** Pricing insight views >30/month
- **Models:** Regression, comparative analysis
- **Cost:** Low
- **Privacy:** Uses public pricing data
- **Milestone:** M25

### 26. Revenue Insights
- **Purpose:** AI-interpreted revenue analytics
- **Inputs:** Sales data, marketplace transactions
- **Outputs:** "Revenue is trending +12% MoM. Weekend sales 3x weekday. Bundle purchases up 40%."
- **Business Value:** Actionable insights without data analyst
- **Primary KPI:** Insight cards viewed per studio >5/month
- **Models:** Text generation, anomaly detection
- **Cost:** Low
- **Privacy:** Studio-owned data, never shared
- **Milestone:** Post-M26

### 27. Sales Forecaster
- **Purpose:** Predict future sales based on historical data and market trends
- **Inputs:** Historical sales, seasonality, genre trends, upcoming events
- **Outputs:** 30/60/90-day forecast with confidence intervals
- **Business Value:** Financial planning for indie studios
- **Primary KPI:** Forecast accuracy ±25% for 30-day predictions
- **Models:** Time-series forecasting
- **Cost:** Low
- **Privacy:** Studio data
- **Milestone:** Post-M26

### 28. Studio Health Dashboard
- **Purpose:** Holistic studio health: community growth, revenue, engagement, publishing velocity
- **Inputs:** All studio metrics
- **Outputs:** Health score with trend arrows and AI-generated insights
- **Business Value:** One view to understand studio performance
- **Primary KPI:** Dashboard monthly active studios >100
- **Models:** Composite scoring, anomaly detection
- **Cost:** Low
- **Privacy:** Studio data
- **Milestone:** M25

---

## Publisher Intelligence (8 capabilities)

### 29. Portfolio Analytics
### 30. Cross-Game Insights
### 31. Revenue Forecasting
### 32. Studio Performance
### 33. Risk Assessment
### 34. Campaign Recommendations
### 35. Regional Expansion Analysis
### 36. Growth Opportunity Detection

*(Each follows the same structure — purpose, inputs, outputs, KPIs, models, cost, privacy — with publisher-specific business logic. Built post-M26.)*

---

## Marketplace Intelligence (8 capabilities)

### 37. Price Recommendation
### 38. Fraud Detection
### 39. Counterfeit Detection
### 40. Seller Trust Score
### 41. Demand Forecast
### 42. Bundle Suggestions
### 43. Regional Pricing
### 44. Marketplace Health Dashboard

*(Built M22-M25 foundations, full capabilities post-M26.)*

---

## Community Intelligence (8 capabilities)

### 45. Toxicity Detection
### 46. Spam Detection
### 47. Review Quality Scoring
### 48. Fake Review Detection
### 49. Community Health Score
### 50. Trend Detection
### 51. Duplicate Report Detection
### 52. Moderator Assistant

*(M24 builds core moderation; advanced community intelligence post-M26.)*

---

## Platform Intelligence (7 capabilities)

### 53. Semantic Ranking
### 54. User Segmentation
### 55. Retention Prediction
### 56. Churn Prediction
### 57. Growth Forecast
### 58. Feature Adoption Analytics
### 59. AI Cost Optimization

*(Platform intelligence is built throughout Phase 6 as infrastructure matures.)*

---

## Global Capabilities (10 capabilities — shared across all domains)

### 60. Conversation Memory
### 61. Embeddings (Text + Game)
### 62. RAG (Retrieval-Augmented Generation)
### 63. Streaming (SSE)
### 64. Prompt Registry
### 65. Feedback Learning
### 66. Hallucination Detection
### 67. Cost Monitoring
### 68. Provider Switching
### 69. Explainability Layer

*(Built in M22 Foundation. Used by all other capabilities.)*

---

## Dependency Map

```
Foundation (M22) → All capabilities
    Embeddings + Vector Store → Search + Recommendations + Similarity
    RAG → Assistant + Game Explainer + Review Summarizer
    Prompt Registry → All text generation
    Streaming → All real-time features

Discovery (M23 → M26):
    Embeddings → Semantic Search → Recommendation Engine
    Recommendation Engine → Gaming Taste Profile → Hidden Gems → Mood Discovery

Studio (M25):
    Sentiment Analysis → Store Page Optimizer → Competitor Analysis
    Recommendation Engine → Wishlist Forecaster → Launch Readiness Score

Moderation (M24):
    Provider → Content Moderation → Toxicity Detection → Spam Detection → Review Quality

Marketplace (Post-M26):
    Fraud Detection + Trust Score → Marketplace Health
```

---

**Total: 69 AI capabilities identified across 7 domains + global**
