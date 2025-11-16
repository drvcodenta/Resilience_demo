# 🚀 Heroku Deployment Guide

## Step-by-Step Deployment Instructions

### Step 1: Install Heroku CLI

Download and install from: https://devcenter.heroku.com/articles/heroku-cli

**Verify installation:**
```powershell
heroku --version
```

---

### Step 2: Login to Heroku

```powershell
heroku login
```

This will open a browser window for authentication.

---

### Step 3: Initialize Git Repository

**Run these commands in your project folder (`C:\Users\acer\Desktop\resilience`):**

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Payment instruction parser"
```

---

### Step 4: Create Heroku App

```powershell
# Create app with auto-generated name
heroku create

# OR create with custom name (must be unique globally)
heroku create your-app-name-here
```

**Note:** Heroku will show you the app URL. Save this URL - you'll need it for submission!

Example output:
```
Creating app... done, ⬢ your-app-name-12345
https://your-app-name-12345.herokuapp.com/ | https://git.heroku.com/your-app-name-12345.git
```

---

### Step 5: Set Environment Variables

```powershell
# Set required environment variable
heroku config:set PORT=443

# Verify config
heroku config
```

---

### Step 6: Deploy to Heroku

```powershell
# Push code to Heroku
git push heroku main
```

**If you get an error about branch name, use:**
```powershell
git push heroku master
```

---

### Step 7: Verify Deployment

```powershell
# Open app in browser
heroku open

# Check logs
heroku logs --tail

# Check app status
heroku ps
```

---

### Step 8: Test Your Deployed Endpoint

**Your endpoint will be:**
```
https://your-app-name.herokuapp.com/payment-instructions
```

**Test with PowerShell:**
```powershell
$body = '{"accounts": [{"id": "a", "balance": 230, "currency": "USD"}, {"id": "b", "balance": 300, "currency": "USD"}], "instruction": "DEBIT 30 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'

$response = Invoke-RestMethod -Uri https://your-app-name.herokuapp.com/payment-instructions -Method POST -Body $body -ContentType 'application/json'

$response | ConvertTo-Json -Depth 10
```

**Or test with curl:**
```bash
curl -X POST https://your-app-name.herokuapp.com/payment-instructions \
  -H "Content-Type: application/json" \
  -d '{"accounts": [{"id": "a", "balance": 230, "currency": "USD"}, {"id": "b", "balance": 300, "currency": "USD"}], "instruction": "DEBIT 30 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'
```

---

## Troubleshooting

### App crashes on startup:

```powershell
# Check logs
heroku logs --tail

# Restart app
heroku restart
```

### Port issues:

Make sure `PORT` environment variable is set:
```powershell
heroku config:set PORT=443
```

### Build failed:

Check that `package.json` has all dependencies:
```powershell
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push heroku main
```

---

## Quick Command Reference

| Task | Command |
|------|---------|
| View logs | `heroku logs --tail` |
| Restart app | `heroku restart` |
| Open app | `heroku open` |
| Check status | `heroku ps` |
| Set env var | `heroku config:set KEY=value` |
| View env vars | `heroku config` |
| Deploy | `git push heroku main` |

---

## For Submission

**You need to provide:**

1. **GitHub Repository URL** - After pushing to GitHub (see next section)
2. **Full Endpoint URL** - Include the path:
   ```
   https://your-app-name.herokuapp.com/payment-instructions
   ```

---

## Optional: Push to GitHub

```powershell
# Create a new repo on github.com first, then:

# Add remote
git remote add origin https://github.com/your-username/your-repo-name.git

# Push to GitHub
git push -u origin main
```

Make sure your repo is **PUBLIC** for submission!

---

## Final Checklist Before Submission

- [ ] App deployed successfully on Heroku
- [ ] Endpoint tested and working: `POST /payment-instructions`
- [ ] GitHub repository is public
- [ ] All test cases pass
- [ ] No console.log statements in code
- [ ] Clean, lint-free code

---

## Support

If you encounter issues:
- Check Heroku logs: `heroku logs --tail`
- Ensure all dependencies are in `package.json`
- Verify `Procfile` exists with: `web: node bootstrap.js`
- Make sure `.env` file is NOT committed (it's in `.gitignore`)

Good luck! 🚀
