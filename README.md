# Drugs.ng WhatsApp Bot 🤖💊

A WhatsApp Business API integration bot for Drugs.ng healthcare services, built with Express.js, PostgreSQL (Neon), and custom NLP capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [NLP System](#nlp-system)
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
- **Advanced NLP**: Built-in custom NLP for intelligent message understanding
- **Numeric Commands**: Quick access via numbers (1-6) for main features
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
- **NLP**: Custom in-app natural language processing
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

Your `.env` file contains all necessary credentials:

```bash
# File: .env (REQUIRED VARIABLES)
DATABASE_URL=<your-neon-connection-string>
WHATSAPP_ACCESS_TOKEN=<your-whatsapp-token>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_VERIFY_TOKEN=<your-verify-token>
ENCRYPTION_KEY=<your-encryption-key>
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)

All configuration is managed through the `.env` file in the project root.

#### Server Configuration

```env
PORT=10000                     # Server port
NODE_ENV=production            # Environment (development/production)
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
FLUTTERWAVE_PUBLIC_KEY=...     # Flutterwave payment gateway
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_SECRET_HASH=...
PAYSTACK_SECRET_KEY=...        # Paystack payment gateway
PAYMENT_REDIRECT_URL=...       # Payment callback URL
DRUGSNG_API_BASE_URL=...       # Drugs.ng API endpoint
COMPANY_LOGO=...               # Logo URL for payments
```

### Database Initialization

Tables are **automatically created** on first run:

- `Users` - Customer profiles and authentication
- `Products` - Pharmaceutical products catalog
- `Orders` - Customer orders and transactions
- `Carts` - Shopping carts
- `Appointments` - Doctor appointments
- `SupportChats` - Customer support conversations
- `SupportTeams` - Support agent accounts
- `Sessions` - User session management

---

## 💻 Running Locally

### Development Mode (Hot Reload)

```bash
npm run dev
```

Server runs on `http://localhost:10000` with auto-restart on file changes.

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
curl "http://localhost:10000/webhook?hub.mode=subscribe&hub.verify_token=drugsng_webhook_verify_secure_2024&hub.challenge=test_challenge"
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

Add these 5 **required** variables:

| Key                        | Value                                |
| -------------------------- | ------------------------------------ |
| `DATABASE_URL`             | Your Neon connection string          |
| `WHATSAPP_ACCESS_TOKEN`    | Your WhatsApp token                  |
| `WHATSAPP_PHONE_NUMBER_ID` | `734619229742461`                    |
| `WHATSAPP_VERIFY_TOKEN`    | `drugsng_webhook_verify_secure_2024` |
| `ENCRYPTION_KEY`           | Your encryption key                  |
| `PORT`                     | `10000`                              |
| `NODE_ENV`                 | `production`                         |

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

Send a message to your WhatsApp Business number. Bot should respond!

---

## 🧠 NLP System

The bot uses a **custom in-app Natural Language Processing system** that requires no external API calls.

### How It Works

The NLP system intelligently detects user intent from natural language input using:

- **Pattern Matching**: Regex-based keyword detection
- **Parameter Extraction**: Automatically extracts data (emails, numbers, dates)
- **Intent Routing**: Maps natural language to specific features
- **Session Context**: Remembers user state across conversations

### Supported Intents

| Intent | Triggers | Example |
| --- | --- | --- |
| **Greeting** | hello, hi, hey, start | "Hello" |
| **Register** | register, signup, new account | "register John john@email.com pass123" |
| **Login** | login, signin | "login john@email.com pass123" |
| **Logout** | logout, exit, bye | "logout" |
| **Search Products** | find, search, medicine, product | "Find paracetamol" or type "1" |
| **Add to Cart** | add, cart, basket | "add 1 2" (product 1, quantity 2) |
| **Place Order** | order, checkout, buy | "order 123 Main St Flutterwave" or type "5" |
| **Track Order** | track, status, where | "track 12345" or type "3" |
| **Search Doctors** | find doctor, specialist | "Find a cardiologist in Lagos" or type "2" |
| **Book Appointment** | book, schedule, appointment | "book 1 2024-06-15 14:00" or type "4" |
| **Payment** | pay, payment | "pay 12345 flutterwave" |
| **Help** | help, menu, features | "help" |
| **Support** | support, agent, complaint | "I need support" or type "6" |

### Numeric Command Routing (1-6)

Users can type a single number to quickly access features:

- **1** → Search Medicines 🔍
- **2** → Find Doctors 👨‍⚕️
- **3** → Track Orders 📍
- **4** → Book Appointment 📅
- **5** → Place Order 📦
- **6** → Customer Support 🆘

### Response Options

Every bot response includes contextual options:

- **If Not Logged In**: "Type 'help' for menu | 'login' to sign in | 'register' to create account"
- **If Logged In**: "Type 'help' for menu | 'logout' to sign out"

### Authentication Requirements

Some features require login:
- Add to cart
- Place order
- Track orders
- Book appointments
- Make payments

Users attempting these while logged out see:
```
🔐 Authentication Required

You need to be logged in to access this feature.
Please login with your email and password:
Example: login john@example.com mypassword

Or register if you're new:
Example: register John Doe john@example.com mypassword
```

### Parameter Extraction

The NLP automatically extracts parameters from user messages:

```
User: "register John Doe john@example.com mypassword123"
Extracts: { name: "John Doe", email: "john@example.com", password: "mypassword123" }

User: "add 1 2"
Extracts: { productIndex: "1", quantity: "2" }

User: "order 123 Main St, Lagos Flutterwave"
Extracts: { address: "123 Main St, Lagos", paymentMethod: "Flutterwave" }

User: "book 1 2024-06-15 14:00"
Extracts: { doctorIndex: "1", date: "2024-06-15", time: "14:00" }
```

### No External Dependencies

Unlike Dialogflow:
- ✅ No API keys required
- ✅ No setup/configuration needed
- ✅ Instant responses (no network latency)
- ✅ Fully offline capable
- ✅ No monthly costs
- ✅ 100% privacy (data stays in your system)

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
- `GET /health` - Health check endpoint

---

## 🐛 Troubleshooting

### Database Connection Failed

**Error**: "database does not exist"

```
Solution:
- Use "neondb" as the default database name in your connection string
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
4. Ensure webhook is subscribed to "messages" event
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

### Payment Gateways Not Working

**Error**: "Payment features disabled"

```
Solution:
- Both Flutterwave and Paystack are optional
- Configure in .env if needed: FLUTTERWAVE_PUBLIC_KEY, PAYSTACK_SECRET_KEY
- Or use without payment processing
```

### NLP Not Understanding Commands

**Error**: "Unknown intent" or wrong feature triggered

```
Solution:
- NLP uses pattern matching - use clear keywords
- Supported examples in NLP System section above
- Numeric commands (1-6) are always reliable
- Check session state (logged in vs logged out)
```

---

## 🔐 Security

### Data Protection

- All sensitive data encrypted with AES-256
- Passwords hashed with bcrypt (10 rounds)
- WhatsApp webhook verified with token challenge
- Payment webhooks verified with HMAC signatures
- Session data stored securely in PostgreSQL

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
- Session-based state management

### Encryption Key Rotation

⚠️ **Changing the encryption key is irreversible without data migration:**

1. Backup database
2. Decrypt all data with old key
3. Update ENCRYPTION_KEY
4. Re-encrypt with new key
5. Update everywhere (local .env and Vercel)

---

## 📊 Database Schema

### Users Table

- id (primary key)
- name, email (unique), phone (unique)
- password (hashed), isActive
- drugsngUserId, drugsngToken

### Sessions Table

- id (primary key)
- phoneNumber (unique)
- state (NEW, REGISTERING, LOGGED_IN, SUPPORT_CHAT, etc.)
- data (JSON - stores search results, cart, user ID)
- lastActivity timestamp

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
- customerPhoneNumber, supportTeamId (foreign key)
- messages (encrypted), status

---

## 🚀 Performance Optimization

### Database Connection Pooling

- Min 0, Max 10 connections
- Idle timeout: 10 seconds
- Acquire timeout: 30 seconds
- Optimized for serverless (Vercel)

### NLP Performance

- Pattern matching (regex) - O(n) complexity
- No network calls required
- Instant intent detection
- Parameter extraction in milliseconds

### Rate Limiting

- Flexible rate limiter prevents abuse
- Configurable per endpoint
- Stored in-memory for fast lookups

### Encryption

- AES-256 (industry standard)
- Async encryption for performance
- Only sensitive fields encrypted (not all data)

---

## 📁 File Structure

```
├── .env                          # Environment variables (all credentials)
├── index.js                      # Main application file
├── package.json                  # Dependencies
├── setup.js                      # Setup verification script
│
├── config/
│   ├── database.js              # Database connection (Sequelize)
│   ├── env.js                   # Environment validation
│   ├── whatsapp.js              # WhatsApp API client
│   └── support.js               # Support team configuration
│
├── models/
│   └── index.js                 # Database models and initialization
│
├── services/
│   ├── drugsng.js               # Drugs.ng API integration
│   ├── nlp.js                   # Custom NLP system
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

**Last Updated**: December 2024  
**Status**: Production Ready ✅  
**NLP System**: Custom In-App (No External Dependencies)
