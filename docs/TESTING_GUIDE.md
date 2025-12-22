# Auth Testing Guide

## Overview

This document outlines testing strategies for the authentication and onboarding flows implemented in this codebase.

## Manual Testing Checklist

### 1. Anonymous User Flow

- [ ] Landing page loads without errors
- [ ] "See what neighbours need help with" button reveals preview
- [ ] Clicking "Sign up to help" on preview card redirects to auth
- [ ] Anonymous user cannot access `/app`, `/chat/*`, `/verify`, `/join`
- [ ] Anonymous user can access `/`, `/faq`, `/blog`, `/blog/*`

### 2. Sign Up Flow

- [ ] Sign up form validates email and password
- [ ] Sign up with new email shows "check your email" screen
- [ ] Verification email is sent (check Supabase logs)
- [ ] Clicking verification link in email verifies account
- [ ] After verification, user is redirected to `/join`
- [ ] Polling indicator shows "Waiting for verification..."

### 3. Sign In Flow

- [ ] Sign in with valid credentials works
- [ ] Sign in with invalid credentials shows error
- [ ] Sign in with unverified email shows appropriate error
- [ ] Already signed-in user accessing `/auth` is redirected to `/app` or `/join`
- [ ] Session expired banner shows when coming from expired session

### 4. Onboarding Flow

- [ ] `/join` page loads for authenticated but not onboarded users
- [ ] Progress is saved to localStorage between page refreshes
- [ ] City selector works and populates neighbourhoods
- [ ] Phone verification sends OTP
- [ ] OTP verification works
- [ ] Skills and preferences can be selected
- [ ] Completing onboarding redirects to `/app`

### 5. Protected Routes

- [ ] Unauthenticated user is redirected from `/app` to `/auth`
- [ ] Authenticated but not onboarded user is redirected from `/app` to `/join`
- [ ] Fully onboarded user can access `/app`, `/chat/*`, `/verify`

### 6. Session Management

- [ ] Session refresh works automatically (check Network tab)
- [ ] Session expired triggers `session_expired` state
- [ ] "Try to Reconnect" button attempts refresh
- [ ] Multi-tab sync works (sign in on tab 1, tab 2 updates)

### 7. Data Export & Account Deletion

- [ ] Export Data downloads JSON file with all user data
- [ ] JSON file contains profile, tasks, messages, verifications
- [ ] Delete Account requires typing "DELETE MY ACCOUNT"
- [ ] Delete Account anonymizes profile and signs out

## Auth Debug Panel (Development Only)

1. Press `Ctrl+Shift+D` to toggle the debug panel
2. Or click the bug icon in the bottom-right corner
3. Panel shows:
   - Current auth status
   - User info
   - Session expiry
   - Profile data
   - Route information
4. "Copy Debug Info" copies full state as JSON

## State Machine States

| State | Description | Allowed Routes |
|-------|-------------|----------------|
| `loading` | Initial state, checking session | Show loading UI |
| `anonymous` | No user session | Public routes only |
| `awaiting_verification` | Signed up, email not verified | `/auth` |
| `signed_in` | Authenticated but profile incomplete | `/join`, `/auth` |
| `needs_onboarding` | Authenticated but not onboarded | `/join`, `/auth` |
| `ready` | Fully authenticated and onboarded | All routes |
| `session_expired` | Session was valid but expired | `/auth?expired=true` |

## Edge Cases to Test

1. **Refresh mid-flow**: Refresh page during onboarding, progress should be restored
2. **Close tab and return**: Onboarding progress persists in localStorage
3. **Back button**: Should not break state, navigate naturally
4. **Switch devices**: Verification on device A, poll detects on device B
5. **Weak network**: Offline banner shows, operations retry
6. **Rate limited**: Toast shows error message
7. **Wrong password**: Toast shows "Invalid email or password"
8. **Existing account signup**: Toast shows "already registered"
9. **Verification on different device**: Polling detects verification

## Setting Up Automated Tests

To add automated testing, install Vitest:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.ts`:

```ts
/// <reference types="vitest" />
export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Example test for AuthContext:

```ts
// src/contexts/AuthContext.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuthContext } from './AuthContext'

describe('AuthContext', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })
    
    expect(result.current.authState.status).toBe('loading')
  })
  
  it('transitions to anonymous when no session', async () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.authState.status).toBe('anonymous')
    })
  })
})
```

## E2E Testing with Playwright

Install Playwright:

```bash
npm init playwright@latest
```

Example E2E test:

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('anonymous user redirected from app to auth', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/auth/)
})

test('signup shows verification screen', async ({ page }) => {
  await page.goto('/auth?mode=signup')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=Check your email')).toBeVisible()
})
```

## Monitoring in Production

1. **Structured Logging**: All auth events are logged with context
2. **Error Tracking**: Integrate Sentry or similar for production errors
3. **Analytics Events** (privacy-safe):
   - `auth_started` - User begins auth flow
   - `auth_completed` - User successfully authenticates
   - `onboarding_started` - User begins onboarding
   - `onboarding_completed` - User completes onboarding
   - `session_expired` - Session expiration detected

## Canary Checks

Add this to detect impossible states in production:

```ts
// In useEffect of main app component
if (authState.status === 'ready' && !authState.session) {
  console.error('CANARY: ready state without session')
  // Report to error tracking
  // Attempt self-heal by refreshing session
  refreshSession()
}
```


