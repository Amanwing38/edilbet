"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path_1.default.join(DATA_DIR, 'edilbet_db.json');
const TMP_FILE = path_1.default.join(DATA_DIR, 'edilbet_db.json.tmp');
class DBService {
    static users = new Map();
    static usersByTelegramId = new Map();
    static wallets = new Map();
    static transactions = new Map();
    static isInitialized = false;
    static init() {
        if (this.isInitialized)
            return;
        console.log(`📦 Loading persistent database from: ${DB_FILE}`);
        if (fs_1.default.existsSync(DB_FILE)) {
            try {
                const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
                const data = JSON.parse(raw);
                if (data.users) {
                    for (const [id, user] of Object.entries(data.users)) {
                        this.users.set(id, user);
                        if (user.telegramId) {
                            this.usersByTelegramId.set(user.telegramId, id);
                        }
                    }
                }
                if (data.wallets) {
                    for (const [id, wallet] of Object.entries(data.wallets)) {
                        this.wallets.set(id, wallet);
                    }
                }
                if (data.transactions) {
                    for (const [id, tx] of Object.entries(data.transactions)) {
                        this.transactions.set(id, tx);
                    }
                }
                console.log(`✅ Loaded ${this.users.size} users, ${this.wallets.size} wallets, and ${this.transactions.size} transactions from persistent database.`);
            }
            catch (err) {
                console.error('⚠️ Could not parse existing database file. Starting fresh:', err.message);
            }
        }
        else {
            console.log('🌱 No existing database found. Creating new persistent database store.');
            this.persist();
        }
        this.isInitialized = true;
    }
    /**
     * Atomic persistence to disk (Write to temp file then atomic rename)
     */
    static persist() {
        try {
            const dump = {
                users: Object.fromEntries(this.users),
                usersByTelegramId: Object.fromEntries(this.usersByTelegramId),
                wallets: Object.fromEntries(this.wallets),
                transactions: Object.fromEntries(this.transactions)
            };
            const jsonStr = JSON.stringify(dump, null, 2);
            fs_1.default.writeFileSync(TMP_FILE, jsonStr, 'utf-8');
            fs_1.default.renameSync(TMP_FILE, DB_FILE);
        }
        catch (err) {
            console.error('⚠️ Database persist error:', err.message);
        }
    }
    // -------------------------------------------------------------
    // USER OPERATIONS
    // -------------------------------------------------------------
    static getUserByTelegramId(telegramId) {
        this.init();
        const userId = this.usersByTelegramId.get(telegramId);
        if (!userId)
            return null;
        return this.users.get(userId) || null;
    }
    static getUserById(id) {
        this.init();
        return this.users.get(id) || null;
    }
    static saveUser(user) {
        this.init();
        this.users.set(user.id, user);
        if (user.telegramId) {
            this.usersByTelegramId.set(user.telegramId, user.id);
        }
        this.persist();
    }
    static updateUserPhone(telegramId, phone) {
        this.init();
        const userId = this.usersByTelegramId.get(telegramId);
        if (userId) {
            const user = this.users.get(userId);
            if (user) {
                user.phoneNumber = phone;
                this.persist();
            }
        }
    }
    static countUsers() {
        this.init();
        return this.users.size;
    }
    // -------------------------------------------------------------
    // WALLET OPERATIONS
    // -------------------------------------------------------------
    static getWallet(userId) {
        this.init();
        const w = this.wallets.get(userId);
        if (!w)
            return null;
        return { ...w };
    }
    static saveWallet(wallet) {
        this.init();
        this.wallets.set(wallet.userId, { ...wallet });
        this.persist();
    }
    // -------------------------------------------------------------
    // TRANSACTION OPERATIONS
    // -------------------------------------------------------------
    static saveTransaction(tx) {
        this.init();
        this.transactions.set(tx.id, { ...tx });
        this.persist();
    }
    static getTransactionById(id) {
        this.init();
        const tx = this.transactions.get(id);
        return tx ? { ...tx } : null;
    }
    static getTransactionByReference(code) {
        this.init();
        const trimmed = code.trim().toUpperCase();
        for (const tx of this.transactions.values()) {
            if (tx.referenceCode && tx.referenceCode.trim().toUpperCase() === trimmed) {
                return { ...tx };
            }
        }
        return null;
    }
    static getUserTransactions(userId) {
        this.init();
        return Array.from(this.transactions.values())
            .filter((t) => t.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    static getPendingDeposits() {
        this.init();
        return Array.from(this.transactions.values())
            .filter((t) => t.type === 'DEPOSIT' && t.status === 'PENDING')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    static getPendingWithdrawals() {
        this.init();
        return Array.from(this.transactions.values())
            .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    static getPlatformStats() {
        this.init();
        let totalDeposited = 0;
        let totalWithdrawn = 0;
        let totalBalance = 0;
        for (const w of this.wallets.values()) {
            totalDeposited += w.totalDeposited || 0;
            totalWithdrawn += w.totalWithdrawn || 0;
            totalBalance += w.availableBalance || 0;
        }
        return {
            totalUsers: this.users.size,
            totalWallets: this.wallets.size,
            totalDeposited: parseFloat(totalDeposited.toFixed(2)),
            totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
            totalBalance: parseFloat(totalBalance.toFixed(2)),
            totalTransactions: this.transactions.size,
            recentUsers: Array.from(this.users.values()).slice(-10).reverse()
        };
    }
}
exports.DBService = DBService;
