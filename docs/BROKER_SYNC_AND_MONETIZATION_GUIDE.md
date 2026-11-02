# 🚀 Trading OS: Broker Sync & Monetization Master Guide

This guide outlines the end-to-end architecture, step-by-step technical implementation, and monetization strategy for **Automated Broker Sync** (Angel One, Dhan, Fyers, Upstox, Zerodha) and the **₹49/month Pro Freemium Model** with VIP Founder exemption.

---

## 📑 Table of Contents
1. [Supported Brokers Matrix](#1-supported-brokers-matrix)
2. [Angel One SmartAPI Implementation (Priority 1)](#2-angel-one-smartapi-implementation-priority-1)
3. [Dhan & Fyers Implementation (Priority 2 & 3)](#3-dhan--fyers-implementation-priority-2--3)
4. [Zerodha Integration (Coming Soon Status)](#4-zerodha-integration-coming-soon-status)
5. [Universal 1-Click CSV/Excel Tradebook Importer](#5-universal-1-click-csvexcel-tradebook-importer)
6. [Freemium Monetization Strategy (₹49/Month)](#6-freemium-monetization-strategy-49month)
7. [Founder / VIP Lifetime Exemption (`rivalaman123@gmail.com`)](#7-founder--vip-lifetime-exemption-rivalaman123gmailcom)
8. [Database Migration & Security Protocol](#8-database-migration--security-protocol)

---

## 1. Supported Brokers Matrix

| Broker | API Engine | Cost to Trader | Authentication Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Angel One** | SmartAPI | **FREE** | API Key + Client ID + PIN + TOTP | 🟢 **Phase 1 Priority** |
| **Dhan** | DhanHQ API v2 | **FREE** | Client ID + Access Token | 🟢 **Phase 2 Priority** |
| **Fyers** | Fyers API v3 | **FREE** | App ID + Secret + Auth Code | 🟡 **Phase 3 Priority** |
| **Upstox** | Upstox API v2 | **FREE** | API Key + Secret + OAuth | 🟡 **Phase 3 Priority** |
| **Zerodha** | Kite Connect | **₹2,000 / month** | API Key + API Secret + Request Token | ⏳ **Coming Soon** |
| **All Brokers** | Tradebook CSV / Excel | **FREE** | Direct File Upload / Parse | 🟢 **Phase 1 Companion** |

---

## 2. Angel One SmartAPI Implementation (Priority 1)

### 2.1 Overview & Architecture
Angel One provides an official developer portal called **SmartAPI** (`https://smartapi.angelbroking.com`). Every Angel One account can generate free API keys.

```
┌─────────────────────────┐
│ Angel One User Terminal │  (Places orders on Mobile / TradingView)
└────────────┬────────────┘
             │ (Market Orders Executed)
┌────────────▼────────────┐
│   Angel One Exchange    │
└────────────┬────────────┘
             │  GET /rest/secure/angelbroking/order/v1/getTradeBook
┌────────────▼────────────────────────┐
│ Next.js Backend Broker Engine       │
│  1. Authenticates using dynamic TOTP│
│  2. Retrieves today's Tradebook     │
│  3. Pairs Buy & Sell order legs     │
│  4. Computes P&L, Points & Duration │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│ PostgreSQL Database (Trade Model)   │
│  Auto-filled Entry, Exit & Result   │
│  Ready for 3-Phase Psychology Notes │
└─────────────────────────────────────┘
```

### 2.2 Credentials Required from Trader
To connect Angel One, the trader provides four fields in their private settings:
1. **Client Code**: e.g., `A123456`
2. **Password / MPIN**: 4-digit PIN or web login password.
3. **SmartAPI API Key**: Generated for free in the SmartAPI Developer Dashboard.
4. **TOTP Secret Key**: The QR secret key from Angel One (allows our server to generate the 6-digit 2FA OTP dynamically without needing SMS).

### 2.3 Step-by-Step Backend Flow

#### Step 1: Session Generation & TOTP
* **Endpoint**: `POST https://apiconnect.angelbroking.com/rest/auth/partner/v1/generate-session`
* Using `otplib` (or native crypto TOTP generator) with the user's `totpSecret`:
```typescript
import { authenticator } from "otplib";

const totp = authenticator.generate(userTotpSecret);

const authResponse = await fetch("https://apiconnect.angelbroking.com/rest/auth/partner/v1/generate-session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": "127.0.0.1",
    "X-ClientPublicIP": "127.0.0.1",
    "X-MACAddress": "fe80::1",
    "X-PrivateKey": apiKey,
  },
  body: JSON.stringify({
    clientcode: clientCode,
    password: password,
    totp: totp,
  }),
});
const { data } = await authResponse.json();
const jwtToken = data.jwtToken;
```

#### Step 2: Tradebook Retrieval
* **Endpoint**: `GET https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook`
* Returns an array of filled executions:
```json
[
  {
    "exchange": "NFO",
    "tradingsymbol": "NIFTY07NOV2424500PE",
    "transactiontype": "BUY",
    "fillprice": "132.50",
    "fillsize": "25",
    "filltime": "10:15:22",
    "orderid": "2411070001"
  },
  {
    "exchange": "NFO",
    "tradingsymbol": "NIFTY07NOV2424500PE",
    "transactiontype": "SELL",
    "fillprice": "186.50",
    "fillsize": "25",
    "filltime": "10:33:40",
    "orderid": "2411070045"
  }
]
```

#### Step 3: Trade Leg Pairing Algorithm
Options orders must be matched into round-trip trades:
1. Group orders by `tradingsymbol` (e.g. `NIFTY07NOV2424500PE`).
2. Match `BUY` order with corresponding `SELL` order in FIFO (First-In, First-Out) sequence.
3. Calculate:
   * **Actual Entry**: `₹132.50`
   * **Actual Exit**: `₹186.50`
   * **Option Points**: `+54.0 pts`
   * **Net P&L**: `54.0 * 25 = +₹1,350`
   * **Outcome**: `WIN`
   * **Duration**: `18 minutes`
   * **Market**: `Nifty Options`
   * **Option Type**: `PUT (PE)` | **Strike**: `24500`

#### Step 4: UI Sync Drawer
* A sleek modal opens showing:
  * *"2 completed trades detected in Angel One today"*
  * Trade cards with pre-calculated P&L, points, and timestamps.
  * Click **"Import & Journal"** -> instantly creates the trade in PostgreSQL.
  * Direct prompt: *"Open AI Coach to audit this execution?"*

---

## 3. Dhan & Fyers Implementation (Priority 2 & 3)

### 3.1 Dhan (DhanHQ API v2)
* **Why Dhan is the easiest to implement**:
  * DhanHQ provides a permanent access token that can be generated directly in the Dhan web terminal.
  * No daily TOTP generation required!
* **Endpoint**: `GET https://api.dhan.co/v2/trades`
* **Headers**: `access-token: <user_token>`, `client-id: <user_id>`
* Returns executed trades with immediate exchange order IDs and charges breakdown.

### 3.2 Fyers (Fyers API v3)
* Standard REST API with App ID and Secret.
* **Endpoint**: `GET https://api-t1.fyers.in/api/v3/tradebook`
* Clean response structure matching Indian equity/options segments.

---

## 4. Zerodha Integration (Coming Soon Status)

### 4.1 Why Zerodha is Marked "Coming Soon":
1. **High Monthly Fee**: Zerodha charges **₹2,000 / month** per trader for Kite Connect API access. Free tier API access is not available for retail traders.
2. **Daily Request Token Expiry**: Kite Connect requires the trader to manually log in via a browser redirect every morning to exchange a `request_token` for an `access_token`.

### 4.2 Presentation in UI:
* Display Zerodha card with a clean, branded badge:
  `⏳ Zerodha Kite — Coming Soon (Pro API)`
* Provide an immediate button:
  `📥 Use Universal CSV Importer for Zerodha (Free & Instant)`

---

## 5. Universal 1-Click CSV/Excel Tradebook Importer

Every broker in India provides a 1-click tradebook download:
* **Zerodha**: Console -> Reports -> Tradebook -> Download CSV.
* **Angel One**: Reports -> Trade History -> Export CSV.
* **Groww / Dhan / Upstox**: Order History -> Download CSV.

### 5.1 Importer Features:
1. **Auto-Detect Broker Format**: Detects whether columns match Angel One, Zerodha, Dhan, or generic formats.
2. **Drag & Drop Zone**: Drop file anywhere on the `/trades` page.
3. **Batch Import**: Imports weeks or months of trading history with automatic duplicate prevention (checks `orderId` or timestamp).

---

## 6. Freemium Monetization Strategy (₹49/Month)

### 6.1 Why Charge ₹49/Month?
1. **Psychological Micro-Pricing**:
   * One options trade in India incurs ₹20 (Buy) + ₹20 (Sell) + STT = ~₹50 brokerage.
   * **₹49/month** is framed as: *"Less than the cost of a single trade's brokerage to protect your entire trading capital."*
   * Eliminates purchase hesitation for Indian retail traders.
2. **Covers Infrastructure & AI Tokens**:
   * Gemini / NVIDIA API calls and database hosting cost money per request.
   * ₹49/month easily covers heavy AI Coach usage while turning a profit per user.
3. **Filter Out Low-Commitment Users**:
   * Paying users take trading psychology seriously and respect rule discipline.

### 6.2 Tier Comparison Matrix

| Feature | Free Tier (Community) | Pro Trader (₹49 / month) |
| :--- | :---: | :---: |
| **Manual Trade Logging** | Unlimited | Unlimited |
| **Basic Dashboard & Win-Rate** | ✅ | ✅ |
| **Core Guardrail (In-App)** | ✅ | ✅ |
| **Broker Overlay (Picture-in-Picture)** | ❌ | ✅ |
| **1-Click Broker Sync (Angel One, Dhan, Fyers)** | ❌ | ✅ **Unlimited Auto-Sync** |
| **AI Coach Queries** | 5 queries / day | ⚡ **Unlimited** |
| **AI Screenshot / Chart Vision (`Ctrl+V`)** | ❌ | ✅ **Full Multimodal Vision** |
| **AI Psychology Leakage & Weekly DNA Audits**| ❌ | ✅ |
| **Universal CSV Bulk Importer** | ❌ | ✅ |

### 6.3 Payment Gateway Integration (India)
* **Recommended Gateway**: **Razorpay** or **Cashfree Payments**
* **Payment Methods**: UPI (Google Pay, PhonePe, Paytm, Cred), UPI AutoPay (recurring ₹49 subscription), Debit/Credit Cards, Netbanking.
* **Webhook**: `/api/payments/razorpay/webhook` listens for `subscription.charged` and updates `user.isPro = true`.

---

## 7. Founder / VIP Lifetime Exemption (`rivalaman123@gmail.com`)

The application architecture includes a permanent VIP Founder exemption:

```typescript
// lib/auth/permissions.ts
export const VIP_FOUNDER_EMAILS = [
  "rivalaman123@gmail.com",
];

export function isProUser(user: { email?: string | null; isPro?: boolean }): boolean {
  if (!user?.email) return false;
  if (VIP_FOUNDER_EMAILS.includes(user.email.toLowerCase())) {
    return true; // Permanent Founder Access: 100% features unlocked forever
  }
  return Boolean(user.isPro);
}
```

* **Zero Lockouts**: Your account (`rivalaman123@gmail.com`) bypasses all paywalls, subscription checks, and token limits.
* **Founder Badge**: Display a sleek `"Founder / Master Trader"` badge in your profile header.

---

## 8. Database Migration & Security Protocol

### 8.1 STRICT DATABASE RULE:
> [!IMPORTANT]
> **NEVER run `npx prisma db push`!**
> Always use `npx prisma migrate dev --name <migration_name>` so existing production data and foreign key constraints remain intact without schema divergence.

### 8.2 Proposed Schema Models for Broker Sync & Pro Subscriptions:
```prisma
// Subscription Tracking
model Subscription {
  id              String    @id @default(cuid())
  userId          String    @unique
  plan            String    @default("PRO_MONTHLY") // FREE, PRO_MONTHLY, PRO_YEARLY
  status          String    @default("ACTIVE") // ACTIVE, CANCELLED, PAST_DUE
  currentPeriodEnd DateTime?
  razorpaySubId   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("subscriptions")
}

// Encrypted Broker Credentials (Optional: can also be stored securely in local app storage)
model BrokerCredential {
  id          String   @id @default(cuid())
  userId      String
  broker      String   // ANGEL_ONE, DHAN, FYERS, UPSTOX
  clientCode  String
  apiKey      String
  totpSecret  String?  // Encrypted AES-256
  isActive    Boolean  @default(true)
  lastSyncAt  DateTime?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, broker])
  @@map("broker_credentials")
}
```

---

## 9. Next Action Steps

1. **Verify Current UI Updates**: Test the AI Coach screenshot paste (`Ctrl+V`), image upload button, saved chat updating (10 + 5 = 15 messages), and dynamic typewriter response.
2. **Phase 1 Implementation**: Build the Angel One SmartAPI client (`lib/services/angel-one-service.ts`) and the Trade Matcher engine.
3. **Phase 2 Implementation**: Add the DhanHQ client and the Universal CSV Tradebook Importer.
4. **Phase 3 Monetization**: Wire the `isProUser` check and integrate the ₹49 Razorpay/UPI gateway with the Founder exemption.
