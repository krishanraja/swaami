# Supabase Edge Functions Deployment Script
# Run this AFTER you've logged in with: npx supabase login

Write-Host "Deploying Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Function 1: create-checkout
Write-Host "[1/6] Deploying create-checkout..." -ForegroundColor Yellow
npx supabase functions deploy create-checkout
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy create-checkout" -ForegroundColor Red
    exit 1
}
Write-Host "✓ create-checkout deployed successfully" -ForegroundColor Green
Write-Host ""

# Function 2: check-subscription
Write-Host "[2/6] Deploying check-subscription..." -ForegroundColor Yellow
npx supabase functions deploy check-subscription
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy check-subscription" -ForegroundColor Red
    exit 1
}
Write-Host "✓ check-subscription deployed successfully" -ForegroundColor Green
Write-Host ""

# Function 3: send-phone-otp
Write-Host "[3/6] Deploying send-phone-otp..." -ForegroundColor Yellow
npx supabase functions deploy send-phone-otp
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy send-phone-otp" -ForegroundColor Red
    exit 1
}
Write-Host "✓ send-phone-otp deployed successfully" -ForegroundColor Green
Write-Host ""

# Function 4: manage-endorsement
Write-Host "[4/6] Deploying manage-endorsement..." -ForegroundColor Yellow
npx supabase functions deploy manage-endorsement
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy manage-endorsement" -ForegroundColor Red
    exit 1
}
Write-Host "✓ manage-endorsement deployed successfully" -ForegroundColor Green
Write-Host ""

# Function 5: seed-demo-users
Write-Host "[5/6] Deploying seed-demo-users..." -ForegroundColor Yellow
npx supabase functions deploy seed-demo-users
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy seed-demo-users" -ForegroundColor Red
    exit 1
}
Write-Host "✓ seed-demo-users deployed successfully" -ForegroundColor Green
Write-Host ""

# Function 6: customer-portal
Write-Host "[6/6] Deploying customer-portal..." -ForegroundColor Yellow
npx supabase functions deploy customer-portal
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy customer-portal" -ForegroundColor Red
    exit 1
}
Write-Host "✓ customer-portal deployed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ All 6 functions deployed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan


