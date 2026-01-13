import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, UserCheck, AlertTriangle, Scale, CreditCard, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { updateMetaTags, generateBreadcrumbSchema, injectSchema, removeSchema, SITE_URL } from "@/lib/seo";

const TERMS_SECTIONS = [
  {
    category: "Acceptance of Terms",
    icon: FileText,
    items: [
      {
        title: "Agreement to Terms",
        content: "By accessing or using Swaami's services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services. These terms constitute a legally binding agreement between you and Swaami."
      },
      {
        title: "Eligibility",
        content: "You must be at least 18 years old to use Swaami. By creating an account, you represent and warrant that you are of legal age and have the legal capacity to enter into these terms. Users under 18 are strictly prohibited from using the service."
      },
      {
        title: "Changes to Terms",
        content: "We reserve the right to modify these terms at any time. We will notify users of material changes via email or in-app notification. Your continued use of Swaami after changes are posted constitutes acceptance of the modified terms. We encourage you to review these terms periodically."
      },
    ]
  },
  {
    category: "Account Responsibilities",
    icon: UserCheck,
    items: [
      {
        title: "Account Creation",
        content: "You must provide accurate, current, and complete information when creating your account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized access or security breach."
      },
      {
        title: "Identity Verification",
        content: "To maintain community safety, you agree to complete identity verification steps including phone verification, email confirmation, and optionally connecting social accounts. Providing false information or attempting to impersonate others is strictly prohibited and may result in immediate account termination."
      },
      {
        title: "Account Security",
        content: "You are solely responsible for safeguarding your password and account access. Do not share your account with others. Swaami will never ask for your password via email or phone. You agree to notify us immediately of any suspicious activity or unauthorized access to your account."
      },
      {
        title: "One Account Per Person",
        content: "Each person may only maintain one Swaami account. Creating multiple accounts to circumvent restrictions, manipulate ratings, or abuse the credit system is prohibited and will result in termination of all associated accounts."
      },
    ]
  },
  {
    category: "Use of Services",
    icon: Scale,
    items: [
      {
        title: "Permitted Use",
        content: "Swaami is designed for neighbours to help each other with quick, casual tasks. You may use Swaami to post requests for help with everyday tasks (under 45 minutes), offer assistance to neighbours, communicate with matched users, earn and spend credits through helping. Use must be personal and non-commercial."
      },
      {
        title: "Prohibited Activities",
        content: "You may not use Swaami to: offer or solicit professional services for payment outside the app; post tasks involving illegal activities, weapons, drugs, or adult services; harass, abuse, or threaten other users; spam or send unsolicited commercial messages; attempt to bypass verification or security measures; scrape or collect user data; impersonate others or provide false information; discriminate based on protected characteristics; or use the service for any commercial or business purposes."
      },
      {
        title: "Task Guidelines",
        content: "Tasks should be casual neighbourhood favours under 45 minutes. Tasks must not involve dangerous activities, professional services requiring licenses, commercial purposes, or anything illegal or harmful. We reserve the right to remove tasks that violate these guidelines without notice."
      },
      {
        title: "Communication Standards",
        content: "All communication must be respectful and appropriate. Harassment, hate speech, threats, sexual content, or discriminatory language is strictly prohibited. Messages are private but may be reviewed if reports are made. Violators will be removed from the platform."
      },
    ]
  },
  {
    category: "Credits and Subscriptions",
    icon: CreditCard,
    items: [
      {
        title: "Credit System",
        content: "Swaami uses a credit-based system to facilitate reciprocal helping. You receive 5 credits upon signup. Posting tasks costs 1 credit; helping others earns 1 credit. Credits have no monetary value and cannot be transferred, sold, or redeemed for cash. Credits cannot be refunded once spent."
      },
      {
        title: "Swaami+ Subscription",
        content: "Swaami+ is an optional paid subscription offering additional features including unlimited task posting, extended radius, and priority visibility. Subscriptions are billed monthly or annually via Stripe. You can manage or cancel your subscription at any time through your account settings."
      },
      {
        title: "Billing and Refunds",
        content: "Subscription fees are charged at the start of each billing cycle. If you cancel, you'll have access until the end of your current billing period. We do not provide refunds for partial months. Prices may change with 30 days' notice."
      },
      {
        title: "Free Tier Limitations",
        content: "Free accounts are limited to 3 task posts per month. Helping others is always unlimited and free. If you exceed your task limit, you'll need to upgrade to Swaami+ or wait until the next month."
      },
    ]
  },
  {
    category: "Safety and Liability",
    icon: AlertTriangle,
    items: [
      {
        title: "Independent Relationships",
        content: "Swaami is a platform that connects neighbours. We do not employ helpers nor control the tasks performed. All interactions and tasks are independent arrangements between users. Swaami is not a party to these arrangements and has no control over the quality, safety, or legality of tasks, the ability of helpers to perform tasks, or the ability of task posters to pay (via credits)."
      },
      {
        title: "User Responsibility",
        content: "You are solely responsible for your interactions with other users. Exercise caution and common sense when meeting others. Meet in public places for first interactions, share your location with a trusted contact, verify the person's identity and trust tier, and never share financial or sensitive personal information."
      },
      {
        title: "Limitation of Liability",
        content: "TO THE FULLEST EXTENT PERMITTED BY LAW, SWAAMI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE SERVICES; (B) ANY CONDUCT OR CONTENT OF OTHER USERS; (C) ANY TASKS ARRANGED THROUGH THE PLATFORM; OR (D) UNAUTHORIZED ACCESS TO YOUR ACCOUNT."
      },
      {
        title: "Disclaimer of Warranties",
        content: "SWAAMI IS PROVIDED 'AS IS' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT WARRANT THE RELIABILITY, QUALITY, OR SAFETY OF ANY USERS, TASKS, OR CONTENT. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK."
      },
      {
        title: "Insurance and Protection",
        content: "Swaami does not provide insurance for tasks or interactions between users. You are responsible for obtaining any necessary insurance coverage. We strongly recommend users have appropriate personal liability insurance."
      },
    ]
  },
  {
    category: "Termination and Suspension",
    icon: Ban,
    items: [
      {
        title: "Termination by You",
        content: "You may delete your account at any time through Settings > Account > Delete Account. Upon deletion, your profile, task history, and messages will be permanently removed within 30 days. Some information may be retained for legal or safety purposes. Unused credits are forfeited upon account deletion."
      },
      {
        title: "Termination by Swaami",
        content: "We reserve the right to suspend or terminate your account at any time for: violation of these terms, fraudulent activity, harassment or abusive behavior, safety concerns, creating multiple accounts, or any conduct we deem harmful to the community. We may terminate accounts without notice for serious violations."
      },
      {
        title: "Effect of Termination",
        content: "Upon termination, you lose access to your account, all credits are forfeited, active subscriptions are cancelled (no refunds for partial periods), and your data will be deleted according to our Privacy Policy. Some information may be retained for legal compliance."
      },
      {
        title: "Appeals",
        content: "If your account is terminated, you may appeal by contacting support@swaami.ai with details. We will review appeals on a case-by-case basis but reserve final discretion on account status."
      },
    ]
  },
  {
    category: "Intellectual Property",
    icon: FileText,
    items: [
      {
        title: "Swaami's Rights",
        content: "All content, features, and functionality of Swaami (including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software) are owned by Swaami and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws."
      },
      {
        title: "User Content",
        content: "You retain ownership of content you post (tasks, messages, profile information). By posting content, you grant Swaami a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content for operating and promoting the service. This license ends when you delete your content or account."
      },
      {
        title: "License to Use Swaami",
        content: "Subject to these terms, Swaami grants you a limited, non-exclusive, non-transferable, revocable license to access and use the services for personal, non-commercial purposes. This license does not permit you to copy, modify, distribute, sell, or lease any part of our services."
      },
      {
        title: "Feedback",
        content: "If you provide feedback, suggestions, or ideas about Swaami, you grant us the right to use that feedback without compensation or obligation to you. We appreciate user input to help improve the service."
      },
    ]
  },
];

