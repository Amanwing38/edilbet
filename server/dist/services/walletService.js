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
    // Limits & Fees
    static MIN_DEPOSIT = 50;
    static MAX_DEPOSIT = 10000;
    static MIN_WITHDRAWAL = 50; // Accessible min withdrawal
    static MAX_WITHDRAWAL = 10000;
    static WITHDRAWAL_FEE = 50; // Fixed 50 ETB transfer fee
    static DAILY_WITHDRAWAL_LIMIT = 20000;
    static WITHDRAWAL_COOLDOWN_MS = 0; // Seamless instant processing
    /**
     * Initialize or retrieve user wallet
     */
    static getOrCreateWallet(userId) {
        let wallet = this.wallets.get(userId);
        if (!wallet) {
            // Admin account starts with demo funds; new user accounts start with 0.00 ETB
            const isAdmin = userId === 'EB-741891' || userId.includes('8148611275');
            wallet = {
                userId,
                currency: 'ETB',
                availableBalance: isAdmin ? 196.21 : 0.00,
                bonusBalance: 0.00,
                wagerRemaining: 0.00,
                totalDeposited: 0.00,
                totalWithdrawn: 0.00,
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
     * Instantly credits player's wallet upon receiving proof!
     */
    static submitDepositProof(orderId, referenceCode) {
        const order = this.transactions.get(orderId);
        if (!order) {
            throw new Error('Deposit order not found.');
        }
        if (order.status === 'COMPLETED' || order.status === 'APPROVED') {
            const wallet = this.getOrCreateWallet(order.userId);
            return { order, wallet };
        }
        const trimmedCode = referenceCode.trim().toUpperCase();
        if (this.usedReferenceCodes.has(trimmedCode)) {
            throw new Error('This Transaction ID has already been submitted or approved. Duplicate submissions are not allowed.');
        }
        this.usedReferenceCodes.add(trimmedCode);
        order.referenceCode = trimmedCode;
        order.status = 'COMPLETED';
        order.settledAt = new Date().toISOString();
        order.adminNote = 'Customer submitted payment proof. Balance instantly credited.';
        // Instantly credit player's wallet
        const wallet = this.getOrCreateWallet(order.userId);
        wallet.availableBalance = parseFloat((wallet.availableBalance + order.amount).toFixed(2));
        wallet.totalDeposited = parseFloat((wallet.totalDeposited + order.amount).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        return { order, wallet };
    }
    /**
     * Admin verifies SMS and Approves Deposit (Instant Balance Credit)
     */
    static approveDeposit(orderId, adminUsername) {
        const order = this.transactions.get(orderId);
        if (!order) {
            throw new Error('Deposit order not found.');
        }
        const wallet = this.getOrCreateWallet(order.userId);
        if (order.status === 'APPROVED' || order.status === 'COMPLETED') {
            return { order, wallet };
        }
        order.status = 'APPROVED';
        order.settledAt = new Date().toISOString();
        order.adminNote = `Approved by admin ${adminUsername} via SMS verification.`;
        if (order.referenceCode) {
            this.usedReferenceCodes.add(order.referenceCode);
        }
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
     * Request Withdrawal with Choice of CBE or Telebirr
     * Deducts amount + 50 ETB transfer fee immediately!
     */
    static requestWithdrawal(params) {
        const { userId, username, amount, paymentMethod, phone, cbeAccount, accountHolderName } = params;
        const wallet = this.getOrCreateWallet(userId);
        const fee = this.WITHDRAWAL_FEE; // 50 ETB
        const totalDebit = parseFloat((amount + fee).toFixed(2));
        // 1. Minimum & Maximum Limits
        if (amount < this.MIN_WITHDRAWAL) {
            throw new Error(`ዝቅተኛ የማውጣት መጠን ${this.MIN_WITHDRAWAL} ብር ነው። (Minimum withdrawal is ${this.MIN_WITHDRAWAL} ETB)`);
        }
        if (amount > this.MAX_WITHDRAWAL) {
            throw new Error(`ከፍተኛ የማውጣት መጠን በአንድ ጊዜ ${this.MAX_WITHDRAWAL} ብር ነው። (Maximum withdrawal is ${this.MAX_WITHDRAWAL} ETB)`);
        }
        // 2. Validate Method Details
        if (paymentMethod === 'TELEBIRR') {
            if (!phone || phone.trim().length < 9) {
                throw new Error('እባክዎ ትክክለኛ የቴሌብር ስልክ ቁጥር ያስገቡ! (Please enter a valid Telebirr phone number)');
            }
        }
        else {
            if (!cbeAccount || cbeAccount.trim().length < 10) {
                throw new Error('እባክዎ ትክክለኛ የንግድ ባንክ (CBE) ሂሳብ ቁጥር ያስገቡ! (Please enter a valid 13-digit CBE account number)');
            }
            if (!accountHolderName || accountHolderName.trim().length < 3) {
                throw new Error('እባክዎ የሂሳብ ባለቤቱን ሙሉ ስም ያስገቡ! (Please enter the CBE account holder full name)');
            }
        }
        // 3. Balance Check: amount + 50 ETB fee
        if (wallet.availableBalance < totalDebit) {
            throw new Error(`ቀሪ ሂሳብዎ በቂ አይደለም! ${amount} ብር ለማውጣት ከ 50 ብር የዝውውር ክፍያ ጋር ድምር ${totalDebit} ብር በሂሳብዎ ውስጥ ሊኖር ይገባል። የአሁኑ ቀሪ ሂሳብዎ: ${wallet.availableBalance.toFixed(2)} ብር ነው።`);
        }
        // 4. Bonus Wagering Protection
        let bonusCancelled = false;
        if (wallet.bonusBalance > 0 || wallet.wagerRemaining > 0) {
            wallet.bonusBalance = 0;
            wallet.wagerRemaining = 0;
            bonusCancelled = true;
        }
        // 5. Lock and Deduct Balance Atomically (Amount + 50 ETB Transfer Fee)
        wallet.availableBalance = parseFloat((wallet.availableBalance - totalDebit).toFixed(2));
        wallet.totalWithdrawn = parseFloat((wallet.totalWithdrawn + amount).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        const tx = {
            id: (0, uuid_1.v4)(),
            orderNumber: `WD-${Date.now().toString().slice(-6)}`,
            userId,
            username,
            type: 'WITHDRAWAL',
            amount: -amount,
            fee,
            paymentMethod,
            recipientPhone: phone,
            recipientAccount: cbeAccount,
            accountHolderName,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        this.transactions.set(tx.id, tx);
        return { transaction: tx, wallet, bonusCancelled };
    }
    /**
     * Complete Withdrawal (Admin marked as paid)
     */
    static completeWithdrawal(txId, adminUsername) {
        const tx = this.transactions.get(txId);
        if (!tx)
            throw new Error('Transaction not found.');
        if (tx.status === 'COMPLETED')
            return tx;
        tx.status = 'COMPLETED';
        tx.settledAt = new Date().toISOString();
        tx.adminNote = `Paid & dispatched by admin ${adminUsername}`;
        return tx;
    }
    /**
     * Reject Withdrawal & Refund (Amount + 50 ETB Fee)
     */
    static rejectWithdrawal(txId, reason) {
        const tx = this.transactions.get(txId);
        if (!tx)
            throw new Error('Transaction not found.');
        if (tx.status === 'REJECTED') {
            const wallet = this.getOrCreateWallet(tx.userId);
            return { transaction: tx, wallet };
        }
        tx.status = 'REJECTED';
        tx.settledAt = new Date().toISOString();
        tx.adminNote = reason || 'Withdrawal rejected by admin. Funds refunded.';
        // Refund full amount + 50 ETB fee
        const refundTotal = Math.abs(tx.amount) + (tx.fee || 50);
        const wallet = this.getOrCreateWallet(tx.userId);
        wallet.availableBalance = parseFloat((wallet.availableBalance + refundTotal).toFixed(2));
        wallet.totalWithdrawn = Math.max(0, parseFloat((wallet.totalWithdrawn - Math.abs(tx.amount)).toFixed(2)));
        wallet.updatedAt = new Date().toISOString();
        return { transaction: tx, wallet };
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
