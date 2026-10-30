import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { WalletService } from './services/walletService.js';
import { UserService } from './services/userService.js';
import { KenoEngine } from './games/kenoEngine.js';
import { ProvablyFair } from './games/provablyFair.js';
import { AviatorRoom } from './games/aviatorRoom.js';
import { PromotionService } from './services/promotionService.js';
import { AffiliateService } from './services/affiliateService.js';
import { launchBot } from './bot.js';

process.on('uncaughtException', (err) => {
  console.error('Server Uncaught Exception (recovering):', err.message);
});
process.on('unhandledRejection', (reason: any) => {
  console.error('Server Unhandled Rejection (recovering):', reason?.message || reason);
});

const dockerPath = path.resolve(process.cwd(), 'client/dist');
const localPath = path.resolve(process.cwd(), '../client/dist');
const clientDistPath = fs.existsSync(dockerPath) ? dockerPath : localPath;

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(clientDistPath));

// Initialize Aviator Real-time Engine
const aviatorRoom = new AviatorRoom(io);
aviatorRoom.start();

// Launch Telegram Bot (@EdilBetET_bot)
const BOT_TOKEN = process.env.BOT_TOKEN || '8891588751:AAGDl5JDnrmi5lhO8_56ap2ghzEGWwFACZI';
launchBot(BOT_TOKEN);

// Helper to get active user ID from request
function getUserId(req: express.Request): string {
  const headerId = req.headers['x-user-id'] as string;
  const queryId = req.query.userId as string;
  const bodyId = req.body?.userId as string;
  return headerId || queryId || bodyId || 'EB-741891';
}

// ------------------------------------
// REST API ROUTES
// ------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', brand: 'Edil Bet (ዕድል ቤት)', time: new Date().toISOString() });
});

