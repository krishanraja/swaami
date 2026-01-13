import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, UserCheck, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { updateMetaTags, generateBreadcrumbSchema, injectSchema, removeSchema, SITE_URL } from "@/lib/seo";

const PRIVACY_SECTIONS = [
  {
    category: "Information We Collect",
    icon: Database,
    items: [
      {
        title: "Account Information",
        content: "When you create a Swaami account, we collect your email address, phone number, and profile information including your name, photo, and location. Your phone number is used solely for verification and security purposes. Your approximate location (suburb/neighbourhood) helps us connect you with nearby neighbours, but your exact address is never shared publicly."
      },
      {
        title: "Task and Activity Data",
        content: "We collect information about the tasks you post, offers you make to help, completed tasks, credits earned and spent, and your reliability score. This data helps us match you with appropriate helpers and maintain the quality of our community."
      },
      {
        title: "Communication Data",
        content: "Messages sent through the Swaami app are stored to facilitate communication between matched users. We do not read your messages unless required for safety investigations or legal compliance. Your messages are private between you and your matched neighbour."
      },
      {
        title: "Device and Usage Information",
        content: "We automatically collect device information (type, operating system, unique identifiers), usage data (features used, time spent, actions taken), and location data (when you grant permission). This helps us improve the app experience and provide location-based matching."
      },
    ]
  },
  {
    category: "How We Use Your Information",
    icon: Eye,
    items: [
      {
        title: "Providing Core Services",
        content: "We use your information to match you with nearby neighbours for tasks, facilitate communication through in-app chat, process verification and build trust tiers, manage credits and subscriptions, and ensure safety through identity verification."
      },
      {
        title: "Safety and Security",
        content: "Your data helps us verify user identities, detect and prevent fraud or abuse, investigate reports of concerning behaviour, and maintain community safety standards. We take safety seriously and may review activity when reports are made."
      },
      {
        title: "Product Improvement",
        content: "We analyze aggregated, anonymized usage data to improve features, understand how people use Swaami, identify bugs and technical issues, and develop new features that serve our community better. Individual user activity is never sold to third parties."
      },
      {
        title: "Communication with You",
        content: "We'll send you notifications about task matches, messages from neighbours, important account updates and security alerts, and tips for getting the most from Swaami. You can control notification preferences in your settings."
      },
    ]
  },
  {
    category: "Information Sharing and Disclosure",
    icon: Globe,
    items: [
      {
        title: "With Other Users",
        content: "When you post a task or offer to help, other users can see your profile name and photo, general location (suburb, approximate distance), trust tier and verification status, completed task count and reliability score. Your exact address, phone number, and email are never shared publicly."
      },
      {
        title: "With Service Providers",
        content: "We work with trusted service providers who help us operate Swaami: Supabase (database and authentication), Stripe (payment processing for subscriptions), Google/Apple (authentication services), and Cloudflare (security and performance). These providers access only the data necessary to perform their functions and are bound by confidentiality agreements."
      },
      {
        title: "For Legal Reasons",
        content: "We may disclose your information if required by law, in response to valid legal requests (subpoenas, court orders), to protect rights and safety of users, to investigate fraud or security issues, or in connection with business transfers (mergers, acquisitions)."
      },
      {
        title: "What We Never Do",
        content: "We never sell your personal information to third parties, share your exact location without your consent, or read your private messages except when investigating safety reports. We never use your data for advertising to third parties or share contact information with marketers."
      },
    ]
  },
  {
    category: "Data Security and Retention",
    icon: Lock,
    items: [
      {
        title: "Security Measures",
        content: "We protect your data through encryption in transit (HTTPS/TLS) and at rest, secure authentication with industry-standard practices, regular security audits and updates, access controls limiting who can view data, and secure cloud infrastructure with Supabase and Cloudflare."
      },
      {
        title: "Data Retention",
        content: "We retain your account data while your account is active, task history for up to 2 years after completion, messages for 1 year after the conversation, and verification data while your account exists. Deleted accounts are permanently removed within 30 days, though some information may be retained longer for legal compliance."
      },
      {
        title: "Your Data Rights",
        content: "You can access your personal data through your profile and settings, export your data by contacting support, correct inaccurate information in your profile, delete your account and associated data at any time, and object to certain processing activities. To exercise these rights, visit your account settings or contact privacy@swaami.ai."
      },
    ]
  },
  {
    category: "Your Privacy Choices",
    icon: UserCheck,
    items: [
      {
        title: "Location Controls",
        content: "You control your location sharing through device permissions, can adjust your matching radius (100m to 2km), and decide when to share your exact address with matched helpers. You can disable location services entirely, though this will limit Swaami's functionality."
      },
      {
        title: "Notification Preferences",
        content: "Customize which notifications you receive in Settings: task matches, new messages, credit updates, community updates, and marketing communications. You can opt out of non-essential notifications at any time."
      },
      {
        title: "Profile Visibility",
        content: "Control what others see by managing your profile photo, bio, and skills, setting your availability status (active, away, offline), and choosing which verification badges to display. Your trust tier and task count are always visible for community safety."
      },
      {
        title: "Account Deletion",
        content: "You can permanently delete your Swaami account at any time through Settings > Account > Delete Account. This will remove your profile, task history, messages, and personal information within 30 days. Some information may be retained for legal or safety purposes."
      },
    ]
  },
  {
    category: "Children's Privacy",
    icon: Shield,
    items: [
      {
        title: "Age Requirements",
        content: "Swaami is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child under 18, please contact us immediately at privacy@swaami.ai, and we will take steps to delete that information."
      },
      {
        title: "Parental Responsibility",
        content: "Parents and guardians are responsible for monitoring their children's internet usage. If a minor has created an account, we encourage parents to contact us for account removal."
      },
    ]
  },
];

