/**
 * Content safety and moderation utilities
 * Blocks unsafe content patterns and provides safety features
 */

// Patterns that should be rejected immediately
const BLOCKED_PATTERNS = [
  // Drug-related
  /\b(drugs?|cocaine|heroin|meth|weed|marijuana|pills|substances?)\b/i,
  // Weapons
  /\b(gun|weapon|knife|firearm|ammunition)\b/i,
  // Adult content
  /\b(escort|massage.*special|happy ending|intimate)\b/i,
  // Suspicious delivery patterns
  /\b(package.*midnight|pickup.*cash|no questions|discreet.*delivery)\b/i,
  // Access pressures
  /\b(password|credit card|bank account|social security|ssn)\b/i,
  // Violence
  /\b(hurt|attack|revenge|stalk|spy on|follow someone)\b/i,
];

// Patterns that require caution but aren't blocked
const CAUTION_PATTERNS = [
  /\b(money|cash|payment)\b/i,
  /\b(late night|midnight|3am|4am)\b/i,
  /\b(alone|nobody home|empty house)\b/i,
  /\b(keys?|spare key|lockout)\b/i,
];

// Categories with elevated risk levels
export const CATEGORY_RISK_LEVELS: Record<string, 'low' | 'medium' | 'high'> = {
  groceries: 'low',
  tech: 'low',
  garden: 'low',
  language: 'low',
  cooking: 'low',
  pets: 'medium',
  transport: 'medium',
  handyman: 'medium',
  childcare: 'high',
  medical: 'high',
  other: 'medium',
};

export interface SafetyCheckResult {
  safe: boolean;
  blocked: boolean;
  caution: boolean;
  reason?: string;
  flags: string[];
}

/**
 * Check content for safety issues
 */
export function checkContentSafety(content: string): SafetyCheckResult {
  const flags: string[] = [];
  
  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return {
        safe: false,
        blocked: true,
        caution: false,
        reason: 'This content contains prohibited terms and cannot be posted.',
        flags: ['blocked_content'],
      };
    }
  }

  // Check caution patterns
  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(content)) {
      flags.push('requires_caution');
    }
  }

  return {
    safe: true,
    blocked: false,
    caution: flags.length > 0,
    flags,
  };
}

/**
 * Safety guidelines for in-person meetings
 */
export const SAFETY_GUIDELINES = {
  firstMeeting: [
    'Meet in a public place for first interactions',
    'Let someone know where you are going',
    'Trust your instincts - it is okay to decline',
    'Do not share personal financial information',
  ],
  general: [
    'Share your live location with a trusted contact',
    'Keep initial tasks short (under 30 minutes)',
    'Report any concerning behavior immediately',
  ],
};

/**
 * Check if this is a high-risk category that needs extra safety
 */
export function isHighRiskCategory(category: string): boolean {
  return CATEGORY_RISK_LEVELS[category] === 'high';
}

/**
 * Get safety banner message based on context
 */
export function getSafetyBanner(context: {
  isFirstMatch: boolean;
  category?: string;
}): string | null {
  if (context.isFirstMatch) {
    return "📍 Meet in a public place for your first interaction";
  }
  if (context.category && isHighRiskCategory(context.category)) {
    return '⚠️ This task type requires extra care. Share your location with someone you trust.';
  }
  return null;
}
