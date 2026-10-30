"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const socket_io_1 = require("socket.io");
const walletService_js_1 = require("./services/walletService.js");
const userService_js_1 = require("./services/userService.js");
const kenoEngine_js_1 = require("./games/kenoEngine.js");
const provablyFair_js_1 = require("./games/provablyFair.js");
const aviatorRoom_js_1 = require("./games/aviatorRoom.js");
const promotionService_js_1 = require("./services/promotionService.js");
const affiliateService_js_1 = require("./services/affiliateService.js");
const bot_js_1 = require("./bot.js");
process.on('uncaughtException', (err) => {
    console.error('Server Uncaught Exception (recovering):', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('Server Unhandled Rejection (recovering):', reason?.message || reason);
});
const dockerPath = path_1.default.resolve(process.cwd(), 'client/dist');
const localPath = path_1.default.resolve(process.cwd(), '../client/dist');
const clientDistPath = fs_1.default.existsSync(dockerPath) ? dockerPath : localPath;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(clientDistPath));
// Initialize Aviator Real-time Engine
const aviatorRoom = new aviatorRoom_js_1.AviatorRoom(io);
aviatorRoom.start();
// Launch Telegram Bot (@EdilBetET_bot)
const BOT_TOKEN = process.env.BOT_TOKEN || '8891588751:AAHMOttSv8O3K9i4X92t6-EcVYRJqMtcZe4';
(0, bot_js_1.launchBot)(BOT_TOKEN);
(0, bot_js_1.registerSocketEmitter)((userId, wallet) => {
    io.emit('wallet_updated', { userId, wallet });
});
// Helper to get active user ID from request
function getUserId(req) {
    const headerId = req.headers['x-user-id'];
    const queryId = req.query.userId;
    const bodyId = req.body?.userId;
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
        const { user, wallet, isNew } = userService_js_1.UserService.getOrCreateUser({
            telegramId: tgIdNum,
            username: username || 'Player',
            firstName: firstName || 'Player',
            referredBy
        });
        res.json({ success: true, user, wallet, isNew });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// User & Wallet
app.get('/api/user/me', (req, res) => {
    const userId = getUserId(req);
    const user = userService_js_1.UserService.getUserById(userId) || {
        id: userId,
        telegramId: 8148611275,
        username: 'DriveAddis',
        firstName: 'DriveAddis',
        role: 'admin',
        language: 'am'
    };
    const wallet = walletService_js_1.WalletService.getOrCreateWallet(userId);
    res.json({ user, wallet });
});
app.get('/api/wallet', (req, res) => {
    const userId = getUserId(req);
    const wallet = walletService_js_1.WalletService.getOrCreateWallet(userId);
    const transactions = walletService_js_1.WalletService.getUserTransactions(userId);
    res.json({
        wallet,
        transactions,
        limits: {
            minDeposit: walletService_js_1.WalletService.MIN_DEPOSIT,
            maxDeposit: walletService_js_1.WalletService.MAX_DEPOSIT,
            minWithdrawal: walletService_js_1.WalletService.MIN_WITHDRAWAL,
            maxWithdrawal: walletService_js_1.WalletService.MAX_WITHDRAWAL,
            dailyWithdrawalLimit: walletService_js_1.WalletService.DAILY_WITHDRAWAL_LIMIT,
            telebirrRecipient: walletService_js_1.WalletService.TELEBIRR_RECIPIENT,
            cbeRecipient: walletService_js_1.WalletService.CBE_RECIPIENT
        }
    });
});
// Deposit Orders
app.post('/api/wallet/deposit', (req, res) => {
    try {
        const userId = getUserId(req);
        const { amount, paymentMethod, senderPhone, username } = req.body;
        const order = walletService_js_1.WalletService.createDepositOrder({
            userId,
            username: username || 'Player',
            amount: Number(amount),
            paymentMethod: paymentMethod || 'TELEBIRR',
            senderPhone: senderPhone || '0938749239'
        });
        res.json({ success: true, order });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
app.post('/api/wallet/deposit/confirm', (req, res) => {
    try {
        const { orderId, referenceCode } = req.body;
        const updated = walletService_js_1.WalletService.submitDepositProof(orderId, referenceCode);
        (0, bot_js_1.notifyAdminNewDeposit)(updated);
        res.json({ success: true, order: updated, message: 'Receipt submitted. Awaiting cashier verification.' });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Withdrawals
app.post('/api/wallet/withdraw', (req, res) => {
    try {
        const userId = getUserId(req);
        const { amount, phone, username } = req.body;
        const result = walletService_js_1.WalletService.requestWithdrawal({
            userId,
            username: username || 'Player',
            amount: Number(amount),
            phone: phone || '0938749239'
        });
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Admin Cashier Endpoints
app.get('/api/admin/deposits', (req, res) => {
    const pending = walletService_js_1.WalletService.getPendingDeposits();
    res.json({ pending });
});
app.post('/api/admin/deposits/:id/approve', (req, res) => {
    try {
        const result = walletService_js_1.WalletService.approveDeposit(req.params.id, 'Admin');
        io.emit('wallet_updated', { userId: result.order.userId, wallet: result.wallet });
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
app.post('/api/admin/deposits/:id/reject', (req, res) => {
    try {
        const { reason } = req.body;
        const rejected = walletService_js_1.WalletService.rejectDeposit(req.params.id, reason);
        res.json({ success: true, order: rejected });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Fast Keno Game
app.post('/api/games/keno/play', (req, res) => {
    try {
        const userId = getUserId(req);
        const { pickedNumbers, stake } = req.body;
        const stakeNum = Number(stake) || 10;
        const walletAfterDebit = walletService_js_1.WalletService.debitStake(userId, stakeNum, 'KENO_BET', `Keno Play (${pickedNumbers.length} numbers)`);
        const serverSeed = provablyFair_js_1.ProvablyFair.generateServerSeed();
        const drawnNumbers = provablyFair_js_1.ProvablyFair.generateKenoDraw(serverSeed, 'keno-client-seed', Date.now());
        const evalResult = kenoEngine_js_1.KenoEngine.evaluate(pickedNumbers, drawnNumbers, stakeNum);
        let finalWallet = walletAfterDebit;
        if (evalResult.payout > 0) {
            finalWallet = walletService_js_1.WalletService.creditWin(userId, evalResult.payout, 'KENO_WIN', `Keno Win (${evalResult.matchedCount} hits)`);
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
    }
    catch (err) {
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
            const wallet = walletService_js_1.WalletService.creditWin(userId, payout, 'SLOT_WIN', `Chicken Road Cashout @ ${currentMultiplier}x`);
            return res.json({ success: true, cashedOut: true, payout, wallet });
        }
        const survives = Math.random() < 0.82;
        if (!survives) {
            return res.json({ success: true, crashed: true, payout: 0 });
        }
        const nextMult = parseFloat((currentMultiplier * 1.35).toFixed(2));
        res.json({ success: true, crashed: false, nextMultiplier: nextMult });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Slot Machine Spin
app.post('/api/games/slot/spin', (req, res) => {
    try {
        const userId = getUserId(req);
        const { gameId, stake } = req.body;
        const stakeNum = Number(stake) || 10;
        walletService_js_1.WalletService.debitStake(userId, stakeNum, 'SLOT_BET', `${gameId} Spin`);
        const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣'];
        const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
        const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
        const reel3 = symbols[Math.floor(Math.random() * symbols.length)];
        let multiplier = 0;
        if (reel1 === '7️⃣' && reel2 === '7️⃣' && reel3 === '7️⃣') {
            multiplier = 50;
        }
        else if (reel1 === reel2 && reel2 === reel3) {
            multiplier = 10;
        }
        else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
            multiplier = 1.5;
        }
        const payout = parseFloat((stakeNum * multiplier).toFixed(2));
        let finalWallet = walletService_js_1.WalletService.getOrCreateWallet(userId);
        if (payout > 0) {
            finalWallet = walletService_js_1.WalletService.creditWin(userId, payout, 'SLOT_WIN', `${gameId} Win`);
        }
        res.json({
            success: true,
            reels: [reel1, reel2, reel3],
            multiplier,
            payout,
            wallet: finalWallet
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Promotions
app.get('/api/promotions', (req, res) => {
    res.json({
        promotions: promotionService_js_1.PromotionService.getPromotions(),
        latestRain: promotionService_js_1.PromotionService.getLatestMoneyRain()
    });
});
app.post('/api/promotions/redeem', (req, res) => {
    try {
        const userId = getUserId(req);
        const { code } = req.body;
        const result = promotionService_js_1.PromotionService.redeemCoupon(userId, code);
        const wallet = walletService_js_1.WalletService.getOrCreateWallet(userId);
        res.json({ success: true, ...result, wallet });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
app.get('/api/promotions/money-rain', (req, res) => {
    res.json(promotionService_js_1.PromotionService.getLatestMoneyRain());
});
app.post('/api/promotions/money-rain/trigger', (req, res) => {
    const drop = promotionService_js_1.PromotionService.triggerMoneyRain(420, 21);
    io.emit('money_rain_drop', drop);
    res.json({ success: true, drop });
});
// Affiliate Dashboard
app.get('/api/affiliate', (req, res) => {
    const userId = getUserId(req);
    const user = userService_js_1.UserService.getUserById(userId);
    const username = user?.username || 'Player';
    const profile = affiliateService_js_1.AffiliateService.getOrCreateProfile(userId, username);
    const deepLink = affiliateService_js_1.AffiliateService.getDeepLink('@EdilBetET_bot', profile.affiliateCode);
    res.json({ profile, deepLink });
});
app.post('/api/affiliate/payout-number', (req, res) => {
    try {
        const userId = getUserId(req);
        const { phone } = req.body;
        const updated = affiliateService_js_1.AffiliateService.updatePayoutNumber(userId, phone);
        res.json({ success: true, profile: updated });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
app.post('/api/affiliate/withdraw', (req, res) => {
    try {
        const userId = getUserId(req);
        const result = affiliateService_js_1.AffiliateService.requestAffiliatePayout(userId);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// ------------------------------------
// SOCKET.IO REAL-TIME EVENTS
// ------------------------------------
io.on('connection', (socket) => {
    socket.emit('aviator_state', aviatorRoom.getState());
    socket.on('aviator_place_bet', (data) => {
        try {
            const uId = data.userId || 'EB-741891';
            const uName = data.username || 'Player';
            const bet = aviatorRoom.placeBet({
                userId: uId,
                username: uName,
                stake: Number(data.stake),
                autoCashout: data.autoCashout ? Number(data.autoCashout) : undefined
            });
            socket.emit('aviator_bet_confirmed', { ...bet, slot: data.slot || 1 });
            const wallet = walletService_js_1.WalletService.getOrCreateWallet(uId);
            socket.emit('wallet_updated', { userId: uId, wallet });
        }
        catch (err) {
            socket.emit('aviator_error', { message: err.message, slot: data.slot || 1 });
        }
    });
    socket.on('aviator_cancel_bet', (data) => {
        try {
            const uId = data.userId || 'EB-741891';
            const bet = aviatorRoom.cancelBet(data.betId || '', uId);
            socket.emit('aviator_bet_cancelled_success', { betId: bet.id, slot: data.slot || 1 });
            const wallet = walletService_js_1.WalletService.getOrCreateWallet(uId);
            socket.emit('wallet_updated', { userId: uId, wallet });
        }
        catch (err) {
            socket.emit('aviator_error', { message: err.message, slot: data.slot || 1 });
        }
    });
    socket.on('aviator_cash_out', (data) => {
        try {
            const uId = data.userId || 'EB-741891';
            const bet = aviatorRoom.executeCashout(data.betId, data.multiplier, uId);
            socket.emit('aviator_cashout_success', { ...bet, slot: data.slot || 1 });
            const wallet = walletService_js_1.WalletService.getOrCreateWallet(uId);
            socket.emit('wallet_updated', { userId: uId, wallet });
        }
        catch (err) {
            console.error('Aviator cashout error:', err.message);
            socket.emit('aviator_error', { message: err.message, slot: data.slot || 1 });
        }
    });
});
// Fallback for SPA routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
    }
    res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
});
const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Edil Bet (ዕድል ቤት) Server running on port ${PORT}`);
    console.log(`✈️ Aviator Real-Time Engine Active`);
    console.log(`🎱 Fast Keno & Casino Games Active`);
    console.log(`💳 Telebirr & CBE Cashier Ready`);
    console.log(`=======================================================`);
});