export default function TermsPage() {
  useEffect(() => {
    // Update meta tags
    updateMetaTags({
      title: "Terms of Service - Swaami",
      description: "Read Swaami's Terms of Service to understand the rules and guidelines for using our neighbourhood help platform. Learn about your rights and responsibilities as a user.",
      keywords: [
        "Swaami terms of service",
        "user agreement",
        "terms and conditions",
        "service rules",
        "user guidelines",
        "community standards",
      ],
      canonical: `${SITE_URL}/terms`,
    });

    // Inject breadcrumb schema
    injectSchema(
      generateBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Terms of Service', url: `${SITE_URL}/terms` },
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
          <h1 className="text-xl font-semibold">Terms of Service</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Terms of Service
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Please read these terms carefully before using Swaami. They govern your use of our services.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: January 13, 2026
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-10 prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Swaami. These Terms of Service ("Terms") govern your access to and use of Swaami's
            neighbourhood help platform, including our website, mobile applications, and related services
            (collectively, the "Services"). By using Swaami, you enter into a binding legal agreement with us
            and agree to comply with these Terms and all applicable laws.
          </p>
        </section>

        {/* Terms Sections */}
        {TERMS_SECTIONS.map((section, sectionIndex) => (
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

        {/* Additional Terms */}
        <section className="mt-12 space-y-6">
          <div className="p-6 border border-border rounded-xl bg-card">
            <h3 className="text-lg font-semibold mb-2">Dispute Resolution</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Any disputes arising out of or relating to these Terms or the Services shall be resolved through
              binding arbitration in accordance with the laws of the jurisdiction where Swaami operates, rather
              than in court. You and Swaami agree to waive the right to a trial by jury and to participate in
              class actions.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl bg-card">
            <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of Australia,
              without regard to its conflict of law provisions. Our failure to enforce any right or provision
              of these Terms will not be considered a waiver of those rights.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl bg-card">
            <h3 className="text-lg font-semibold mb-2">Severability</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If any provision of these Terms is held to be invalid or unenforceable, that provision will be
              limited or eliminated to the minimum extent necessary, and the remaining provisions will remain
              in full force and effect.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 p-6 bg-primary/10 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">Questions About These Terms?</h3>
          <p className="text-muted-foreground mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Email:</strong> support@swaami.ai</p>
            <p><strong>Website:</strong> www.swaami.ai</p>
          </div>
        </section>

        {/* Acknowledgment */}
        <section className="mt-8 p-6 border border-border rounded-xl bg-card">
          <h3 className="text-lg font-semibold mb-2">Acknowledgment</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            BY USING SWAAMI, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM,
            AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE OUR SERVICES.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-8">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors font-medium text-foreground">Terms</Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} Swaami. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
