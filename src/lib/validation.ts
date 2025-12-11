/**
 * Input validation schemas using Zod
 * All user inputs should be validated before processing
 */

import { z } from 'zod';

// Task/Need validation
export const taskInputSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, 'Please describe your need in at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional(),
  original_description: z.string().trim().max(500).optional(),
  time_estimate: z.string().max(50).optional(),
  category: z.enum([
    'groceries', 'tech', 'transport', 'cooking', 'pets',
    'handyman', 'childcare', 'language', 'medical', 'garden', 'other'
  ]).optional(),
  urgency: z.enum(['urgent', 'normal', 'flexible']).optional(),
});

// Message validation
export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
});

// Profile validation
export const profileUpdateSchema = z.object({
  display_name: z.string().trim().min(2).max(50).optional(),
  radius: z.number().min(100).max(2000).optional(),
  availability: z.enum(['now', 'later', 'this-week']).optional(),
  skills: z.array(z.string()).max(10).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
});

// Phone validation for onboarding
export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15)
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');

// OTP validation
export const otpSchema = z
  .string()
  .length(4, 'OTP must be exactly 4 digits')
  .regex(/^[0-9]+$/, 'OTP must contain only numbers');

// Validation helpers
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Validation failed' };
}

// Sanitize text input (remove potential XSS)
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Get character count with limit indicator
export function getCharacterCount(text: string, limit: number): {
  count: number;
  remaining: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
} {
  const count = text.length;
  const remaining = limit - count;
  return {
    count,
    remaining,
    isNearLimit: remaining <= limit * 0.1,
    isOverLimit: remaining < 0,
  };
}
