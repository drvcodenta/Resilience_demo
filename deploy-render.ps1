# 🚀 Quick GitHub Push Script for Render Deployment
# Render deploys automatically from GitHub!

Write-Host "🚀 Preparing code for Render deployment..." -ForegroundColor Green
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
    git commit -m "Initial commit - Payment instruction parser for Render deployment"
    Write-Host "✓ Files committed" -ForegroundColor Green
} else {
    Write-Host "✓ No changes to commit" -ForegroundColor Green
}

Write-Host ""

# Step 3: Check if GitHub remote exists
$hasGitHubRemote = git remote | Select-String "origin"

if ($hasGitHubRemote) {
    Write-Host "✓ GitHub remote already configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
    
    # Get current branch
    $currentBranch = git branch --show-current
    if (-not $currentBranch) {
        git branch -M main
        $currentBranch = "main"
    }
    
    git push -u origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Pushed to GitHub successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Push failed. You may need to authenticate with GitHub." -ForegroundColor Yellow
        Write-Host "Try: gh auth login" -ForegroundColor White
    }
    
} else {
    Write-Host "⚠️  GitHub remote not configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create a repository on GitHub first:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Create a PUBLIC repository" -ForegroundColor White
    Write-Host "3. DO NOT initialize with README or .gitignore" -ForegroundColor White
    Write-Host ""
    
    $repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/repo-name.git)"
    
    if ($repoUrl) {
        Write-Host ""
        Write-Host "📡 Adding GitHub remote..." -ForegroundColor Yellow
        git remote add origin $repoUrl
        
        Write-Host "🔄 Renaming branch to main..." -ForegroundColor Yellow
        git branch -M main
        
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Pushed to GitHub successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Push failed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Common solutions:" -ForegroundColor Yellow
            Write-Host "1. Authenticate with GitHub CLI: gh auth login" -ForegroundColor White
            Write-Host "2. Or use Personal Access Token when prompted for password" -ForegroundColor White
            Write-Host ""
            exit 1
        }
    } else {
        Write-Host "❌ No repository URL provided" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ CODE PUSHED TO GITHUB!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Get repository info
$remoteUrl = git remote get-url origin
Write-Host "📦 GitHub Repository: $remoteUrl" -ForegroundColor White
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://render.com" -ForegroundColor White
Write-Host "2. Sign up for FREE (no credit card needed!)" -ForegroundColor Green
Write-Host "3. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "4. Connect your GitHub repository" -ForegroundColor White
Write-Host "5. Configure:" -ForegroundColor White
Write-Host "   - Build Command: npm install" -ForegroundColor Gray
Write-Host "   - Start Command: node bootstrap.js" -ForegroundColor Gray
Write-Host "   - Environment Variable: PORT = 10000" -ForegroundColor Gray
Write-Host "6. Select FREE plan" -ForegroundColor Green
Write-Host "7. Click 'Create Web Service'" -ForegroundColor White
Write-Host ""

Write-Host "📖 Full guide: See RENDER-DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Your endpoint will be:" -ForegroundColor Yellow
Write-Host "https://your-app-name.onrender.com/payment-instructions" -ForegroundColor White
Write-Host ""

Write-Host "Good luck! 🚀" -ForegroundColor Green
