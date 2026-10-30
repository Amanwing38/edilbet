# 🇪🇹 ዕድል ቤት (Edil Bet) — Telegram Mini App Gaming Platform

Complete, production-ready Telegram Mini App & Bot platform replicating the architecture, UX, and games of **@Melabetsbot** for the Ethiopian market.

---

## 🌟 Features Included

1. **✈️ Aviator Crash Game Engine**:
   - 60 FPS HTML5 Canvas with glowing parabolic flight trajectory and animated red propeller airplane.
   - Real-time multiplier curve powered by WebSockets (50ms tick rate).
   - Dual simultaneous betting panels with quick chip selectors (10, 20, 50, 100, 500 ETB).
   - Auto Cash-Out engine (e.g. at 2.00x).
   - Live multiplayer bets table showing real-time bets and cashouts from other players.
   - Provably Fair SHA-256 HMAC cryptographic seed verification.

2. **🎱 Fast Keno (80-Number Grid)**:
   - Interactive 80-ball board (pick 1 to 10 numbers).
   - Quick Pick 5 and Clear controls.
   - Dynamic 20-ball draw animation.
   - Authentic Ethiopian Fast Keno paytable (up to 10,000x jackpot).

3. **🐔 Chicken Road 2.0 & 🎰 Crazy 777 2**:
   - Lane-crossing risk-ladder game with step-by-step cash-out.
   - 3-reel slot machine with triple 7 jackpot.

4. **💳 Telebirr & CBE Birr Cashier**:
   - **Deposits**: Min 50 ETB, Max 10,000 ETB.
   - Order generation with 30-minute circular countdown timer.
   - Recipient number `0938749239` (name hidden for privacy) with 1-click Copy button.
   - `✓ I've Paid` button with Telebirr Transaction ID proof submission.
   - **Withdrawals**: Min 500 ETB, Max 2,000 ETB.
   - 1 request per hour rate limiting and 5,000 ETB daily allowance.
   - Active bonus wagering protection and cancellation warning.

5. **🏆 Live Money Rain**:
   - Hourly/scheduled bonus drops (*"Br 420 shared between 21 players"*).
   - Leaderboard with masked Ethiopian phone numbers (`251*****9644`).

6. **👥 Affiliate Network (Terms & Conditions v2)**:
   - Deep-link attribution: `https://t.me/EdilBetET_bot?startapp=ref_AFF000106`
   - Net Gaming Revenue (NGR) RevShare (10% standard, 25% boost).
   - 7-day holding period balance management.
   - Strict Negative Carryover policy.
   - Min 500 ETB payout and 3 active players requirement.

7. **🛡️ Cashier Admin Console**:
   - Operator dashboard to view pending Telebirr deposits and tap `[ ✅ Approve & Credit ]` in 1 second!
   - Live Socket.io wallet broadcast.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Open PowerShell or Terminal:

```bash
# Server dependencies
cd C:\Users\WINDOWS1\Desktop\betting\edilbet\server
npm.cmd install

# Client dependencies
cd C:\Users\WINDOWS1\Desktop\betting\edilbet\client
npm.cmd install
```

### 2. Start the Backend Server & Telegram Bot
```bash
cd C:\Users\WINDOWS1\Desktop\betting\edilbet\server
npm.cmd run dev
```
* Backend runs on: `http://localhost:3001`
* Telegram Bot `@EdilBetET_bot` polls and handles commands!

### 3. Start the Frontend Telegram Mini App
```bash
cd C:\Users\WINDOWS1\Desktop\betting\edilbet\client
npm.cmd run dev
```
* Mini App opens at: `http://localhost:5173`

---

## 🤖 Connecting to Live Telegram
To test the Mini App directly inside your phone's Telegram app:
1. Run a free local tunnel (e.g. Cloudflare Tunnel or ngrok):
   ```bash
   npx cloudflared tunnel --url http://localhost:5173
   ```
2. Copy the resulting HTTPS URL (e.g. `https://random-subdomain.trycloudflare.com`).
3. Open `@BotFather` on Telegram:
   - Send `/setmenubutton`
   - Select `@EdilBetET_bot`
   - Paste the HTTPS URL.
4. Now, opening `@EdilBetET_bot` on Telegram and tapping **🎮 Play** launches **Edil Bet** seamlessly on any iPhone, Android, or PC!
