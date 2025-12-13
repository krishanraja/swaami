import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, getFeaturedPosts, BLOG_CATEGORIES, BlogPost } from "@/data/blog-posts";
import { updateMetaTags, generateBreadcrumbSchema, injectSchema, removeSchema, SITE_URL } from "@/lib/seo";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article className={`group ${featured ? 'col-span-full' : ''}`}>
      <Link 
        to={`/blog/${post.slug}`}
        className={`block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 ${
          featured ? 'md:flex' : ''
        }`}
      >
        {/* Image placeholder - in production, use post.image */}
        <div className={`bg-gradient-to-br from-primary/20 to-accent/20 ${
          featured ? 'md:w-2/5 h-48 md:h-auto' : 'h-40'
        }`}>
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
            📝
          </div>
        </div>
        
        <div className={`p-5 ${featured ? 'md:w-3/5 md:p-6' : ''}`}>
          {/* Category badge */}
          <Badge variant="secondary" className="mb-3 text-xs">
            {BLOG_CATEGORIES.find(c => c.id === post.category)?.label || post.category}
          </Badge>
          
          {/* Title */}
          <h3 className={`font-semibold group-hover:text-primary transition-colors mb-2 ${
            featured ? 'text-xl md:text-2xl' : 'text-lg'
          }`}>
            {post.title}
          </h3>
          
          {/* Excerpt */}
          <p className={`text-muted-foreground mb-4 line-clamp-2 ${
            featured ? 'md:line-clamp-3' : ''
          }`}>
            {post.excerpt}
          </p>
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTime} min read
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BlogPage() {
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const regularPosts = allPosts.filter(p => !p.featured);

  useEffect(() => {
    // Update meta tags
    updateMetaTags({
      title: "Swaami Blog - Community Building Tips & Neighbourhood Stories",
      description: "Discover tips for building stronger neighbourhood connections, safety guides for meeting neighbours, and inspiring community stories. Learn how to give and receive help in your local area.",
      keywords: [
        "community building blog",
        "neighbourhood tips",
        "helping neighbours",
        "community safety",
        "local volunteering",
        "neighbourhood stories",
        "community app blog",
      ],
      canonical: `${SITE_URL}/blog`,
    });

    // Inject breadcrumb schema
    injectSchema(
      generateBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
      ]),
      'breadcrumb-schema'
    );

    return () => {
      removeSchema('breadcrumb-schema');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Blog</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Building Stronger Neighbourhoods
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Tips, stories, and insights about community building, helping neighbours, 
            and creating the kind of local connections that make life better.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Blog categories">
            <Link to="/blog">
              <Badge variant="default" className="whitespace-nowrap cursor-pointer">
                All Posts
              </Badge>
            </Link>
            {BLOG_CATEGORIES.map(category => (
              <Badge 
                key={category.id} 
                variant="outline" 
                className="whitespace-nowrap cursor-pointer hover:bg-secondary"
              >
                {category.label}
              </Badge>
            ))}
          </nav>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-primary">★</span> Featured
          </h3>
          <div className="grid gap-6">
            {featuredPosts.map(post => (
              <PostCard key={post.id} post={post} featured />
            ))}
          </div>
        </section>
      )}

      {/* All Posts */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h3 className="text-lg font-semibold mb-4">Latest Articles</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {regularPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Load More (placeholder for pagination) */}
        {allPosts.length > 10 && (
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Articles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>

      {/* Newsletter CTA */}
      <section className="bg-primary/5 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-3">Join Your Neighbourhood</h3>
          <p className="text-muted-foreground mb-6">
            Ready to connect with verified neighbours who can help? 
            Join thousands of Australians building stronger communities.
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
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors font-medium text-foreground">Blog</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} Swaami. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
