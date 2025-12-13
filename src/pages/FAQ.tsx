import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Shield, Heart, Clock, MapPin, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { updateMetaTags, generateFAQSchema, injectSchema, removeSchema, SITE_URL } from "@/lib/seo";

// Comprehensive FAQ data optimized for SEO
// These are questions people actually search for
const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: Users,
    faqs: [
      {
        question: "What is Swaami and how does it work?",
        answer: "Swaami is a free neighbourhood help app that connects you with verified neighbours who can help with quick tasks. Simply post what you need help with (like carrying groceries, tech support, or pet care), and nearby neighbours who have the skills can offer to help. All helpers are verified through phone, social accounts, and community endorsements for your safety."
      },
      {
        question: "Is Swaami free to use?",
        answer: "Yes! Swaami is completely free to start. You can browse tasks, help neighbours, and chat without any payment. Free users can post up to 3 tasks per month. For unlimited posting, you can upgrade to Swaami+ for a small monthly fee. There are no fees for helping others or receiving help."
      },
      {
        question: "How do I sign up for Swaami?",
        answer: "Signing up takes just 2 minutes. Download the app or visit swaami.app, enter your email to create an account, verify your phone number, and select your neighbourhood. You'll then choose your skills and set your availability. That's it - you're ready to help and get help from your neighbours!"
      },
      {
        question: "What areas does Swaami cover?",
        answer: "Swaami is currently focused on major Australian cities including Sydney, Melbourne, Brisbane, Perth, and Adelaide. We're expanding to new neighbourhoods regularly. The app works on a hyperlocal basis - you'll only see and be matched with people within walking distance (typically 500 metres to 2km based on your settings)."
      },
    ]
  },
  {
    category: "Safety & Trust",
    icon: Shield,
    faqs: [
      {
        question: "How does Swaami verify neighbours?",
        answer: "We use a multi-step verification process called Trust Tiers. Neighbours can verify through: email confirmation, phone verification (SMS or WhatsApp), connecting social accounts (Google or Apple), uploading photos, receiving endorsements from other verified members, and enabling two-factor authentication. The more verifications completed, the higher the trust tier."
      },
      {
        question: "Is it safe to meet strangers from an app?",
        answer: "Safety is our top priority. All users must verify their identity before helping or posting tasks. We recommend meeting in public places for first interactions, sharing your location with a trusted contact, and keeping initial tasks short. The app shows each person's trust tier, number of completed tasks, and reliability score so you can make informed decisions."
      },
      {
        question: "What happens if something goes wrong?",
        answer: "If you ever feel uncomfortable, you can leave at any time - there's no obligation to complete a task. You can report concerning behaviour directly through the app, and our team reviews all reports promptly. For emergencies, always contact local emergency services first. We also provide safety guidelines in the app before each first meeting."
      },
      {
        question: "Can I see reviews of helpers before accepting help?",
        answer: "Yes! Each user's profile shows their trust tier (verified status), total tasks completed, reliability score out of 5, and how long they've been a Swaami member. You can also see which verification steps they've completed. This transparency helps you choose who you're comfortable working with."
      },
    ]
  },
  {
    category: "Tasks & Helping",
    icon: Heart,
    faqs: [
      {
        question: "What kind of tasks can I post on Swaami?",
        answer: "Swaami is designed for quick neighbourhood favours under 45 minutes. Popular categories include: grocery pickup or carrying, tech help (phone setup, WiFi issues), pet care (dog walking, feeding), cooking assistance, garden help, language translation, transport help, and handyman tasks. We focus on small acts of kindness, not professional services."
      },
      {
        question: "How long should tasks take?",
        answer: "Tasks on Swaami are meant to be quick favours - ideally under 45 minutes. This keeps things manageable and ensures helpers can fit tasks into their day. If your need is larger, consider breaking it into smaller tasks or using a professional service. The AI will suggest an appropriate time estimate when you post."
      },
      {
        question: "Do I need to pay helpers?",
        answer: "No money changes hands on Swaami. Instead, we use a credit system to encourage reciprocity. When someone helps you, they earn credits. When you help others, you earn credits too. This creates a community where everyone both gives and receives help. You start with 5 free credits when you join."
      },
      {
        question: "What if no one responds to my task?",
        answer: "If your task doesn't get responses, try: adjusting the time to when more neighbours are available, expanding your radius slightly, making the description clearer about what's needed, or posting at peak times (usually mornings and early evenings). Tasks marked as 'urgent' also get more visibility in the feed."
      },
    ]
  },
  {
    category: "Credits & Subscriptions",
    icon: CreditCard,
    faqs: [
      {
        question: "How do credits work on Swaami?",
        answer: "Credits are Swaami's way of encouraging reciprocal help. You start with 5 credits. When you post a task and receive help, you spend 1 credit. When you help someone else, you earn 1 credit. This system ensures everyone participates in both giving and receiving, building a true community of mutual support."
      },
      {
        question: "What's the difference between free and Swaami+?",
        answer: "Free accounts can post up to 3 tasks per month, help unlimited neighbours, chat freely, and set a radius up to 500m. Swaami+ subscribers get unlimited task posting, extended radius up to 2km, priority visibility in the feed, and early access to new features. Helping others is always free and unlimited for everyone."
      },
      {
        question: "How do I upgrade to Swaami+?",
        answer: "You can upgrade to Swaami+ directly in the app. Go to your Profile, tap on your subscription status, and follow the prompts. We use Stripe for secure payment processing. You can manage your subscription or cancel anytime through the customer portal accessible from your profile settings."
      },
    ]
  },
  {
    category: "Location & Privacy",
    icon: MapPin,
    faqs: [
      {
        question: "How does the location radius work?",
        answer: "You set a radius (100m to 2km) in your profile settings. You'll only see tasks from neighbours within this distance, and your tasks will only be visible to neighbours within their radius who overlap with your location. This keeps everything hyperlocal - typically within a 5-10 minute walk."
      },
      {
        question: "Do you share my exact address?",
        answer: "Never! Your exact location is never shared with other users. When you post a task, we show only an approximate area (like 'Surry Hills' or '~300m away'). Your precise address is only shared through private chat after you've matched with a helper and feel comfortable sharing it."
      },
      {
        question: "What data does Swaami collect?",
        answer: "We collect only what's needed to provide the service: your email, phone number (for verification), approximate location (for matching), and task history. We never sell your data to third parties. Your messages are private between you and your match. You can request deletion of your data at any time through settings."
      },
    ]
  },
  {
    category: "Timing & Availability",
    icon: Clock,
    faqs: [
      {
        question: "When can I use Swaami?",
        answer: "Swaami is available 24/7, but you'll find the most active neighbours during typical waking hours. We recommend posting tasks with some advance notice when possible. You can set your availability to 'now' (ready to help immediately), 'later' (in the next few hours), or 'this week' for flexible timing."
      },
      {
        question: "How quickly do people respond?",
        answer: "Response times vary by neighbourhood activity and time of day. Urgent tasks often get responses within minutes during peak hours. For non-urgent tasks, you might wait a few hours. The more active your neighbourhood becomes, the faster everyone gets helped. You're building community with every interaction!"
      },
      {
        question: "Can I schedule tasks for a specific time?",
        answer: "Currently, tasks are posted as 'needed now' or with an urgency level. You can indicate preferred timing in your task description (e.g., 'Need help tomorrow morning'). Once matched, you can coordinate specific timing through the in-app chat with your helper."
      },
    ]
  },
];

