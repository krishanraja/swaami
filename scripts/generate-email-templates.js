#!/usr/bin/env node

/**
 * Generate branded Swaami email templates for Supabase
 * 
 * This script generates all 5 email templates:
 * 1. Confirm signup
 * 2. Invite user
 * 3. Magic link
 * 4. Change email address
 * 5. Reset password
 * 
 * Usage: node scripts/generate-email-templates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brand configuration
const BRAND = {
  name: 'Swaami',
  tagline: 'Your neighborhood micro-help network',
  logoUrl: 'https://www.swaami.ai/images/swaami-wordmark.png',
  siteUrl: 'https://www.swaami.ai',
  colors: {
    primary: '#F5D76E',      // Swaami Yellow
    primaryDeep: '#E6C84A',  // Deep Yellow
    primaryLight: '#FDF6B6', // Light Yellow
    accent: '#D4A574',       // Warm Accent
    success: '#4ADE80',       // Success Green
    text: '#1F2937',          // Dark Gray
    textMuted: '#6B7280',     // Medium Gray
    textLight: '#9CA3AF',      // Light Gray
    background: '#FFFFFF',     // White
    backgroundLight: '#F9FAFB', // Light Gray Background
    border: '#E5E7EB',         // Border Gray
    warning: '#FEF9E7',        // Warning Background
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

// Email template base structure
function getEmailTemplate({ title, greeting, mainMessage, ctaText, ctaUrl, ctaVariable, helpText, footerNote, icon }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.colors.backgroundLight}; font-family: ${BRAND.fonts.primary};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.colors.backgroundLight};">
    <tr>    
      <td style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${BRAND.colors.background}; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, ${BRAND.colors.primaryLight} 0%, ${BRAND.colors.primary} 100%); border-radius: 12px 12px 0 0;">
              <!-- Logo -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 auto 16px;">
                <tr>
                  <td style="text-align: center; vertical-align: middle;">
                    <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="auto" height="40" style="height: 40px; width: auto; max-width: 250px; vertical-align: middle; display: inline-block; border: 0; outline: none; text-decoration: none;" />
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: ${BRAND.colors.text}; font-size: 16px; font-weight: 500; opacity: 0.9;">
                ${BRAND.tagline}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              ${icon ? `<div style="text-align: center; margin-bottom: 24px; font-size: 48px;">${icon}</div>` : ''}
              <h2 style="margin: 0 0 16px; color: ${BRAND.colors.text}; font-size: 24px; font-weight: 600; line-height: 1.3;">
                ${greeting}
              </h2>
              
              <p style="margin: 0 0 20px; color: ${BRAND.colors.textMuted}; font-size: 16px; line-height: 1.6;">
                ${mainMessage}
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 0 0 30px;">
                    <a href="${ctaVariable}" style="display: inline-block; padding: 16px 32px; background-color: ${BRAND.colors.primaryDeep}; color: ${BRAND.colors.text}; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(230, 200, 74, 0.3); transition: background-color 0.2s;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 0 0 30px; color: ${BRAND.colors.textLight}; font-size: 14px; line-height: 1.6; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <span style="color: ${BRAND.colors.primaryDeep}; word-break: break-all; font-family: monospace; font-size: 12px;">${ctaVariable}</span>
              </p>

              ${helpText ? `<!-- Info Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 20px; background-color: ${BRAND.colors.warning}; border-radius: 8px; border-left: 4px solid ${BRAND.colors.primaryDeep};">
                    <p style="margin: 0; color: ${BRAND.colors.text}; font-size: 14px; line-height: 1.6;">
                      ${helpText}
                    </p>
                  </td>
                </tr>
              </table>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: ${BRAND.colors.backgroundLight}; border-radius: 0 0 12px 12px; border-top: 1px solid ${BRAND.colors.border};">
              ${footerNote ? `<p style="margin: 0 0 12px; color: ${BRAND.colors.textMuted}; font-size: 14px; line-height: 1.6;">
                <strong>Link not working?</strong><br>
                ${footerNote}
              </p>` : ''}
              
              <p style="margin: 20px 0 0; color: ${BRAND.colors.textLight}; font-size: 12px; line-height: 1.6; text-align: center;">
                ${footerNote ? 'This link will expire in 1 hour for security reasons.<br>' : ''}
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Bottom Spacer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; color: ${BRAND.colors.textLight}; font-size: 12px; line-height: 1.6;">
                © ${new Date().getFullYear()} ${BRAND.name}. Building stronger neighborhoods, one task at a time.
              </p>
            </td>
          </tr>
        </table>

        <!-- Support Info -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: ${BRAND.colors.textLight}; font-size: 12px; line-height: 1.6;">
                Need help? Reply to this email or visit <a href="${BRAND.siteUrl}" style="color: ${BRAND.colors.primaryDeep}; text-decoration: none;">${BRAND.siteUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Template definitions
const templates = {
  'confirm-signup': {
    title: 'Verify your Swaami account',
    greeting: 'Welcome to Swaami! 👋',
    mainMessage: `Thanks for joining Swaami! We're excited to have you as part of our community of neighbors helping neighbors.<br><br>To get started, please verify your email address by clicking the button below. This helps us keep Swaami safe and secure for everyone.`,
    ctaText: 'Verify Email Address',
    ctaVariable: '{{ .ConfirmationURL }}',
    helpText: '<strong>💡 Why verify?</strong><br>Email verification helps us ensure that everyone on Swaami is a real neighbor. This keeps our community safe and builds trust between members.',
    footerNote: 'If the button doesn\'t work, the link may have expired. You can request a new verification email from the Swaami app.',
    icon: '✨',
  },
  'invite-user': {
    title: 'You\'re invited to join Swaami',
    greeting: 'You\'ve been invited! 🎉',
    mainMessage: `Someone in your neighborhood thinks you'd be a great addition to Swaami! We're a community where neighbors help each other with quick tasks - everything from borrowing tools to walking dogs.<br><br>Click the button below to accept your invitation and join your local neighborhood network.`,
    ctaText: 'Accept Invitation & Join',
    ctaVariable: '{{ .ConfirmationURL }}',
    helpText: '<strong>🤝 What is Swaami?</strong><br>Swaami connects neighbors within walking distance to help each other with micro-tasks (under 45 minutes). It\'s free, safe, and builds real community connections.',
    footerNote: 'If the button doesn\'t work, you can copy the link above and paste it into your browser.',
    icon: '🏘️',
  },
  'magic-link': {
    title: 'Sign in to Swaami',
    greeting: 'Your sign-in link is here! 🔗',
    mainMessage: `Click the button below to sign in to your Swaami account. This link will work for 1 hour and can only be used once.<br><br>No password needed - just click and you're in!`,
    ctaText: 'Sign In to Swaami',
    ctaVariable: '{{ .ConfirmationURL }}',
    helpText: '<strong>🔒 Security tip</strong><br>If you didn\'t request this sign-in link, you can safely ignore this email. Your account remains secure.',
    footerNote: 'If the button doesn\'t work, copy the link above and paste it into your browser.',
    icon: '✨',
  },
  'change-email-address': {
    title: 'Verify your new email address',
    greeting: 'Almost there! 📧',
    mainMessage: `You've requested to change your email address on Swaami. To complete this change, please verify your new email address by clicking the button below.<br><br>Once verified, your account will be updated and you'll use this new email to sign in.`,
    ctaText: 'Verify New Email',
    ctaVariable: '{{ .ConfirmationURL }}',
    helpText: '<strong>⚠️ Important</strong><br>If you didn\'t request this email change, please contact us immediately. Your account security is important to us.',
    footerNote: 'If the button doesn\'t work, copy the link above and paste it into your browser.',
    icon: '✉️',
  },
  'reset-password': {
    title: 'Reset your Swaami password',
    greeting: 'Reset your password 🔑',
    mainMessage: `We received a request to reset your password. No worries - it happens to the best of us!<br><br>Click the button below to create a new password. This link will expire in 1 hour for security.`,
    ctaText: 'Reset Password',
    ctaVariable: '{{ .ConfirmationURL }}',
    helpText: '<strong>🔒 Didn\'t request this?</strong><br>If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.',
    footerNote: 'If the button doesn\'t work, copy the link above and paste it into your browser.',
    icon: '🔐',
  },
};

// Generate templates
const outputDir = path.join(__dirname, '..', 'supabase', 'email-templates');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generating Swaami email templates...\n');

Object.entries(templates).forEach(([name, config]) => {
  const html = getEmailTemplate(config);
  const filePath = path.join(outputDir, `${name}.html`);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Generated: ${name}.html`);
});

console.log(`\n✨ All templates generated successfully!`);
console.log(`\n📁 Templates saved to: ${outputDir}`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Review the templates in ${outputDir}`);
console.log(`   2. Copy each template into Supabase Dashboard → Authentication → Email Templates`);
console.log(`   3. Make sure your logo is accessible at: ${BRAND.logoUrl}`);
console.log(`   4. Test by sending test emails from Supabase\n`);
