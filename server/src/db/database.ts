import path from 'path';
import fs from 'fs';
import { User, Wallet, Transaction } from '../types.js';

interface DatabaseSchema {
  users: Record<string, User>;
  usersByTelegramId: Record<number, string>; // telegramId -> userId
  wallets: Record<string, Wallet>;
  transactions: Record<string, Transaction>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'edilbet_db.json');
const TMP_FILE = path.join(DATA_DIR, 'edilbet_db.json.tmp');

export class DBService {
  private static users: Map<string, User> = new Map();
  private static usersByTelegramId: Map<number, string> = new Map();
  private static wallets: Map<string, Wallet> = new Map();
  private static transactions: Map<string, Transaction> = new Map();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;

    console.log(`📦 Loading persistent database from: ${DB_FILE}`);
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);

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
      } catch (err: any) {
        console.error('⚠️ Could not parse existing database file. Starting fresh:', err.message);
      }
    } else {
      console.log('🌱 No existing database found. Creating new persistent database store.');
      this.persist();
    }

    this.isInitialized = true;
  }

  /**
   * Atomic persistence to disk (Write to temp file then atomic rename)
   */
  private static persist(): void {
    try {
      const dump: DatabaseSchema = {
        users: Object.fromEntries(this.users),
        usersByTelegramId: Object.fromEntries(this.usersByTelegramId),
        wallets: Object.fromEntries(this.wallets),
        transactions: Object.fromEntries(this.transactions)
      };

      const jsonStr = JSON.stringify(dump, null, 2);
      fs.writeFileSync(TMP_FILE, jsonStr, 'utf-8');
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err: any) {
      console.error('⚠️ Database persist error:', err.message);
    }
  }

  // -------------------------------------------------------------
  // USER OPERATIONS
  // -------------------------------------------------------------
  static getUserByTelegramId(telegramId: number): User | null {
    this.init();
    const userId = this.usersByTelegramId.get(telegramId);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  static getUserById(id: string): User | null {
    this.init();
    return this.users.get(id) || null;
  }

  static saveUser(user: User): void {
    this.init();
    this.users.set(user.id, user);
    if (user.telegramId) {
      this.usersByTelegramId.set(user.telegramId, user.id);
    }
    this.persist();
  }

  static updateUserPhone(telegramId: number, phone: string): void {
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

  static countUsers(): number {
    this.init();
    return this.users.size;
  }

  // -------------------------------------------------------------
  // WALLET OPERATIONS
  // -------------------------------------------------------------
  static getWallet(userId: string): Wallet | null {
    this.init();
    const w = this.wallets.get(userId);
    if (!w) return null;
    return { ...w };
  }

  static saveWallet(wallet: Wallet): void {
    this.init();
    this.wallets.set(wallet.userId, { ...wallet });
    this.persist();
  }

  // -------------------------------------------------------------
  // TRANSACTION OPERATIONS
  // -------------------------------------------------------------
  static saveTransaction(tx: Transaction): void {
    this.init();
    this.transactions.set(tx.id, { ...tx });
    this.persist();
  }

  static getTransactionById(id: string): Transaction | null {
    this.init();
    const tx = this.transactions.get(id);
    return tx ? { ...tx } : null;
  }

  static getTransactionByReference(code: string): Transaction | null {
    this.init();
    const trimmed = code.trim().toUpperCase();
    for (const tx of this.transactions.values()) {
      if (tx.referenceCode && tx.referenceCode.trim().toUpperCase() === trimmed) {
        return { ...tx };
      }
    }
    return null;
  }

  static getUserTransactions(userId: string): Transaction[] {
    this.init();
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getPendingDeposits(): Transaction[] {
    this.init();
    return Array.from(this.transactions.values())
      .filter((t) => t.type === 'DEPOSIT' && t.status === 'PENDING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getPendingWithdrawals(): Transaction[] {
    this.init();
    return Array.from(this.transactions.values())
      .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
