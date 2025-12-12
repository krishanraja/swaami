# Swaami Success Outcomes & KPIs

## North Star Metric

**Successful Task Completions per Week per Neighborhood**

Target: 10+ completions/week in each active neighborhood within 3 months of launch.

## Primary KPIs

### 1. Trust Velocity
**Definition**: Time from sign-up to Tier 1 verification

| Rating | Time | Status |
|--------|------|--------|
| Excellent | <24 hours | 🟢 |
| Good | 24-72 hours | 🟡 |
| Poor | >72 hours | 🔴 |

**Target**: 60% of users reach Tier 1 within 48 hours.

### 2. Help Ratio
**Definition**: Tasks completed vs. tasks posted

| Rating | Ratio | Status |
|--------|-------|--------|
| Excellent | >80% | 🟢 |
| Good | 60-80% | 🟡 |
| Poor | <60% | 🔴 |

**Target**: 70% of posted tasks get matched within 24 hours.

### 3. Neighborhood Density
**Definition**: Active users per km² in target areas

| Rating | Density | Status |
|--------|---------|--------|
| Excellent | >50/km² | 🟢 |
| Good | 20-50/km² | 🟡 |
| Poor | <20/km² | 🔴 |

**Target**: 30 active users/km² in launch neighborhoods.

## Secondary KPIs

### User Engagement
- **DAU/MAU ratio**: Target >30%
- **Tasks per active user/month**: Target 2+
- **Return rate (7-day)**: Target >50%

### Trust & Safety
- **Tier 2 conversion**: Target 20% of Tier 1 users
- **Safety incidents**: Target 0 (with <0.1% false positives)
- **Content filter triggers**: Track and review monthly

### Platform Health
- **Edge function latency**: <500ms p95
- **AI enhancement success**: >95%
- **Mobile performance**: LCP <2.5s

## Business Outcomes

### Phase 1: Validation (Months 1-3)
- [ ] 500 registered users
- [ ] 100 completed tasks
- [ ] 3 active neighborhoods
- [ ] Net Promoter Score >40

### Phase 2: Growth (Months 4-6)
- [ ] 2,000 registered users
- [ ] 500 completed tasks
- [ ] 10 active neighborhoods
- [ ] First credit purchases

### Phase 3: Scale (Months 7-12)
- [ ] 10,000 registered users
- [ ] 2,000 completed tasks/month
- [ ] 25 active neighborhoods
- [ ] Break-even on infrastructure costs

## What Good Looks Like

### For Users
- "I posted a need and got help within 2 hours"
- "I trust my Tier 2 neighbors completely"
- "Helping out makes me feel connected to my community"

### For the Platform
- High-quality, actionable task posts (AI enhancement working)
- Smooth verification flow (phone + social in one session)
- Active chat threads leading to completed tasks

### For the Community
- Neighborhoods developing their own helpers
- Cross-task relationships forming
- Local trust networks emerging

## Measurement Tools

| Metric | Source | Frequency |
|--------|--------|-----------|
| Task completions | `tasks` table | Daily |
| Verification velocity | `user_verifications` table | Daily |
| Engagement | Analytics dashboard | Weekly |
| Safety incidents | Manual review | As needed |
| NPS | In-app survey | Monthly |
