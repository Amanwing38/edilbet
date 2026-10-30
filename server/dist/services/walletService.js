"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const uuid_1 = require("uuid");
class WalletService {
    static wallets = new Map();
    static transactions = new Map();
    static usedReferenceCodes = new Set();
    static lastWithdrawalTimestamps = new Map();
    static dailyWithdrawalAmounts = new Map();
    // Platform Cashier Configuration
    static TELEBIRR_RECIPIENT = '0938749239';
    static CBE_RECIPIENT = '1000450457047';
    // Limits
    static MIN_DEPOSIT = 50;
    static MAX_DEPOSIT = 10000;
    static MIN_WITHDRAWAL = 500;
    static MAX_WITHDRAWAL = 2000;
    static DAILY_WITHDRAWAL_LIMIT = 5000;
    static WITHDRAWAL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
    /**
     * Initialize or retrieve user wallet
     */
    static getOrCreateWallet(userId) {
        let wallet = this.wallets.get(userId);
        if (!wallet) {
            wallet = {
                userId,
                currency: 'ETB',
                availableBalance: 196.21, // Realistic starter balance matching the demo screenshots
                bonusBalance: 0.60,
                wagerRemaining: 54.00,
                totalDeposited: 0,
                totalWithdrawn: 0,
                updatedAt: new Date().toISOString()
            };
            this.wallets.set(userId, wallet);
        }
        return wallet;
    }
    /**
     * Debit stake atomically for games
     */
    static debitStake(userId, stake, type, meta) {
        const wallet = this.getOrCreateWallet(userId);
        if (wallet.availableBalance < stake) {
            throw new Error(`Insufficient balance. Required: ${stake} ETB, Available: ${wallet.availableBalance} ETB`);
        }
        wallet.availableBalance = parseFloat((wallet.availableBalance - stake).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        // Deduct wagering requirement if active
        if (wallet.wagerRemaining > 0) {
            wallet.wagerRemaining = Math.max(0, parseFloat((wallet.wagerRemaining - stake).toFixed(2)));
        }
        // Record ledger transaction
        const tx = {
            id: (0, uuid_1.v4)(),
            orderNumber: `TX-${Date.now().toString().slice(-6)}`,
            userId,
            username: meta || 'Player',
            type,
            amount: -stake,
            fee: 0,
            paymentMethod: 'WALLET',
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
            settledAt: new Date().toISOString()
        };
        this.transactions.set(tx.id, tx);
        return wallet;
    }
    /**
     * Credit win atomically for games
     */
    static creditWin(userId, payout, type, meta) {
        const wallet = this.getOrCreateWallet(userId);
        wallet.availableBalance = parseFloat((wallet.availableBalance + payout).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        const tx = {
            id: (0, uuid_1.v4)(),
            orderNumber: `WIN-${Date.now().toString().slice(-6)}`,
            userId,
            username: meta || 'Player',
            type,
            amount: payout,
            fee: 0,
            paymentMethod: 'WALLET',
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
            settledAt: new Date().toISOString()
        };
        this.transactions.set(tx.id, tx);
        return wallet;
    }
    /**
     * Create a Telebirr or CBE Deposit Order (Step 1)
     */
    static createDepositOrder(params) {
        const { userId, username, amount, paymentMethod, senderPhone } = params;
        if (amount < this.MIN_DEPOSIT || amount > this.MAX_DEPOSIT) {
            throw new Error(`Deposit amount must be between ${this.MIN_DEPOSIT} and ${this.MAX_DEPOSIT} ETB.`);
        }
        if (!senderPhone || senderPhone.length < 9) {
            throw new Error('Please provide a valid 10-digit phone number (e.g. 09xxxxxxxx).');
        }
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes expiration
        const order = {
            id: (0, uuid_1.v4)(),
            orderNumber,
            userId,
            username,
            type: 'DEPOSIT',
            amount,
            fee: 0,
            paymentMethod,
            senderPhone,
            recipientPhone: paymentMethod === 'TELEBIRR' ? this.TELEBIRR_RECIPIENT : undefined,
            recipientAccount: paymentMethod === 'CBE_BIRR' ? this.CBE_RECIPIENT : undefined,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            expiresAt
        };
        this.transactions.set(order.id, order);
        return order;
    }
    /**
     * Customer submits proof / Transaction ID after transferring (Step 2: I've Paid)
     */
    static submitDepositProof(orderId, referenceCode) {
        const order = this.transactions.get(orderId);
        if (!order) {
            throw new Error('Deposit order not found.');
        }
        if (order.status !== 'PENDING') {
            throw new Error(`Order is already ${order.status}.`);
        }
        if (order.expiresAt && new Date(order.expiresAt).getTime() < Date.now()) {
            order.status = 'EXPIRED';
            throw new Error('Order expired. Please create a new deposit request.');
        }
        const trimmedCode = referenceCode.trim().toUpperCase();
        if (this.usedReferenceCodes.has(trimmedCode)) {
            throw new Error('This Transaction ID has already been submitted or approved. Duplicate submissions are not allowed.');
        }
        order.referenceCode = trimmedCode;
        order.adminNote = 'Customer marked as paid. Awaiting cashier SMS verification.';
        return order;
    }
    /**
     * Admin verifies SMS and Approves Deposit (Instant Balance Credit)
     */
    static approveDeposit(orderId, adminUsername) {
        const order = this.transactions.get(orderId);
        if (!order) {
            throw new Error('Deposit order not found.');
        }
        if (order.status === 'APPROVED' || order.status === 'COMPLETED') {
            throw new Error('Order is already approved.');
        }
        order.status = 'APPROVED';
        order.settledAt = new Date().toISOString();
        order.adminNote = `Approved by admin ${adminUsername} via SMS verification.`;
        if (order.referenceCode) {
            this.usedReferenceCodes.add(order.referenceCode);
        }
        const wallet = this.getOrCreateWallet(order.userId);
        wallet.availableBalance = parseFloat((wallet.availableBalance + order.amount).toFixed(2));
        wallet.totalDeposited = parseFloat((wallet.totalDeposited + order.amount).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        return { order, wallet };
    }
    /**
     * Admin Rejects Fake or Unmatched Deposit
     */
    static rejectDeposit(orderId, reason) {
        const order = this.transactions.get(orderId);
        if (!order) {
            throw new Error('Deposit order not found.');
        }
        order.status = 'REJECTED';
        order.adminNote = reason || 'Deposit rejected: SMS proof did not match platform account.';
        order.settledAt = new Date().toISOString();
        return order;
    }
    /**
     * Request Withdrawal with Limits & Wagering Protection
     */
    static requestWithdrawal(params) {
        const { userId, username, amount, phone } = params;
        const wallet = this.getOrCreateWallet(userId);
        // 1. Minimum & Maximum Limits
        if (amount < this.MIN_WITHDRAWAL) {
            throw new Error(`Minimum withdrawal amount is ${this.MIN_WITHDRAWAL} ETB. Your balance: ${wallet.availableBalance} ETB`);
        }
        if (amount > this.MAX_WITHDRAWAL) {
            throw new Error(`Maximum withdrawal per request is ${this.MAX_WITHDRAWAL} ETB.`);
        }
        // 2. Available Balance Check
        if (wallet.availableBalance < amount) {
            throw new Error(`Insufficient available balance. You requested ${amount} ETB, but only have ${wallet.availableBalance} ETB.`);
        }
        // 3. Hourly Throttle Check (1 request every 1 hour)
        const now = Date.now();
        const lastTime = this.lastWithdrawalTimestamps.get(userId) || 0;
        if (now - lastTime < this.WITHDRAWAL_COOLDOWN_MS) {
            const waitMinutes = Math.ceil((this.WITHDRAWAL_COOLDOWN_MS - (now - lastTime)) / 60000);
            throw new Error(`You can only submit 1 withdrawal request per hour. Please wait ${waitMinutes} minutes.`);
        }
        // 4. Daily Limit Check (5,000 ETB daily allowance)
        const todayStr = new Date().toISOString().slice(0, 10);
        const dailyRec = this.dailyWithdrawalAmounts.get(userId);
        const currentDailyAmount = (dailyRec && dailyRec.date === todayStr) ? dailyRec.amount : 0;
        if (currentDailyAmount + amount > this.DAILY_WITHDRAWAL_LIMIT) {
            const leftToday = Math.max(0, this.DAILY_WITHDRAWAL_LIMIT - currentDailyAmount);
            throw new Error(`Daily limit exceeded. You have ${leftToday} ETB left today of your 5,000 ETB allowance.`);
        }
        // 5. Bonus Wagering Protection
        let bonusCancelled = false;
        if (wallet.bonusBalance > 0 || wallet.wagerRemaining > 0) {
            // User is informed that withdrawing cancels pending bonus funds
            wallet.bonusBalance = 0;
            wallet.wagerRemaining = 0;
            bonusCancelled = true;
        }
        // 6. Lock and Deduct Balance Atomically
        wallet.availableBalance = parseFloat((wallet.availableBalance - amount).toFixed(2));
        wallet.totalWithdrawn = parseFloat((wallet.totalWithdrawn + amount).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        // Update trackers
        this.lastWithdrawalTimestamps.set(userId, now);
        this.dailyWithdrawalAmounts.set(userId, { date: todayStr, amount: currentDailyAmount + amount });
        const tx = {
            id: (0, uuid_1.v4)(),
            orderNumber: `WD-${Date.now().toString().slice(-6)}`,
            userId,
            username,
            type: 'WITHDRAWAL',
            amount: -amount,
            fee: 0,
            paymentMethod: 'TELEBIRR',
            recipientPhone: phone,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        this.transactions.set(tx.id, tx);
        return { transaction: tx, wallet, bonusCancelled };
    }
    /**
     * List all transactions for a user
     */
    static getUserTransactions(userId) {
        return Array.from(this.transactions.values())
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * List pending deposits for Admin Cashier Dashboard
     */
    static getPendingDeposits() {
        return Array.from(this.transactions.values())
            .filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * List pending withdrawals for Admin Cashier Dashboard
     */
    static getPendingWithdrawals() {
        return Array.from(this.transactions.values())
            .filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
exports.WalletService = WalletService;