// Flatten FAQs for schema
const allFaqs = FAQ_DATA.flatMap(category => category.faqs);

export default function FAQPage() {
  useEffect(() => {
    // Update meta tags
    updateMetaTags({
      title: "Frequently Asked Questions - Swaami Help Center",
      description: "Find answers to common questions about Swaami, the neighbourhood help app. Learn about safety, verification, credits, and how to get help from trusted neighbours near you.",
      keywords: [
        "Swaami FAQ",
        "neighborhood help app questions",
        "is Swaami safe",
        "how does Swaami work",
        "Swaami verification",
        "community help app FAQ",
        "neighbor assistance questions",
      ],
      canonical: `${SITE_URL}/faq`,
    });

    // Inject FAQ schema
    injectSchema(generateFAQSchema(allFaqs), 'faq-schema');

    return () => {
      removeSchema('faq-schema');
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
          <h1 className="text-xl font-semibold">Help Center</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about getting help from verified neighbours in your community.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {FAQ_DATA.map((category, categoryIndex) => (
          <section key={category.category} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{category.category}</h3>
            </div>
            
            <Accordion type="single" collapsible className="space-y-2">
              {category.faqs.map((faq, faqIndex) => (
                <AccordionItem 
                  key={faqIndex} 
                  value={`${categoryIndex}-${faqIndex}`}
                  className="border rounded-xl px-4 bg-card"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium pr-4">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        {/* CTA Section */}
        <section className="mt-12 p-6 bg-primary/10 rounded-2xl text-center">
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Join Swaami and ask your neighbours directly!
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="swaami" size="lg">
              Get Started Free
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-8">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors font-medium text-foreground">FAQ</Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} Swaami. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
