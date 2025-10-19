# Drugs.ng WhatsApp Bot 🤖💊

A WhatsApp Business API integration bot for Drugs.ng healthcare services, built with Express.js, PostgreSQL (Neon), and NLP capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## ✨ Features

- **WhatsApp Integration**: Send and receive messages via Meta WhatsApp Business API
- **Customer Management**: User registration, authentication, and profile management
- **Product Catalog**: Search and browse pharmaceutical products
- **Order Management**: Place orders, track shipments, manage cart
- **Doctor Appointments**: Book and manage medical appointments
- **Payment Processing**: Integrate with Flutterwave & Paystack (optional)
- **NLP Processing**: Keyword-based message understanding with Dialogflow fallback
- **Customer Support**: Team chat system for support interactions
- **Data Encryption**: AES-256 encryption for sensitive user data
- **Rate Limiting**: Protect against abuse with rate limiting
- **Production-Ready**: Fully tested with error handling and logging

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Sequelize
- **API**: Meta WhatsApp Business API
- **NLP**: Dialogflow with keyword-based fallback
- **Payments**: Flutterwave v3, Paystack
- **Security**: bcryptjs, crypto-js (AES-256)
- **Deployment**: Vercel
- **Hosting**: Vercel (serverless)

---

## 📦 Prerequisites

- **Node.js** ≥ 16.x
- **npm** or **yarn**
- **Neon PostgreSQL** account (free tier available)
- **Meta Business Account** (for WhatsApp Business API)
- **Vercel Account** (for deployment)

---

## 🚀 Installation

### Step 1: Clone & Setup

```bash
# Clone repository
git clone <your-repo-url>
cd drugsng-whatsapp-bot

# Install dependencies
npm install

# Verify setup
npm run setup
```

### Step 2: Configure Environment Variables

Copy your current `.env` file - it already contains all necessary credentials:

```bash
# File: .env
DATABASE_URL=<your-neon-connection-string>
WHATSAPP_ACCESS_TOKEN=<your-whatsapp-token>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_VERIFY_TOKEN=<your-verify-token>
ENCRYPTION_KEY=<your-encryption-key>
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)

All configuration is managed through the `.env` file in the project root. Here's what each section does:

#### Server Configuration

```env
PORT=3000                      # Server port
NODE_ENV=development           # Environment (development/production)
LOG_LEVEL=info                 # Logging level
```

#### Database (Required)

```env
DATABASE_URL=postgresql://...  # Neon PostgreSQL connection string
```

The connection string includes:

- Host, port, database name
- SSL and channel binding for security
- Connection pooling for serverless

#### WhatsApp API (Required)

```env
WHATSAPP_ACCESS_TOKEN=...      # Long-lived user access token from Meta
WHATSAPP_PHONE_NUMBER_ID=...   # Your WhatsApp Business phone number ID
WHATSAPP_VERIFY_TOKEN=...      # Your custom webhook verification token
```

#### Security (Required)

```env
ENCRYPTION_KEY=...             # AES-256 encryption key (32+ characters)
```

Used to encrypt:

- User emails, phone numbers, passwords
- Payment transaction data
- Support chat messages
- Any sensitive personal information

#### Optional Integrations

```env
DIALOGFLOW_PROJECT_ID=...      # Google Cloud Dialogflow (NLP)
FLUTTERWAVE_PUBLIC_KEY=...     # Flutterwave payment gateway
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_SECRET_HASH=...
PAYSTACK_SECRET_KEY=...        # Paystack payment gateway
PAYMENT_REDIRECT_URL=...       # Payment callback URL
DRUGSNG_API_BASE_URL=...       # Drugs.ng API endpoint
COMPANY_LOGO=...               # Logo URL for payments
SUPPORT_PHONE_NUMBER_1-4=...   # Support team phone numbers
```

### Database Initialization

Tables are **automatically created** on first run:

- `Users` - Customer profiles
- `Products` - Pharmaceutical products
- `Orders` - Customer orders
- `Carts` - Shopping carts
- `Appointments` - Doctor appointments
- `SupportChats` - Customer support conversations
- `SupportTeams` - Support agent accounts

---

## 💻 Running Locally

### Development Mode (Hot Reload)

```bash
npm run dev
```

Server runs on `http://localhost:3000` with auto-restart on file changes.

### Production Mode

```bash
npm start
```

### Verify Setup

```bash
npm run setup
```

Checks that all required environment variables and dependencies are configured.

### Test Webhook Locally

