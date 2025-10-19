# Vercel Deployment Guide - Auto Environment Setup

This guide helps you deploy the Drugs.ng WhatsApp Bot to Vercel with automatic environment variable configuration.

## 📋 Prerequisites

- GitHub account with your code pushed
- Vercel account (free tier available)
- Your credentials ready (from `.env` file)

---

## 🚀 Method 1: Using Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Authenticate with Vercel
```bash
vercel login
```
Follow the prompts to authenticate with your GitHub account.

### Step 3: Deploy Project
```bash
vercel
```

This will:
- Link your project to Vercel
- Ask if you want to link to existing project or create new
- Deploy your code

### Step 4: Add Environment Variables via CLI
After deployment, add your credentials:

```bash
vercel env add DATABASE_URL
# Paste: postgresql://neondb_owner:npg_VMeLcUdxjY48@ep-nameless-haze-abhb96qk-pooler.eu-west-2.aws.neon.tech/drugsng%20db?sslmode=require&channel_binding=require

vercel env add WHATSAPP_ACCESS_TOKEN
# Paste: EAApc68DK3D8BPmlO7rJZA3dGuueHwUbnEpslfCUJcQU42CZCu202j8YVsBRiAhximOHxJRsCZCOftABZAx7epuHUVZCpFiVgxDMeSDCGO5NG1x1q75gCzRfQ9sTq6SZASRZBqHoMwbjIF8I8n0Pbg0l3f4ySkXZBlADaxLDZCXseB2bxLpzyZBpwRUrXaHJBP2sKVYBu4QHOw2fLsj0yXls3575ASGOrkffdxN34c4Bb2fQT0jlQZDZD

vercel env add WHATSAPP_PHONE_NUMBER_ID
# Paste: 734619229742461

vercel env add WHATSAPP_VERIFY_TOKEN
# Paste: drugsng_webhook_verify_secure_2024

vercel env add ENCRYPTION_KEY
# Paste: a7f4b9e2c1d8f5a3b6e9d2c5f8a1b4e7d0c3f6a9b2e5c8d1f4a7b0e3c6f9a2

vercel env add NODE_ENV
# Paste: production

vercel env add LOG_LEVEL
# Paste: info

vercel env add PORT
# Paste: 3000
```

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

---

## 🌐 Method 2: Using Vercel Dashboard (Easiest)