// User Authentication & Registration from Telegram
app.post('/api/user/auth', (req, res) => {
  try {
    const { telegramId, username, firstName, referredBy } = req.body;
    const tgIdNum = Number(telegramId) || 8148611275;

    const { user, wallet, isNew } = UserService.getOrCreateUser({
      telegramId: tgIdNum,
      username: username || 'Player',
      firstName: firstName || 'Player',
      referredBy
    });

    res.json({ success: true, user, wallet, isNew });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// User & Wallet
app.get('/api/user/me', (req, res) => {
  const userId = getUserId(req);
  const user = UserService.getUserById(userId) || {
    id: userId,
    telegramId: 8148611275,
    username: 'DriveAddis',
    firstName: 'DriveAddis',
    role: 'admin',
    language: 'am'
  };
  const wallet = WalletService.getOrCreateWallet(userId);
  res.json({ user, wallet });
});

app.get('/api/wallet', (req, res) => {
  const userId = getUserId(req);
  const wallet = WalletService.getOrCreateWallet(userId);
  const transactions = WalletService.getUserTransactions(userId);
  res.json({
    wallet,
    transactions,
    limits: {
      minDeposit: WalletService.MIN_DEPOSIT,
      maxDeposit: WalletService.MAX_DEPOSIT,
      minWithdrawal: WalletService.MIN_WITHDRAWAL,
      maxWithdrawal: WalletService.MAX_WITHDRAWAL,
      dailyWithdrawalLimit: WalletService.DAILY_WITHDRAWAL_LIMIT,
      telebirrRecipient: WalletService.TELEBIRR_RECIPIENT,
      cbeRecipient: WalletService.CBE_RECIPIENT
    }
  });
});

// Deposit Orders
app.post('/api/wallet/deposit', (req, res) => {
  try {
    const userId = getUserId(req);
    const { amount, paymentMethod, senderPhone, username } = req.body;
    const order = WalletService.createDepositOrder({
      userId,
      username: username || 'Player',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'TELEBIRR',
      senderPhone: senderPhone || '0938749239'
    });
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/wallet/deposit/confirm', (req, res) => {
  try {
    const { orderId, referenceCode } = req.body;
    const updated = WalletService.submitDepositProof(orderId, referenceCode);
    res.json({ success: true, order: updated, message: 'Receipt submitted. Awaiting cashier verification.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Withdrawals
app.post('/api/wallet/withdraw', (req, res) => {
  try {
    const userId = getUserId(req);
    const { amount, phone, username } = req.body;
    const result = WalletService.requestWithdrawal({
      userId,
      username: username || 'Player',
      amount: Number(amount),
      phone: phone || '0938749239'
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Cashier Endpoints
app.get('/api/admin/deposits', (req, res) => {
  const pending = WalletService.getPendingDeposits();
  res.json({ pending });
});

app.post('/api/admin/deposits/:id/approve', (req, res) => {
  try {
    const result = WalletService.approveDeposit(req.params.id, 'Admin');
    io.emit('wallet_updated', { userId: result.order.userId, wallet: result.wallet });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/deposits/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const rejected = WalletService.rejectDeposit(req.params.id, reason);
    res.json({ success: true, order: rejected });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Fast Keno Game
app.post('/api/games/keno/play', (req, res) => {
  try {
    const userId = getUserId(req);
    const { pickedNumbers, stake } = req.body;
    const stakeNum = Number(stake) || 10;

    const walletAfterDebit = WalletService.debitStake(userId, stakeNum, 'KENO_BET', `Keno Play (${pickedNumbers.length} numbers)`);

    const serverSeed = ProvablyFair.generateServerSeed();
    const drawnNumbers = ProvablyFair.generateKenoDraw(serverSeed, 'keno-client-seed', Date.now());
    const evalResult = KenoEngine.evaluate(pickedNumbers, drawnNumbers, stakeNum);

    let finalWallet = walletAfterDebit;
    if (evalResult.payout > 0) {
      finalWallet = WalletService.creditWin(userId, evalResult.payout, 'KENO_WIN', `Keno Win (${evalResult.matchedCount} hits)`);
    }

    res.json({
      success: true,
      pickedNumbers,
      drawnNumbers,
      matchedNumbers: evalResult.matchedNumbers,
      matchedCount: evalResult.matchedCount,
      multiplier: evalResult.multiplier,
      payout: evalResult.payout,
      wallet: finalWallet
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Chicken Road Mini-Game
app.post('/api/games/chicken-road/step', (req, res) => {
  try {
    const userId = getUserId(req);
    const { stepIndex, currentMultiplier, isCashingOut, stake } = req.body;
    const stakeNum = Number(stake) || 20;

    if (isCashingOut) {
      const payout = parseFloat((stakeNum * currentMultiplier).toFixed(2));
      const wallet = WalletService.creditWin(userId, payout, 'SLOT_WIN', `Chicken Road Cashout @ ${currentMultiplier}x`);
      return res.json({ success: true, cashedOut: true, payout, wallet });
    }

    const survives = Math.random() < 0.82;
    if (!survives) {
      return res.json({ success: true, crashed: true, payout: 0 });
    }

    const nextMult = parseFloat((currentMultiplier * 1.35).toFixed(2));
    res.json({ success: true, crashed: false, nextMultiplier: nextMult });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Slot Machine Spin
app.post('/api/games/slot/spin', (req, res) => {
  try {
    const userId = getUserId(req);
    const { gameId, stake } = req.body;
    const stakeNum = Number(stake) || 10;

    WalletService.debitStake(userId, stakeNum, 'SLOT_BET', `${gameId} Spin`);

    const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣'];
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

    let multiplier = 0;
    if (reel1 === '7️⃣' && reel2 === '7️⃣' && reel3 === '7️⃣') {
      multiplier = 50;
    } else if (reel1 === reel2 && reel2 === reel3) {
      multiplier = 10;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      multiplier = 1.5;
    }

    const payout = parseFloat((stakeNum * multiplier).toFixed(2));
    let finalWallet = WalletService.getOrCreateWallet(userId);

    if (payout > 0) {
      finalWallet = WalletService.creditWin(userId, payout, 'SLOT_WIN', `${gameId} Win`);
    }

    res.json({
      success: true,
      reels: [reel1, reel2, reel3],
      multiplier,
      payout,
      wallet: finalWallet
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Promotions
app.get('/api/promotions', (req, res) => {
  res.json({
    promotions: PromotionService.getPromotions(),
    latestRain: PromotionService.getLatestMoneyRain()
  });
});

app.post('/api/promotions/redeem', (req, res) => {
  try {
    const userId = getUserId(req);
    const { code } = req.body;
    const result = PromotionService.redeemCoupon(userId, code);
    const wallet = WalletService.getOrCreateWallet(userId);
    res.json({ success: true, ...result, wallet });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/promotions/money-rain', (req, res) => {
  res.json(PromotionService.getLatestMoneyRain());
});

app.post('/api/promotions/money-rain/trigger', (req, res) => {
  const drop = PromotionService.triggerMoneyRain(420, 21);
  io.emit('money_rain_drop', drop);
  res.json({ success: true, drop });
});

// Affiliate Dashboard
app.get('/api/affiliate', (req, res) => {
  const userId = getUserId(req);
  const user = UserService.getUserById(userId);
  const username = user?.username || 'Player';
  const profile = AffiliateService.getOrCreateProfile(userId, username);
  const deepLink = AffiliateService.getDeepLink('@EdilBetET_bot', profile.affiliateCode);
  res.json({ profile, deepLink });
});

app.post('/api/affiliate/payout-number', (req, res) => {
  try {
    const userId = getUserId(req);
    const { phone } = req.body;
    const updated = AffiliateService.updatePayoutNumber(userId, phone);
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/affiliate/withdraw', (req, res) => {
  try {
    const userId = getUserId(req);
    const result = AffiliateService.requestAffiliatePayout(userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ------------------------------------
// SOCKET.IO REAL-TIME EVENTS
// ------------------------------------

io.on('connection', (socket) => {
  socket.emit('aviator_state', aviatorRoom.getState());

  socket.on('aviator_place_bet', (data: { userId?: string; username?: string; stake: number; autoCashout?: number }) => {
    try {
      const uId = data.userId || 'EB-741891';
      const uName = data.username || 'Player';

      const bet = aviatorRoom.placeBet({
        userId: uId,
        username: uName,
        stake: Number(data.stake),
        autoCashout: data.autoCashout ? Number(data.autoCashout) : undefined
      });
      socket.emit('aviator_bet_confirmed', bet);

      const wallet = WalletService.getOrCreateWallet(uId);
      socket.emit('wallet_updated', { userId: uId, wallet });
    } catch (err: any) {
      socket.emit('aviator_error', { message: err.message });
    }
  });

  socket.on('aviator_cash_out', (data: { betId: string; multiplier: number; userId?: string }) => {
    try {
      const uId = data.userId || 'EB-741891';
      const bet = aviatorRoom.executeCashout(data.betId, data.multiplier, uId);
      socket.emit('aviator_cashout_success', bet);

      const wallet = WalletService.getOrCreateWallet(uId);
      socket.emit('wallet_updated', { userId: uId, wallet });
    } catch (err: any) {
      console.error('Aviator cashout error:', err.message);
      socket.emit('aviator_error', { message: err.message });
    }
  });
});

// Fallback for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Edil Bet (ዕድል ቤት) Server running on port ${PORT}`);
  console.log(`✈️ Aviator Real-Time Engine Active`);
  console.log(`🎱 Fast Keno & Casino Games Active`);
  console.log(`💳 Telebirr & CBE Cashier Ready`);
  console.log(`=======================================================`);
});
