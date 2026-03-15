# SnoozeStake

A productivity alarm app where you pay real money every time you snooze.

## Stack

- **App:** React Native (Expo) + TypeScript
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **Payments:** Stripe
- **Auth:** Firebase Auth
- **Real-time:** Socket.io

## Getting Started

### App

```bash
cd app
npm install
npx expo start
```

### Server

```bash
cd server
cp .env.example .env  # Configure your environment
npm install
npx prisma migrate dev
npm run dev
```

## Business Model

Every snooze penalty is split **75/25**:
- **75%** goes to the user's chosen destination (savings, charity, or friend)
- **25%** is retained as platform revenue