### Step 1: Create Vercel Project
1. Go to [Vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Node.js project
5. Click **"Deploy"**

### Step 2: Add Environment Variables
After deployment:

1. Go to **Project Settings → Environment Variables**
2. Click **"Add New"** and add each variable:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_VMeLcUdxjY48@ep-nameless-haze-abhb96qk-pooler.eu-west-2.aws.neon.tech/drugsng%20db?sslmode=require&channel_binding=require` |
| `WHATSAPP_ACCESS_TOKEN` | `EAApc68DK3D8BPmlO7rJZA3dGuueHwUbnEpslfCUJcQU42CZCu202j8YVsBRiAhximOHxJRsCZCOftABZAx7epuHUVZCpFiVgxDMeSDCGO5NG1x1q75gCzRfQ9sTq6SZASRZBqHoMwbjIF8I8n0Pbg0l3f4ySkXZBlADaxLDZCXseB2bxLpzyZBpwRUrXaHJBP2sKVYBu4QHOw2fLsj0yXls3575ASGOrkffdxN34c4Bb2fQT0jlQZDZD` |
| `WHATSAPP_PHONE_NUMBER_ID` | `734619229742461` |
| `WHATSAPP_VERIFY_TOKEN` | `drugsng_webhook_verify_secure_2024` |
| `ENCRYPTION_KEY` | `a7f4b9e2c1d8f5a3b6e9d2c5f8a1b4e7d0c3f6a9b2e5c8d1f4a7b0e3c6f9a2` |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `PORT` | `3000` |

### Step 3: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **"Redeploy"**

---

## 🤖 Method 3: Automated Script (Advanced)

Create a script to automate environment variable setup:

### Step 1: Create `scripts/vercel-setup.sh`
```bash
#!/bin/bash

# Vercel Environment Setup Script
PROJECT_ID="your-project-id"

echo "Setting up Vercel environment variables..."

# Read credentials from .env
source .env

# Add variables to Vercel
vercel env add DATABASE_URL "$DATABASE_URL"
vercel env add WHATSAPP_ACCESS_TOKEN "$WHATSAPP_ACCESS_TOKEN"
vercel env add WHATSAPP_PHONE_NUMBER_ID "$WHATSAPP_PHONE_NUMBER_ID"
vercel env add WHATSAPP_VERIFY_TOKEN "$WHATSAPP_VERIFY_TOKEN"
vercel env add ENCRYPTION_KEY "$ENCRYPTION_KEY"
vercel env add NODE_ENV "production"
vercel env add LOG_LEVEL "info"
vercel env add PORT "3000"

echo "✓ All environment variables added!"
echo "Run 'vercel --prod' to deploy with environment variables"
```

### Step 2: Make Script Executable
```bash
chmod +x scripts/vercel-setup.sh
```

### Step 3: Run Setup Script
```bash
./scripts/vercel-setup.sh
```

---

## 📦 Method 4: Using GitHub Actions (CI/CD)

### Step 1: Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          WHATSAPP_ACCESS_TOKEN: ${{ secrets.WHATSAPP_ACCESS_TOKEN }}
          WHATSAPP_PHONE_NUMBER_ID: ${{ secrets.WHATSAPP_PHONE_NUMBER_ID }}
          WHATSAPP_VERIFY_TOKEN: ${{ secrets.WHATSAPP_VERIFY_TOKEN }}
          ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
          NODE_ENV: production
          LOG_LEVEL: info
          PORT: 3000
```

### Step 2: Add GitHub Secrets
Go to GitHub → Repository → Settings → Secrets and add:
- `VERCEL_TOKEN` - from Vercel account settings
- `VERCEL_ORG_ID` - from Vercel team settings
- `DATABASE_URL` - your Neon connection string
- `WHATSAPP_ACCESS_TOKEN` - your WhatsApp token
- `WHATSAPP_PHONE_NUMBER_ID` - your phone ID
- `WHATSAPP_VERIFY_TOKEN` - your verify token
- `ENCRYPTION_KEY` - your encryption key

---

## ✅ Quick Copy-Paste: All Credentials

Use this to quickly add all variables in Vercel Dashboard:

```
DATABASE_URL=postgresql://neondb_owner:npg_VMeLcUdxjY48@ep-nameless-haze-abhb96qk-pooler.eu-west-2.aws.neon.tech/drugsng%20db?sslmode=require&channel_binding=require
WHATSAPP_ACCESS_TOKEN=EAApc68DK3D8BPmlO7rJZA3dGuueHwUbnEpslfCUJcQU42CZCu202j8YVsBRiAhximOHxJRsCZCOftABZAx7epuHUVZCpFiVgxDMeSDCGO5NG1x1q75gCzRfQ9sTq6SZASRZBqHoMwbjIF8I8n0Pbg0l3f4ySkXZBlADaxLDZCXseB2bxLpzyZBpwRUrXaHJBP2sKVYBu4QHOw2fLsj0yXls3575ASGOrkffdxN34c4Bb2fQT0jlQZDZD
WHATSAPP_PHONE_NUMBER_ID=734619229742461
WHATSAPP_VERIFY_TOKEN=drugsng_webhook_verify_secure_2024
ENCRYPTION_KEY=a7f4b9e2c1d8f5a3b6e9d2c5f8a1b4e7d0c3f6a9b2e5c8d1f4a7b0e3c6f9a2
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

---

## 🔗 Configure WhatsApp Webhook

After deployment, your Vercel domain will be: `https://[your-project].vercel.app`

### Add to WhatsApp Portal:
1. Go to [Meta Business Suite](https://business.facebook.com)
2. **WhatsApp → Configuration**
3. **Webhook URL**: `https://[your-project].vercel.app/webhook`
4. **Verify Token**: `drugsng_webhook_verify_secure_2024`
5. **Subscribe to**: `messages`, `message_status`
6. Click **Verify and Save**

---

## 📊 Verify Deployment

### Check Deployment Status
```bash
vercel logs [deployment-url]
```

### Test Webhook
```bash
curl "https://[your-project].vercel.app/webhook?hub.mode=subscribe&hub.verify_token=drugsng_webhook_verify_secure_2024&hub.challenge=test_challenge"
```

Expected response: `test_challenge`

### Check Logs
In Vercel Dashboard → Project → **Logs**:
- Look for: `✓ Using Neon PostgreSQL connection`
- Look for: `✓ Environment configuration validated successfully`
- Look for: `Drugs.ng WhatsApp Bot server running on port 3000`

---

## 🐛 Troubleshooting

### Deployment Fails
- Check Node.js version: `vercel logs`
- Ensure all dependencies installed: `npm install`
- Check for build errors in Vercel dashboard

### Environment Variables Not Loading
- Verify added in **Settings → Environment Variables**
- Redeploy after adding variables
- Check variable names match exactly

### WhatsApp Webhook Not Working
- Confirm webhook URL is correct
- Verify token must match `WHATSAPP_VERIFY_TOKEN`
- Check Vercel logs for errors

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Check Neon allows Vercel IP connections
- Ensure database name doesn't need decoding

---

## 🚀 Auto-Deployment on Git Push

Enable auto-deployment in Vercel Dashboard:

1. Go to **Settings → Git**
2. **Production Deployments**: Deploy on every push to `main`
3. **Preview Deployments**: Deploy on every PR

Now every `git push` auto-deploys to Vercel!

---

## 📝 Summary

Your bot will be deployed to Vercel with:
- ✅ All environment variables configured
- ✅ Automatic deployments on git push
- ✅ WhatsApp webhook ready
- ✅ Database connection active
- ✅ Production-ready setup

**Status**: Ready for production! 🎉