export default function PrivacyPage() {
  useEffect(() => {
    // Update meta tags
    updateMetaTags({
      title: "Privacy Policy - Swaami",
      description: "Read Swaami's privacy policy to understand how we collect, use, and protect your personal information. Learn about your data rights and our commitment to your privacy.",
      keywords: [
        "Swaami privacy policy",
        "data protection",
        "privacy rights",
        "personal information",
        "data security",
        "user privacy",
        "neighbourhood app privacy",
      ],
      canonical: `${SITE_URL}/privacy`,
    });

    // Inject breadcrumb schema
    injectSchema(
      generateBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Privacy Policy', url: `${SITE_URL}/privacy` },
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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Privacy Policy
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your privacy matters to us. Learn how we collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: January 13, 2026
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-10 prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Swaami's Privacy Policy. This policy describes how Swaami ("we," "our," or "us") collects,
            uses, and shares your personal information when you use our neighbourhood help application and website
            (collectively, the "Services"). By using Swaami, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </section>

        {/* Privacy Sections */}
        {PRIVACY_SECTIONS.map((section, sectionIndex) => (
          <section key={section.category} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <section.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{section.category}</h3>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <AccordionItem
                  key={itemIndex}
                  value={`${sectionIndex}-${itemIndex}`}
                  className="border rounded-xl px-4 bg-card"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium pr-4">{item.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        {/* Contact Section */}
        <section className="mt-12 p-6 bg-primary/10 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">Questions About Privacy?</h3>
          <p className="text-muted-foreground mb-4">
            If you have any questions about this Privacy Policy or how we handle your data, please contact us:
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Email:</strong> privacy@swaami.ai</p>
            <p><strong>Website:</strong> www.swaami.ai</p>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="mt-8 p-6 border border-border rounded-xl bg-card">
          <h3 className="text-lg font-semibold mb-2">Changes to This Policy</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal,
            operational, or regulatory reasons. We will notify you of any material changes by posting the new policy
            on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            Your continued use of Swaami after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-8">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors font-medium text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} Swaami. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
