# Quick Setup: Stripe Secret Key

## ⚡ Quick Steps (2 minutes)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. If not logged in, sign in to your Supabase account

### Step 2: Navigate to Edge Functions Secrets
1. In the left sidebar, click **Edge Functions**
2. Click on **Secrets** tab (at the top)

### Step 3: Add the Stripe Secret Key
1. Click **"New secret"** or **"Add secret"** button
2. Fill in:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Your Stripe secret key (get it from Stripe Dashboard → Developers → API keys)
   - ⚠️ **Note**: Use your Stripe secret key (production keys start with `sk_live_`, test keys start with `sk_test_`)
3. Click **Save** or **Add**

### Step 4: Verify
The secret should now appear in your secrets list. Your Stripe integration is ready!

## ✅ What This Enables

Once set, these edge functions will work:
- ✅ `create-checkout` - Users can subscribe to Swaami+
- ✅ `check-subscription` - Check if user has active subscription
- ✅ `customer-portal` - Users can manage their subscription

## 🔒 Security Note

This key is already set in your Supabase project secrets (not in code). It's secure and won't be exposed in your repository.

## 🧪 Testing

After setting the secret:
1. Try creating a checkout session from your app
2. Check edge function logs in Supabase dashboard for any errors
3. Test with a Stripe test card if needed: `4242 4242 4242 4242`

## ❓ Troubleshooting

**"STRIPE_SECRET_KEY is not set" error:**
- Double-check the secret name is exactly `STRIPE_SECRET_KEY` (case-sensitive)
- Ensure you're in the correct Supabase project
- Try refreshing the page and checking again

**"Invalid API Key" error:**
- Verify the key format is correct (production keys start with `sk_live_`, test keys start with `sk_test_`)
- Check that the key hasn't been revoked in Stripe dashboard
- Ensure there are no extra spaces when copying

