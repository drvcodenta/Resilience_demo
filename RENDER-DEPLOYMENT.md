# 🚀 Render.com Deployment Guide (FREE - No Credit Card Required!)

## Why Render?

- ✅ **100% FREE** - No credit card required
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Auto-deploy on git push
- ✅ Free custom domains

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub First

**You MUST push to GitHub before deploying to Render.**

```powershell
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Payment instruction parser"

# Create a new repo on GitHub (https://github.com/new)
# Then add the remote (replace YOUR-USERNAME and YOUR-REPO):
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Make sure your repository is PUBLIC!**

---

### Step 2: Sign Up for Render

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended) or email
4. No credit card required! ✅

---

### Step 3: Create a New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if first time
   - Select your repository from the list
   - Or paste the repository URL

---

### Step 4: Configure the Web Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `payment-instruction-parser` (or any name you like) |
| **Region** | Choose closest to you (e.g., Frankfurt, Singapore) |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node bootstrap.js` |

---

### Step 5: Set Environment Variables

Scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |

---

### Step 6: Choose Free Plan

Scroll down to **"Instance Type"**:

- Select **"Free"** plan
- 512 MB RAM
- Shared CPU
- **No credit card required!** ✅

---

### Step 7: Deploy!

1. Click **"Create Web Service"** at the bottom
2. Render will start building and deploying
3. Wait 3-5 minutes for deployment to complete
4. You'll see build logs in real-time

---

### Step 8: Get Your URL

Once deployed, your URL will be:

```
https://payment-instruction-parser.onrender.com
```

Your endpoint will be:

```
https://payment-instruction-parser.onrender.com/payment-instructions
```

**Copy this URL for submission!**

---

## Step 9: Test Your Deployed API

```powershell
# Test with PowerShell
$body = '{"accounts": [{"id": "a", "balance": 230, "currency": "USD"}, {"id": "b", "balance": 300, "currency": "USD"}], "instruction": "DEBIT 30 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'

Invoke-RestMethod -Uri https://your-app-name.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```

---

## ⚠️ Important: Free Tier Limitations

**Free services "spin down" after 15 minutes of inactivity.**

- First request after idle will take 30-60 seconds (cold start)
- Subsequent requests are fast
- This is normal for free tier!
- **For assessment, this is perfectly fine** ✅

---

## Troubleshooting

### Build Failed

**Check build logs on Render dashboard:**
- Make sure `package.json` has all dependencies
- Ensure `node_modules` is in `.gitignore`
- Verify `bootstrap.js` exists

### App Crashes

**Check logs:**
1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Look for errors

**Common fixes:**
```powershell
# Make sure these files exist:
# - Procfile (optional for Render)
# - bootstrap.js
# - package.json

# Make sure PORT is set to 10000 in environment variables
```

### 404 Not Found

- Make sure you're using the full path: `/payment-instructions`
- Check that your service is deployed successfully (green status)

---

## Auto-Deploy on Git Push

**Render automatically deploys when you push to GitHub!**

```powershell
# Make changes to your code
git add .
git commit -m "Update code"
git push

# Render will automatically detect and redeploy!
```

---

## For Submission

**You need:**

1. **GitHub Repository URL:**
   ```
   https://github.com/YOUR-USERNAME/YOUR-REPO-NAME
   ```

2. **Deployed Endpoint URL:**
   ```
   https://your-app-name.onrender.com/payment-instructions
   ```

---

## Render vs Heroku Comparison

| Feature | Render (Free) | Heroku (Paid Only) |
|---------|---------------|-------------------|
| **Price** | ✅ FREE | ❌ $5/month minimum |
| **Credit Card** | ✅ Not required | ❌ Required |
| **Deploy from GitHub** | ✅ Yes | ✅ Yes |
| **HTTPS** | ✅ Free | ✅ Free |
| **Custom Domain** | ✅ Free | ✅ Free |
| **Cold Starts** | 30-60s after idle | Instant (paid) |

---

## Quick Checklist

- [ ] Code pushed to GitHub (public repo)
- [ ] Signed up for Render.com (no credit card!)
- [ ] Created Web Service
- [ ] Configured build/start commands
- [ ] Set environment variables (PORT=10000)
- [ ] Selected FREE plan
- [ ] Deployment succeeded
- [ ] Tested endpoint
- [ ] Copied endpoint URL for submission

---

## Alternative Free Platforms

If you want more options (all free, no credit card):

1. **Railway.app** - $5 free credit monthly
2. **Cyclic.sh** - Completely free
3. **Vercel** - Free for Node.js APIs
4. **Fly.io** - Free tier available

**Render is recommended as it's the most straightforward!**

---

## Support

**Render Documentation:** https://render.com/docs

**Need help?** Check the logs in your Render dashboard.

---

**Ready to deploy? Just push to GitHub and follow steps 2-7 above!** 🚀

**No credit card. No payment info. 100% FREE!** ✅
