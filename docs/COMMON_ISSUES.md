# Common Issues & Troubleshooting

## Authentication Issues

### "User not found" after signup
**Cause**: Profile not created automatically
**Solution**: Check that the `handle_new_user` trigger is active on `auth.users`

### Session not persisting
**Cause**: localStorage blocked or cleared
**Solution**: Check browser privacy settings, ensure localStorage is available

### Redirect loop on /auth
**Cause**: User authenticated but profile missing
**Solution**: Check profiles table for orphaned user_ids

---

## Database Issues

### "violates row-level security policy"
**Cause**: RLS policy not matching user's auth state
**Debug Steps**:
1. Check that user is authenticated: `supabase.auth.getUser()`
2. Verify profile exists for user_id
3. Check policy conditions match the operation

### Empty feed despite tasks existing
**Cause**: Could be:
- RLS policy blocking access
- Supabase default 1000 row limit
- Realtime subscription not active

**Solution**: Check console for errors, verify RLS policies

### Messages not appearing in real-time
**Cause**: Realtime subscription not set up or table not enabled
**Solution**: Verify `messages` table is added to `supabase_realtime` publication

---

## Edge Function Issues

### "LOVABLE_API_KEY is not configured"
**Cause**: Secret not available in edge function environment
**Solution**: This should be auto-configured. If persists, contact support.

### AI rewrite returns fallback
**Cause**: 
- Rate limit exceeded (429)
- Credits exhausted (402)
- AI gateway error

**Debug Steps**:
1. Check edge function logs
2. Look for specific HTTP status codes
3. Verify API key is valid

### CORS errors calling edge functions
**Cause**: Missing CORS headers in edge function
**Solution**: Ensure corsHeaders are returned for all responses including OPTIONS

---

## UI Issues

### Logo appears distorted
**Cause**: Aspect ratio not preserved
**Solution**: Always use `w-auto` with fixed height: `className="h-16 w-auto"`

### Animations not playing
**Cause**: `animate-*` classes not in CSS
**Solution**: Check index.css for keyframe definitions

### Bottom nav overlapping content
**Cause**: Missing bottom padding on main content
**Solution**: Add `pb-24` to main container

---

## Performance Issues

### Slow initial load
**Cause**: Large bundle, unoptimized images
**Solutions**:
- Enable code splitting
- Lazy load routes
- Optimize image assets

### Frequent re-renders
**Cause**: State updates in parent affecting children
**Solution**: Memoize components, use React.memo for pure components

---

## Debugging Checklist

1. **Check Console**: Look for errors, warnings
2. **Check Network Tab**: API calls, response status
3. **Check React DevTools**: Component state, props
4. **Check Supabase Logs**: Edge function logs, DB logs
5. **Verify Auth State**: Is user authenticated?
6. **Verify RLS**: Do policies allow the operation?
7. **Check Realtime**: Is subscription active?

## Network Issues

### App appears frozen or unresponsive
**Cause**: Network disconnection
**Solution**: The app now shows an OfflineBanner when offline. Wait for connection to restore.

### Data not syncing
**Cause**: Real-time subscription interrupted
**Solution**: Refresh the page. Check the OfflineBanner for network status.

---

## Accessibility Issues

### Text-to-speech not working
**Cause**: Browser doesn't support Web Speech API
**Solution**: Use Chrome, Safari, or Edge. Firefox has limited support.

### Large text mode not applying
**Cause**: localStorage blocked
**Solution**: Check browser privacy settings, allow localStorage

---

## Getting Help

1. Check this document first
2. Search existing issues in project
3. Enable verbose logging with `logger.debug()`
4. Capture full error context before reporting
5. Check the browser console for detailed error messages
