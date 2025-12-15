# Email Verification Setup Guide

## Overview

Swaami uses Supabase Auth for email verification. This guide explains how to set up a beautiful, branded email verification template in your Supabase dashboard.

## Quick Setup (5 minutes)

### Step 1: Access Supabase Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs)
2. Navigate to **Authentication** → **Email Templates** in the left sidebar
3. You'll see several email template types

### Step 2: Configure "Confirm signup" Template

1. Click on **"Confirm signup"** template
2. This is the email sent when users sign up and need to verify their email
3. Copy the HTML template from `supabase/email-templates/confirm-signup.html`
4. **IMPORTANT**: Before pasting, replace the GitHub placeholders:
   - `YOUR_GITHUB_USERNAME` → Your GitHub username/org
   - `YOUR_REPO_NAME` → Your repository name
   - `YOUR_BRANCH` → Your branch (usually `main`)
5. Paste it into the Supabase email template editor
6. Click **Save**

### Step 3: Configure Email Settings

1. Still in **Authentication** → **Email Templates**
2. Scroll down to **Email Settings**
3. Ensure these settings are configured:
   - **Enable email confirmations**: ✅ Enabled (recommended)
   - **Secure email change**: ✅ Enabled
   - **Double confirm email changes**: ✅ Enabled (recommended)

### Step 4: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: Your production domain (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `https://yourdomain.com/join`
   - `https://yourdomain.com/auth`
   - `http://localhost:5173/join` (for local development)
   - `http://localhost:5173/auth` (for local development)

### Step 5: Add Your Logo (Required)

**Before testing, you must add your logo URL. The template uses GitHub raw URLs by default:**

1. **Option A - Use GitHub Raw URL** (Easiest if repo is public):
   - In the email template, find: `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/YOUR_BRANCH`
   - Replace with your actual:
     - `YOUR_GITHUB_USERNAME` → Your GitHub username or organization
     - `YOUR_REPO_NAME` → Your repository name (e.g., `swaami`)
     - `YOUR_BRANCH` → Your branch name (usually `main` or `master`)
   - Example: `https://raw.githubusercontent.com/username/swaami/main/src/assets/swaami-icon.png`
   - ✅ **This works automatically if your GitHub repo is public!**

2. **Option B - Use Supabase Storage** (If repo is private):
   - Go to Supabase Dashboard → Storage
   - Create a public bucket (or use existing)
   - Upload `src/assets/swaami-icon.png`
   - Copy the public URL
   - Replace the entire GitHub URL in the template with the Supabase URL

3. **Option C - Use Your Domain**:
   - Upload `src/assets/swaami-icon.png` to your public folder
   - Use URL like: `https://yourdomain.com/images/swaami-icon.png`
   - Replace the GitHub URL in the template

### Step 6: Test the Email

1. Sign up with a test email address
2. Check your inbox for the verification email
3. Verify the logo appears correctly at the top
4. Click the verification link
5. You should be redirected to `/join` and logged in

**⚠️ Important Notes about Supabase Preview:**

- **Images may not show in preview**: The Supabase email template preview often blocks external images (like GitHub URLs) for security. The images **will work** in actual emails sent to users.
- **Template variables show as text in preview**: Variables like `{{ .ConfirmationURL }}` will appear as literal text in the preview, but will be replaced with actual URLs when emails are sent.
- **To verify everything works**: Send a test email to yourself and check it in your email client (Gmail, Outlook, etc.). The preview is just for layout checking.

## Email Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The verification link (required)
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Verification token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after verification

## Customization

### Brand Colors

The email template uses Swaami's brand colors:
- **Primary Yellow**: `#F5D76E` (warm yellow - HSL 48, 85%, 75%)
- **Accent Yellow**: `#E6C84A` (deeper yellow - HSL 54, 80%, 55%)
- **Background**: `#F9FAFB` (light gray)
- **Text**: `#1F2937` (dark gray)

To customize, edit the template file and update the color values.

### Logo Setup (IMPORTANT)

The email template uses a GitHub raw URL to load your logo directly from your repository. **You must update the placeholder values:**

