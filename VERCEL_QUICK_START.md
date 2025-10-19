# Vercel Deployment - Quick Start (5 Minutes)

## 🚀 Fastest Way to Deploy

### Option 1: One-Click Deploy (Easiest)
1. Go to https://vercel.com
2. Click **"New Project"**
3. Import your GitHub repo
4. Click **"Deploy"**
5. Wait for deployment to complete
6. Add environment variables (next section)

### Option 2: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🔑 Add Environment Variables

### Copy Your Credentials
From your `.env` file, you have:

```env
DATABASE_URL=postgresql://neondb_owner:npg_VMeLcUdxjY48@ep-nameless-haze-abhb96qk-pooler.eu-west-2.aws.neon.tech/drugsng%20db?sslmode=require&channel_binding=require
WHATSAPP_ACCESS_TOKEN=EAApc68DK3D8BPmlO7rJZA3dGuueHwUbnEpslfCUJcQU42CZCu202j8YVsBRiAhximOHxJRsCZCOftABZAx7epuHUVZCpFiVgxDMeSDCGO5NG1x1q75gCzRfQ9sTq6SZASRZBqHoMwbjIF8I8n0Pbg0l3f4ySkXZBlADaxLDZCXseB2bxLpzyZBpwRUrXaHJBP2sKVYBu4QHOw2fLsj0yXls3575ASGOrkffdxN34c4Bb2fQT0jlQZDZD
WHATSAPP_PHONE_NUMBER_ID=734619229742461
WHATSAPP_VERIFY_TOKEN=drugsng_webhook_verify_secure_2024
ENCRYPTION_KEY=a7f4b9e2c1d8f5a3b6e9d2c5f8a1b4e7d0c3f6a9b2e5c8d1f4a7b0e3c6f9a2
```

### In Vercel Dashboard
1. Go to **Settings → Environment Variables**
2. Click **"Add New"**
3. Paste each variable from above
4. Click **"Save"**

### Using CLI
```bash
vercel env add DATABASE_URL postgresql://neondb_owner:npg_VMeLcUdxjY48@ep-nameless-haze-abhb96qk-pooler.eu-west-2.aws.neon.tech/drugsng%20db?sslmode=require&channel_binding=require

vercel env add WHATSAPP_ACCESS_TOKEN EAApc68DK3D8BPmlO7rJZA3dGuueHwUbnEpslfCUJcQU42CZCu202j8YVsBRiAhximOHxJRsCZCOftABZAx7epuHUVZCpFiVgxDMeSDCGO5NG1x1q75gCzRfQ9sTq6SZASRZBqHoMwbjIF8I8n0Pbg0l3f4ySkXZBlADaxLDZCXseB2bxLpzyZBpwRUrXaHJBP2sKVYBu4QHOw2fLsj0yXls3575ASGOrkffdxN34c4Bb2fQT0jlQZDZD

vercel env add WHATSAPP_PHONE_NUMBER_ID 734619229742461

vercel env add WHATSAPP_VERIFY_TOKEN drugsng_webhook_verify_secure_2024

vercel env add ENCRYPTION_KEY a7f4b9e2c1d8f5a3b6e9d2c5f8a1b4e7d0c3f6a9b2e5c8d1f4a7b0e3c6f9a2

vercel env add NODE_ENV production

vercel env add LOG_LEVEL info

vercel env add PORT 3000
```

---

## ✅ After Deploying

1. **Get Your Domain**
   - Check Vercel dashboard: `https://[your-project].vercel.app`

2. **Configure WhatsApp Webhook**
   - Go to https://business.facebook.com
   - WhatsApp → Configuration
   - Set Webhook URL: `https://[your-project].vercel.app/webhook`
   - Set Verify Token: `drugsng_webhook_verify_secure_2024`
   - Save

3. **Test It**
   - Send a message from your phone to the WhatsApp Business number
   - Bot should respond!

---

## 📊 Check Status

```bash
# View live logs
vercel logs https://[your-project].vercel.app

# List all deployments
vercel ls

# View specific deployment
vercel [deployment-url]
```

---

## 🐛 If Something Goes Wrong

**Deployment failed?**
- Check build logs in Vercel dashboard
- Ensure `package.json` is in project root
- Run `npm install` locally first

**Environment variables not loading?**
- Confirm added in Settings → Environment Variables
- Redeploy after adding: `vercel --prod`
- Check variable names match exactly

**WhatsApp not responding?**
- Verify webhook URL is HTTPS and correct
- Check Vercel logs for errors
- Ensure verify token matches

---

## 🎯 Auto-Deploy on Git Push

Enable in Vercel Dashboard → Settings → Git:
- **Production Branch**: main
- Every push to main auto-deploys!

---

**That's it! Your bot is live.** 🚀
