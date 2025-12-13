# Swaami SEO Strategy

## Overview

This document outlines the SEO strategy for Swaami, designed to maximize organic traffic from people searching for neighbourhood help, community building, and local volunteering.

## Target Keywords

### Primary Keywords (High Intent)
| Keyword | Monthly Searches (AU) | Competition |
|---------|----------------------|-------------|
| neighbor help app | 500+ | Low |
| community help near me | 1,000+ | Medium |
| local volunteer opportunities | 2,000+ | Medium |
| help neighbors | 800+ | Low |
| neighbourhood assistance | 400+ | Low |

### Long-Tail Keywords (Content Focus)
- "how to ask neighbours for help"
- "is it safe to meet people from apps"
- "building trust with new neighbours"
- "quick favours for neighbours"
- "community building tips"

### Local Keywords (Geo-Targeting)
- "neighbor help Sydney"
- "community volunteers Melbourne"
- "local help Brisbane"
- "neighbourhood app Perth"

## Technical SEO Implementation

### Meta Tags
All pages use dynamic meta tags via `src/lib/seo.ts`:
- `updateMetaTags()` - Updates title, description, keywords, Open Graph, Twitter cards
- Canonical URLs for all pages
- Proper robots directives

### Structured Data (JSON-LD)
| Schema Type | Pages | Purpose |
|-------------|-------|---------|
| FAQPage | /faq | Rich snippets in search results |
| Article | /blog/* | Article rich results |
| BreadcrumbList | /blog/* | Navigation breadcrumbs |
| SoftwareApplication | / | App store-style results |
| Organization | / | Brand knowledge panel |

### Sitemap & Robots
- `public/sitemap.xml` - All public pages with lastmod and priority
- `public/robots.txt` - Allow all crawlers, block /app and /auth

## Content Strategy

### FAQ Page (`/faq`)
**Purpose**: Capture "question" searches and build trust

Categories:
1. Getting Started - For new users searching "how does X work"
2. Safety & Trust - For safety-conscious searchers
3. Tasks & Helping - For people researching the concept
4. Credits & Subscriptions - For pricing questions
5. Location & Privacy - For privacy-conscious users
6. Timing & Availability - For practical questions

**SEO Value**: FAQ schema provides rich snippets, high dwell time

### Blog (`/blog`)
**Purpose**: Capture long-tail searches, build authority, fresh content

Article Categories:
1. **Tips & Guides** - How-to content (highest search volume)
2. **Safety** - Builds trust and captures safety-related searches
3. **Community Building** - Thought leadership
4. **Local Spotlights** - City-specific SEO
5. **Success Stories** - Social proof and engagement

### Initial Articles
1. "How to Ask Neighbours for Help Without Feeling Awkward" - High-intent guide
2. "Building Trust with Neighbours You Just Met" - New residents
3. "10 Essential Safety Tips for Meeting Neighbours from Apps" - Safety searchers
4. "Sydney's Most Community-Minded Neighbourhoods" - Local SEO
5. "25 Quick Favours You Can Do for Neighbours" - Listicle format

## Traffic Acquisition Plan

### Phase 1: Foundation (Month 1-2)
- [x] Technical SEO implementation
- [x] FAQ page with schema
- [x] Blog with initial articles
- [x] Sitemap and robots.txt
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools

### Phase 2: Content Growth (Month 2-4)
- [ ] Publish 2 blog posts per week
- [ ] Create city-specific landing pages (Sydney, Melbourne, etc.)
- [ ] Guest posts on community/local blogs
- [ ] Social sharing of blog content

### Phase 3: Authority Building (Month 4-6)
- [ ] Backlink outreach to community organizations
- [ ] Partner with local councils/community groups
- [ ] PR for launch in new neighbourhoods
- [ ] User-generated success stories

## Measurement

### Key Metrics
| Metric | Tool | Target |
|--------|------|--------|
| Organic sessions | Google Analytics | 1,000/month by M3 |
| Keyword rankings | Search Console | Top 10 for 5 primary |
| CTR from search | Search Console | >3% |
| Indexed pages | Search Console | All public pages |
| Core Web Vitals | Lighthouse | All green |

### Monthly Review
1. Check Search Console for impressions/clicks
2. Review keyword ranking changes
3. Identify new keyword opportunities
4. Update underperforming content

## Content Calendar (Template)

### Week Structure
- **Monday**: Publish new blog post
- **Wednesday**: Social sharing
- **Friday**: Publish second blog post (if capacity)

### Monthly Themes
- January: "New Year, New Neighbours" - fresh starts
- February: "Community Care" - helping themes
- March: "Spring Cleaning Help"
- Summer: Seasonal tasks (garden, pets)
- Winter: Indoor help (tech, cooking)

## Adding New Blog Posts

To add a new blog post:

1. Edit `src/data/blog-posts.ts`
2. Add new entry to `BLOG_POSTS` array:
```typescript
{
  id: 'unique-id',
  slug: 'url-friendly-slug',
  title: 'SEO-Optimized Title (50-60 chars)',
  excerpt: 'Compelling excerpt (150-160 chars)',
  content: `# Markdown Content...`,
  author: 'Swaami Team',
  publishedAt: '2024-12-15T10:00:00Z',
  category: 'tips', // tips, safety, community, local, stories
  tags: ['keyword1', 'keyword2'],
  readTime: 5,
  featured: false,
}
```
3. Update `public/sitemap.xml` with new URL
4. Deploy

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Web.dev SEO Guide](https://web.dev/learn/seo)