1. **If your GitHub repo is public** (Recommended):
   - In the email template, find: `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/YOUR_BRANCH`
   - Replace with your actual values:
     - `YOUR_GITHUB_USERNAME` → Your GitHub username or organization name
     - `YOUR_REPO_NAME` → Your repository name
     - `YOUR_BRANCH` → Your default branch (usually `main` or `master`)
   - Example: `https://raw.githubusercontent.com/username/swaami/main/src/assets/swaami-icon.png`
   - ✅ **No file hosting needed - GitHub serves it directly!**

2. **If your GitHub repo is private**:
   - You'll need to host the logo elsewhere:
     - **Supabase Storage**: Upload to a public bucket and use that URL
     - **Your domain**: Upload to your public folder
     - **CDN**: Use Cloudflare, AWS S3, etc.
   - Replace the entire GitHub URL in the template

3. **Recommended logo dimensions**:
   - Height: 64px (width auto)
   - Format: PNG with transparent background
   - File size: Keep under 50KB for fast email loading

### Email Content

Edit the text in the template to match your brand voice. The current template:
- Welcomes users warmly
- Explains why verification is needed
- Provides clear call-to-action
- Includes helpful troubleshooting tips

## Troubleshooting

### Template Variables Showing as Literal Text

**Issue**: Variables like `{{ .ConfirmationURL }}` appear as literal text in emails instead of being replaced.

**Solutions**:
1. **Check for HTML errors**: Supabase will reject templates with HTML syntax errors and fall back to default. Validate your HTML.
2. **Verify template was saved**: Make sure you clicked "Save" in the Supabase dashboard after pasting the template.
3. **Check template syntax**: Ensure all Go template variables use correct syntax: `{{ .VariableName }}` (with space after `{{` and before `}}`).
4. **Remove problematic HTML**: Some HTML features (like complex CSS) might cause issues. Try simplifying the template.
5. **Test with default template first**: Reset to Supabase's default template, then gradually add your customizations to identify what breaks it.
6. **Check Supabase logs**: Look for template processing errors in your Supabase dashboard logs.

### Verification Link Doesn't Work

**Issue**: Clicking the link shows an error or doesn't verify the email.

**Solutions**:
1. Check that your redirect URLs are properly configured in Supabase
2. Ensure the `emailRedirectTo` in your signup code matches an allowed redirect URL
3. Check browser console for errors
4. Verify the link hasn't expired (links typically expire after 1 hour)

### Email Not Received

**Issue**: User doesn't receive the verification email.

**Solutions**:
1. Check spam/junk folder
2. Verify email address is correct
3. Check Supabase logs for email delivery errors
4. Ensure email service is properly configured in Supabase
5. Try resending the verification email (add "Resend" button in your app)

### Link Expired

**Issue**: User clicks link but it says "expired" or "invalid".

**Solutions**:
1. Links expire after 1 hour by default
2. Add a "Resend verification email" feature in your app
3. Or configure longer expiration in Supabase (not recommended for security)

## Resending Verification Emails

To allow users to resend verification emails, you can add this to your Auth page:

```typescript
const resendVerification = async () => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });
  if (error) {
    toast.error(error.message);
  } else {
    toast.success("Verification email resent!");
  }
};
```

## Security Best Practices

1. ✅ **Always verify emails** - Don't disable email confirmation in production
2. ✅ **Use HTTPS** - Ensure all redirect URLs use HTTPS in production
3. ✅ **Set proper expiration** - Default 1 hour is good
4. ✅ **Monitor email delivery** - Check Supabase logs regularly
5. ✅ **Handle errors gracefully** - Show clear messages to users

## Next Steps

After setting up email verification:

1. Test the full flow: Sign up → Receive email → Click link → Get redirected
2. Add email verification status to user profile
3. Consider adding a "Resend email" button for better UX
4. Monitor verification rates in Supabase analytics

## Support

If you encounter issues:
1. Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. Review Supabase dashboard logs
3. Test with a different email provider
4. Check browser console for client-side errors

