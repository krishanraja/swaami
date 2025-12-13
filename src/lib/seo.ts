/**
 * SEO utilities for Swaami
 * Provides meta tag management, structured data, and SEO helpers
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  type?: 'website' | 'article' | 'profile';
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  noindex?: boolean;
}

// Base URL for the site
export const SITE_URL = 'https://swaami.app';
export const SITE_NAME = 'Swaami';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

// Primary keywords for SEO targeting
export const PRIMARY_KEYWORDS = [
  'neighbor help app',
  'community help near me',
  'local volunteer opportunities',
  'help neighbors',
  'neighborhood assistance',
  'trusted neighbors',
  'quick favors',
  'local community support',
  'hyperlocal help',
  'verified neighbors',
];

// City-specific keywords for local SEO
export const CITY_KEYWORDS = [
  'neighbor help Sydney',
  'community help Melbourne',
  'local volunteers Brisbane',
  'neighborhood app Perth',
  'community assistance Adelaide',
];

/**
 * Update document meta tags for SEO
 */
export function updateMetaTags(config: SEOConfig): void {
  const {
    title,
    description,
    keywords = PRIMARY_KEYWORDS,
    canonical,
    type = 'website',
    image = DEFAULT_IMAGE,
    author,
    publishedTime,
    modifiedTime,
    noindex = false,
  } = config;

  // Update title
  document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  // Helper to set meta tag
  const setMeta = (name: string, content: string, property = false) => {
    const attr = property ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  // Basic meta tags
  setMeta('description', description);
  setMeta('keywords', keywords.join(', '));
  setMeta('author', author || SITE_NAME);
  
  // Robots
  setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

  // Open Graph
  setMeta('og:title', title, true);
  setMeta('og:description', description, true);
  setMeta('og:type', type, true);
  setMeta('og:image', image, true);
  setMeta('og:site_name', SITE_NAME, true);
  setMeta('og:url', canonical || window.location.href, true);

  // Twitter
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', image);

  // Article-specific
  if (type === 'article') {
    if (publishedTime) setMeta('article:published_time', publishedTime, true);
    if (modifiedTime) setMeta('article:modified_time', modifiedTime, true);
    if (author) setMeta('article:author', author, true);
  }

  // Canonical URL
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonical || window.location.href;
}

/**
 * Generate JSON-LD structured data for FAQ page
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  return JSON.stringify(schema);
}

/**
 * Generate JSON-LD structured data for blog article
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  url: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.png`,
      },
    },
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    image: article.image || DEFAULT_IMAGE,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
  return JSON.stringify(schema);
}

/**
 * Generate JSON-LD structured data for local business
 */
export function generateLocalBusinessSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'Get help from verified neighbours in minutes. Quick favours, trusted faces, walking distance.',
    url: SITE_URL,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1200',
      bestRating: '5',
      worstRating: '1',
    },
  };
  return JSON.stringify(schema);
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return JSON.stringify(schema);
}

/**
 * Inject JSON-LD schema into document head
 */
export function injectSchema(schema: string, id: string): void {
  // Remove existing schema with same id
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = schema;
  document.head.appendChild(script);
}

/**
 * Remove schema from document head
 */
export function removeSchema(id: string): void {
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
}
