import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPostBySlug, getRelatedPosts, BLOG_CATEGORIES } from "@/data/blog-posts";
import { 
  updateMetaTags, 
  generateArticleSchema, 
  generateBreadcrumbSchema,
  injectSchema, 
  removeSchema, 
  SITE_URL 
} from "@/lib/seo";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Simple markdown-like rendering for blog content
function renderContent(content: string): JSX.Element {
  const lines = content.trim().split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let inList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 mb-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-muted-foreground">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // H1
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-3xl md:text-4xl font-bold mb-6 mt-8 first:mt-0">
          {trimmed.slice(2)}
        </h1>
      );
      return;
    }

    // H2
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-semibold mb-4 mt-8">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }

    // H3
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-semibold mb-3 mt-6">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }

    // Horizontal rule
    if (trimmed === '---') {
      flushList();
      elements.push(<hr key={index} className="my-8 border-border" />);
      return;
    }

    // List item
    if (trimmed.startsWith('- ') || trimmed.match(/^\d+\. /)) {
      inList = true;
      const content = trimmed.replace(/^[-\d.]+\s*/, '');
      listItems.push(content);
      return;
    }

    // Regular paragraph
    flushList();
    
    // Process inline formatting
    const processed = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
    
    elements.push(
      <p 
        key={index} 
        className="text-muted-foreground leading-relaxed mb-4"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  });

  flushList();

  return <>{elements}</>;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;
  const relatedPosts = post ? getRelatedPosts(post) : [];

  useEffect(() => {
    if (!post) return;

    // Update meta tags
    updateMetaTags({
      title: post.title,
      description: post.excerpt,
      type: 'article',
      keywords: post.tags,
      canonical: `${SITE_URL}/blog/${post.slug}`,
      author: post.author,
      publishedTime: post.publishedAt,
      modifiedTime: post.modifiedAt,
    });

    // Inject article schema
    injectSchema(
      generateArticleSchema({
        title: post.title,
        description: post.excerpt,
        author: post.author,
        publishedTime: post.publishedAt,
        modifiedTime: post.modifiedAt,
        url: `${SITE_URL}/blog/${post.slug}`,
      }),
      'article-schema'
    );

    // Inject breadcrumb schema
    injectSchema(
      generateBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
      ]),
      'breadcrumb-schema'
    );

    // Scroll to top
    window.scrollTo(0, 0);

    return () => {
      removeSchema('article-schema');
      removeSchema('breadcrumb-schema');
    };
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const category = BLOG_CATEGORIES.find(c => c.id === post.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/blog">
            <Button variant="ghost" size="icon" aria-label="Back to blog">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Blog</span>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Category & Meta */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-4">
            {category?.label || post.category}
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime} min read
            </span>
          </div>
        </div>

        {/* Featured image placeholder */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl h-48 md:h-64 mb-8 flex items-center justify-center">
          <span className="text-6xl opacity-50">📝</span>
        </div>

        {/* Content */}
        <div className="prose-sm md:prose max-w-none">
          {renderContent(post.content)}
        </div>

        {/* Tags */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-muted/50 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map(related => (
                <Link 
                  key={related.id} 
                  to={`/blog/${related.slug}`}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-medium mb-2 line-clamp-2">{related.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{related.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-3">Ready to Help Your Neighbourhood?</h3>
          <p className="text-muted-foreground mb-6">
            Join Swaami and connect with verified neighbours who need a hand.
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="swaami" size="lg">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} Swaami. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
