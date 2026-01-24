#!/bin/bash

# Deploy the seed-demo-users edge function to Supabase
# Run this after: npx supabase login

set -e  # Exit on error

echo "🚀 Deploying seed-demo-users edge function..."
echo ""

# Check if logged in
if ! npx supabase projects list &>/dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "Please run: npx supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Deploy the function
echo "📦 Deploying seed-demo-users..."
npx supabase functions deploy seed-demo-users

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ seed-demo-users deployed successfully!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Rebuild and redeploy your frontend: npm run build"
    echo "2. Test the app on mobile"
    echo "3. Check console for: [seedDemoData] messages"
    echo "4. Verify demo data appears in feed"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Check the error message above"
    exit 1
fi
