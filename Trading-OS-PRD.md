# Trading-OS-PRD

> **MASTER INSTRUCTION FOR THE AI CODING AGENT**

You are a Senior Staff Software Engineer, Product Designer, Solutions Architect, UX Designer and Trading Performance Coach.

Your mission is to build a production-quality **Trading OS**, not just a trading journal.

...

## Product Goal

Build a premium web application that helps discretionary traders improve their execution, psychology and consistency.

The application must feel comparable to modern SaaS products like Linear, Notion, Raycast, Vercel Dashboard and TradingView.

Never generate placeholder architecture.

Always prefer scalable and production-ready solutions.

---

# Tech Stack

- Next.js (latest App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Prisma ORM
- PostgreSQL (Aiven)
- Auth.js v5 (Google OAuth)
- Cloudinary
- React Hook Form
- Zod
- Recharts
- Server Actions where appropriate
- Vercel deployment

---

# Core Modules

1. Authentication
2. Dashboard
3. New Trade
4. Trade History
5. Trade Detail
6. Screenshot Manager
7. Analytics
8. Trading DNA
9. Psychology
10. Rule Engine
11. AI Coach
12. Weekly Review
13. Monthly Review
14. Yearly Review
15. Settings

---

# Supported Markets

- Forex
- Gold
- Silver
- Crypto
- Nifty Options
- BankNifty
- Stocks
- Futures

The schema must never assume only one market.

---

# Authentication

Google OAuth only using Auth.js.

Every user owns only their own data.

---

# Database

Design normalized Prisma models.

Minimum entities:

- User
- Trade
- Strategy
- Screenshot
- WeeklyReview
- MonthlyReview
- YearlyReview
- TradingRule
- Mistake
- Emotion
- Goal
- Tag
- AIInsight

Include proper foreign keys, timestamps, indexes and soft delete support where useful.

---

# Trade Entry Flow

Sections

## PLAN

- Market
- Instrument
- Session
- Date
- Time
- Setup
- Bias
- Planned Entry
- Stop Loss
- Target
- Expected RR
- Logic

## EXECUTION

- Actual Entry
- Exit
- Position Size
- Risk %
- Actual RR
- Late Entry
- Early Entry
- Slippage
- Execution Notes

## RESULT

- Win
- Loss
- Breakeven
- Manual Exit
- Target Hit
- Stop Hit
- PnL
- R Multiple
- Rules Followed
- Rule Break Reason

## MINDSET

Before
During
After

Emotion tags including

- Calm
- Fear
- Greed
- Revenge
- FOMO
- Overconfidence
- Anxiety
- Hesitation
- Frustration

Notes for each stage.

---

# Screenshot System

Support

- Ctrl + V clipboard paste
- Drag & Drop
- Browse upload
- Mobile upload

Images stored in Cloudinary.

Support

- Before Entry
- During Trade
- After Exit

---

# Dashboard

Show

- Win Rate
- Total Trades
- Average RR
- Net PnL
- Best Setup
- Worst Setup
- Best Session
- Most Common Mistake
- Psychology Score
- Rule Follow %
- Calendar Heatmap
- Monthly Growth
- Trading DNA summary

---

# Trading DNA

Generate continuously.

Examples

- Best market
- Worst market
- Best setup
- Best weekday
- Best session
- Best RR
- Biggest weakness
- Most profitable emotion
- Worst emotion
- Average winner
- Average loser

---

# AI Coach

Architecture must allow

1. Local Ollama models

and later

2. OpenAI

3. Gemini

AI should generate

- Weekly review
- Monthly review
- Trade review
- Mistake detection
- Pattern detection
- Improvement suggestions

---

# Analytics

Charts

- Equity Curve
- Win/Loss
- RR Distribution
- Emotion Distribution
- Session Performance
- Weekday Performance
- Monthly Performance
- Strategy Performance

---

# UX

Every action should require as few clicks as possible.

Trade logging target:
Under 60 seconds.

Premium dark UI.

Responsive.

Keyboard shortcuts.

---

# Folder Structure

Use scalable feature-based architecture.

Separate

- components
- features
- lib
- actions
- services
- prisma
- hooks
- types
- schemas

---

# Security

Validate everything with Zod.

Never trust client input.

Protect all routes.

Use server components where possible.

---

# Performance

Optimize image loading.

Pagination.

Lazy loading.

Database indexes.

Avoid unnecessary client components.

---

# Coding Standards

Strict TypeScript.

Reusable components.

Clean architecture.

Readable code.

Meaningful naming.

No duplicated logic.

---

# IMPORTANT

Do not build everything in one file.

Implement feature by feature.

At every milestone verify

- UI
- Database
- APIs
- Authentication

before moving forward.

Treat this document as the single source of truth for the entire project.
