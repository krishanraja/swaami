# Master Development Instructions

These are the guiding principles for all development on Swaami.

## 1. Architecture Foundations

### Code Structure
```
/src
  /components    - Reusable UI components
  /hooks         - Custom React hooks
  /lib           - Utilities (logger, validation, safety)
  /pages         - Route pages
  /screens       - Main screen components
  /types         - TypeScript definitions
```

### Core Rules
- Every component pure unless there's a reason not to
- State lives in as few places as possible
- One data source of truth per feature
- All async functions return `{ data, error }` shape
- No untyped returns

## 2. Logging Standards

All operations must be logged with context:
```typescript
logger.info('Task created', { taskId, userId, category });
logger.error('Failed to send message', { error, matchId });
```

Log levels:
- `debug`: Development only, verbose
- `info`: Normal operations
- `warn`: Recoverable issues
- `error`: Failures requiring attention
- `critical`: System-level failures

## 3. Validation Requirements

All user inputs must be validated:
```typescript
const result = validateInput(taskInputSchema, input);
if (!result.success) {
  toast.error(result.error);
  return;
}
```

Never trust client data. Validate again on edge functions.

## 4. Safety Checks

Before AI processing or database writes:
```typescript
const safetyCheck = checkContentSafety(content);
if (safetyCheck.blocked) {
  return { error: safetyCheck.reason };
}
```

## 5. Error Handling

Every error must be:
1. Logged with context
2. Displayed to user (if user-facing)
3. Never swallowed silently

```typescript
try {
  // operation
} catch (error) {
  logger.exception(error, { context: 'operation_name' });
  toast.error('Friendly message');
  return { success: false, error };
}
```

## 6. Database Operations

- Always use RLS policies
- Never raw SQL from edge functions
- Use Supabase client methods
- Handle all error cases
- Return predictable shapes

## 7. UI Standards

- Use semantic tokens from design system
- Never hardcode colors
- Always responsive (mobile-first)
- Include loading and empty states
- Add animations for feedback

## 8. Testing Approach

Before marking complete:
1. Test happy path
2. Test error cases
3. Test edge cases (empty data, long text)
4. Test on mobile viewport
5. Verify logs are correct

## 9. Documentation Requirements

Every feature must have:
- Entry in FEATURES.md
- Relevant code comments
- Updated README if public API changes
- HISTORY.md entry

## 10. Security Checklist

Before any merge:
- [ ] RLS policies cover all operations
- [ ] Inputs validated
- [ ] Content safety checked
- [ ] No secrets in client code
- [ ] No PII logged
- [ ] Error messages don't leak internals

## Quick Reference

### Semantic Tokens
```css
--primary: Swaami yellow
--accent: Swaami green
--destructive: Error/urgent
--muted: Secondary text/backgrounds
```

### Common Patterns
```typescript
// Async operation
const { data, error } = await operation();
if (error) { handle(); return; }
use(data);

// Form submission
const valid = validateInput(schema, input);
if (!valid.success) return;
const safe = checkContentSafety(input);
if (safe.blocked) return;
submit(valid.data);
```

### Import Paths
```typescript
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { validateInput } from "@/lib/validation";
import { checkContentSafety } from "@/lib/safety";
```