```bash
# Verify your webhook is working
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=drugsng_webhook_verify_secure_2024&hub.challenge=test_challenge"
```

---

## 🌐 Deployment to Vercel

### Step 1: Prepare Repository

```bash
# Ensure code is committed to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel auto-detects Node.js project

### Step 3: Add Environment Variables

In Vercel dashboard: **Settings → Environment Variables**

Add these 5 variables:

| Key                        | Value                                |
| -------------------------- | ------------------------------------ |
| `DATABASE_URL`             | Your Neon connection string          |
| `WHATSAPP_ACCESS_TOKEN`    | Your WhatsApp token                  |
| `WHATSAPP_PHONE_NUMBER_ID` | `734619229742461`                    |
| `WHATSAPP_VERIFY_TOKEN`    | `drugsng_webhook_verify_secure_2024` |
| `ENCRYPTION_KEY`           | Your encryption key                  |

```env
DATABASE_URL=DATABASE_URL=postgresql://neondb_owner:npg_VMeLcUdxjY48@ep-nameless-haze-abhb96qk-pooler.eu-west-2.aws.neon.tech/drugsng_db?sslmode=require&channel_binding=require
WHATSAPP_ACCESS_TOKEN=EAApc68DK3D8BPmlO7rJZA3dGuueHwUbnEpslfCUJcQU42CZCu202j8YVsBRiAhximOHxJRsCZCOftABZAx7epuHUVZCpFiVgxDMeSDCGO5NG1x1q75gCzRfQ9sTq6SZASRZBqHoMwbjIF8I8n0Pbg0l3f4ySkXZBlADaxLDZCXseB2bxLpzyZBpwRUrXaHJBP2sKVYBu4QHOw2fLsj0yXls3575ASGOrkffdxN34c4Bb2fQT0jlQZDZD
WHATSAPP_PHONE_NUMBER_ID=734619229742461
WHATSAPP_VERIFY_TOKEN=drugsng_webhook_verify_secure_2024
ENCRYPTION_KEY=a7f4b9e2c1d8f5a3b6e9d2c5f8a1b4e7d0c3f6a9b2e5c8d1f4a7b0e3c6f9a2
NODE_ENV=production
```

### Step 4: Deploy

Click "Deploy" - Vercel will build and deploy your bot.

### Step 5: Configure WhatsApp Webhook

After deployment, Vercel provides your domain (e.g., `drugsng-bot.vercel.app`):

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Navigate to **WhatsApp → Configuration**
3. Set **Webhook URL**: `https://drugsng-bot.vercel.app/webhook`
4. Set **Verify Token**: `drugsng_webhook_verify_secure_2024`
5. Subscribe to events: `messages`, `message_status`
6. Click **Verify and Save**

### Step 6: Test Production

Send a message from phone `+1 555 175 1458` to your WhatsApp Business number. Bot should respond!

---

## 🔌 API Endpoints

### WhatsApp Webhook

- `GET /webhook` - Verify webhook (Meta challenge)
- `POST /webhook` - Receive and process messages

### Payment Webhooks (Optional)

- `POST /webhook/flutterwave` - Flutterwave payment status
- `POST /webhook/paystack` - Paystack payment status

### Root Endpoint

- `GET /` - API status and information

---

## 🐛 Troubleshooting

### Database Connection Failed

**Error**: "database "drugsng db" does not exist"

```
Solution:
- Neon auto-creates databases on first query
- Ensure DATABASE_URL is correct in .env
- Check Neon dashboard for active connection
```

### WhatsApp Webhook Not Receiving Messages

**Error**: Webhook verification fails

```
Solution:
1. Verify token must match WHATSAPP_VERIFY_TOKEN in .env
2. Webhook URL must be HTTPS (Vercel provides this)
3. Check Vercel logs: vercel.com → Project → Logs
```

### Encryption Key Issues

**Error**: "Decryption failed" or invalid data

```
Solution:
- Never change ENCRYPTION_KEY after data is encrypted
- If changed, all encrypted data becomes unreadable
- Generate new key only if starting fresh
- Backup database before changing
```

### Dialogflow Not Working

**Error**: "Dialogflow service-account-key.json not found"

```
Solution:
- Dialogflow is optional - uses fallback NLP
- To enable: Download service account key from Google Cloud
- Place as service-account-key.json in root
- Or skip if keyword matching is sufficient
```

### Payment Gateways Not Working

**Error**: "Payment features disabled"

```
Solution:
- Both Flutterwave and Paystack are optional
- Configure in .env if needed: FLUTTERWAVE_PUBLIC_KEY, PAYSTACK_SECRET_KEY
- Or use keyword-based responses without payment
```

