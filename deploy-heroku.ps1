# Quick Heroku Deployment Script
# Run this in PowerShell from your project directory

Write-Host "🚀 Starting Heroku Deployment..." -ForegroundColor Green
Write-Host ""

# Step 1: Check if git is initialized
if (Test-Path .git) {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "📝 Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git initialized" -ForegroundColor Green
}

Write-Host ""

# Step 2: Stage and commit files
Write-Host "📦 Adding files to git..." -ForegroundColor Yellow
git add .

$hasChanges = git status --short
if ($hasChanges) {
    Write-Host "💾 Committing files..." -ForegroundColor Yellow
    git commit -m "Initial commit - Payment instruction parser implementation"
    Write-Host "✓ Files committed" -ForegroundColor Green
} else {
    Write-Host "✓ No changes to commit" -ForegroundColor Green
}

Write-Host ""

# Step 3: Check if Heroku remote exists
$hasHerokuRemote = git remote | Select-String "heroku"

if ($hasHerokuRemote) {
    Write-Host "✓ Heroku remote already configured" -ForegroundColor Green
} else {
    Write-Host "🌍 Creating Heroku app..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Choose an option:" -ForegroundColor Cyan
    Write-Host "1. Auto-generate app name (recommended)" -ForegroundColor White
    Write-Host "2. Choose custom app name" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1 or 2)"
    
    if ($choice -eq "2") {
        $appName = Read-Host "Enter your desired app name (lowercase, no spaces)"
        heroku create $appName
    } else {
        heroku create
    }
    
    Write-Host "✓ Heroku app created" -ForegroundColor Green
}

Write-Host ""

# Step 4: Set environment variables
Write-Host "⚙️  Setting environment variables..." -ForegroundColor Yellow
heroku config:set PORT=443
Write-Host "✓ Environment variables set" -ForegroundColor Green

Write-Host ""

# Step 5: Deploy to Heroku
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

# Try main branch first, fallback to master
$currentBranch = git branch --show-current
if ($currentBranch -eq "main" -or $currentBranch -eq "") {
    git push heroku main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        # Try master if main fails
        git checkout -b main 2>&1 | Out-Null
        git push heroku main
    }
} else {
    git push heroku ${currentBranch}:main
}

Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    
    # Get app info
    $appInfo = heroku apps:info --json | ConvertFrom-Json
    $appUrl = $appInfo.app.web_url
    $appName = $appInfo.app.name
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📱 App Name: $appName" -ForegroundColor White
    Write-Host "🌐 App URL: $appUrl" -ForegroundColor White
    Write-Host "📍 Endpoint URL: ${appUrl}payment-instructions" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📋 FOR SUBMISSION, USE THIS URL:" -ForegroundColor Green
    Write-Host "${appUrl}payment-instructions" -ForegroundColor Yellow
    Write-Host ""
    
    # Test the endpoint
    Write-Host "🧪 Testing endpoint..." -ForegroundColor Yellow
    
    try {
        $testBody = '{"accounts": [{"id": "a", "balance": 230, "currency": "USD"}, {"id": "b", "balance": 300, "currency": "USD"}], "instruction": "DEBIT 30 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'
        
        $response = Invoke-RestMethod -Uri "${appUrl}payment-instructions" -Method POST -Body $testBody -ContentType 'application/json' -ErrorAction Stop
        
        Write-Host "✅ Endpoint is working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 10
        
    } catch {
        Write-Host "⚠️  Could not test endpoint automatically" -ForegroundColor Yellow
        Write-Host "Please test manually at: ${appUrl}payment-instructions" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the endpoint URL above" -ForegroundColor White
    Write-Host "2. Push code to GitHub (make it public)" -ForegroundColor White
    Write-Host "3. Submit both URLs via the Google Form" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "❌ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "- Make sure you're logged in: heroku login" -ForegroundColor White
    Write-Host "- Check Heroku logs: heroku logs --tail" -ForegroundColor White
    Write-Host ""
}
