-- Allow service role to update subscriptions (for webhook/check-subscription)
CREATE POLICY "Service role can update subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (true)
WITH CHECK (true);

-- Also create subscriptions for existing users who don't have one
INSERT INTO public.user_subscriptions (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;