---

## 🔐 Security

### Data Protection

- All sensitive data encrypted with AES-256
- Passwords hashed with bcrypt (10 rounds)
- WhatsApp webhook verified with token challenge
- Payment webhooks verified with HMAC signatures

### Environment Variables

- **Never commit `.env` to git** - it's in `.gitignore`
- Use Vercel's encrypted environment variables for production
- Rotate credentials periodically (WhatsApp token every 90 days)
- Keep encryption key backed up safely

### API Security

- Rate limiting enabled (prevents brute force)
- Input validation on all endpoints
- Proper error handling (no sensitive data in logs)
- HTTPS required for webhooks

### Encryption Key Rotation

⚠️ **Changing the encryption key is irreversible without data migration:**

1. Backup database
2. Decrypt all data with old key
3. Update ENCRYPTION_KEY
4. Re-encrypt with new key
5. Update everywhere (local .env and Vercel)

---

## 📞 Support Integration

The bot includes customer support features:

- Customers can escalate to support team via WhatsApp
- Support team has dedicated phone numbers (configurable in .env)
- Chat history stored and encrypted in database
- Support team notified of customer issues

### Configure Support Team

Update these in `.env`:

```env
SUPPORT_PHONE_NUMBER_1=2348012345678
SUPPORT_PHONE_NUMBER_2=2348023456789
SUPPORT_PHONE_NUMBER_3=2348034567890
SUPPORT_PHONE_NUMBER_4=2348045678901
```

---

## 📊 Database Schema

### Users Table

- id (primary key)
- name, email (unique), phone (unique)
- password (hashed), isActive
- drugsngUserId, drugsngToken

### Orders Table

- id (primary key)
- userId (foreign key)
- status, paymentStatus
- items, total, delivery address

### Products Table

- id (primary key)
- name, category, price, stock
- description, image URL

### SupportChats Table

- id (primary key)
- userId, supportTeamId (foreign keys)
- messages (encrypted), status

---

## 🚀 Performance Optimization

### Database Connection Pooling

- Min 0, Max 10 connections
- Idle timeout: 10 seconds
- Acquire timeout: 30 seconds
- Optimized for serverless (Vercel)

### Rate Limiting

- Flexible rate limiter prevents abuse
- Configurable per endpoint
- Stored in-memory for fast lookups

### Encryption

- AES-256 (industry standard)
- Async encryption for performance
- Only sensitive fields encrypted (not all data)

---

## 📚 File Structure

```
├── .env                          # Environment variables (all credentials)
├── .env.example                  # (DEPRECATED - use .env)
├── index.js                      # Main application file
├── package.json                  # Dependencies
├── setup.js                      # Setup verification script
│
├── config/
│   ├── database.js              # Database connection (Sequelize)
│   ├── env.js                   # Environment validation
│   ├── dialogflow.js            # Dialogflow NLP client
│   ├── whatsapp.js              # WhatsApp API client
│   └── support.js               # Support team configuration
│
├── models/
│   └── index.js                 # Database models and initialization
│
├── services/
│   ├── drugsng.js               # Drugs.ng API integration
│   ├── nlp.js                   # Natural language processing
│   ├── payment.js               # Flutterwave & Paystack
│   ├── security.js              # Encryption/decryption
│   └── support.js               # Support chat features
│
├── utils/
│   ├── errorHandler.js          # Error handling & logging
│   ├── rateLimiter.js           # Rate limiting
│   ├── validation.js            # Input validation
│   └── (other utilities)
│
└── README.md                     # This file
```

---

## 🔄 Development Workflow

### Local Development

```bash
# Start dev server with auto-reload
npm run dev

# Run setup verification
npm run setup

# Push to GitHub
git push origin main
```

### Production Deployment

```bash
# Vercel auto-deploys on git push
# Check deployment: vercel.com → Project Dashboard
# View logs: vercel.com → Project → Logs
```

---

## 📝 License

Private project for Drugs.ng Healthcare Services.

---

## 🤝 Contributing

1. Make changes locally
2. Test with `npm run dev`
3. Commit with clear messages
4. Push to GitHub
5. Vercel auto-deploys on push

---

## 📞 Contact & Support

For issues or questions:

- Check **Troubleshooting** section above
- Review **CODE_AUDIT_REPORT.md** for technical details
- Check Vercel logs for deployment issues
- Ensure all environment variables are set correctly

---

**Last Updated**: October 2024  
**Status**: Production Ready ✅
