export interface User {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  phoneNumber?: string;
  language: 'am' | 'en';
  role: 'user' | 'admin';
  referredBy?: string;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  currency: 'ETB';
  availableBalance: number;
  bonusBalance: number;
  wagerRemaining: number;
  totalDeposited: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'AVIATOR_BET'
  | 'AVIATOR_WIN'
  | 'AVIATOR_REFUND'
  | 'KENO_BET'
  | 'KENO_WIN'
  | 'SLOT_BET'
  | 'SLOT_WIN'
  | 'CHICKEN_BET'
  | 'CHICKEN_WIN'
  | 'MONEY_RAIN'
  | 'CASHBACK'
  | 'BONUS'
  | 'AFFILIATE_COMMISSION'
  | 'AFFILIATE_PAYOUT';

export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Transaction {
  id: string;
  orderNumber: string;
  userId: string;
  username: string;
  type: TransactionType;
  amount: number;
  fee: number;
  paymentMethod: 'TELEBIRR' | 'CBE_BIRR' | 'CBE_BANK' | 'WALLET';
  senderPhone?: string;
  recipientPhone?: string;
  recipientAccount?: string;
  accountHolderName?: string;
  referenceCode?: string; // Telebirr Trans ID / CBE memo code
  status: TransactionStatus;
  adminNote?: string;
  createdAt: string;
  expiresAt?: string;
  settledAt?: string;
}

export type AviatorState = 'BETTING' | 'FLYING' | 'CRASHED';

export interface AviatorRound {
  id: string;
  roundNumber: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  crashMultiplier: number;
  state: AviatorState;
  currentMultiplier: number;
  flightDurationMs: number;
  bettingCountdownSec: number;
  startedAt: number;
  crashedAt?: number;
}

export interface AviatorBet {
  id: string;
  roundId: string;
  userId: string;
  username: string;
  avatarLetter: string;
  stake: number;
  autoCashout?: number;
  cashedOutAt?: number;
  payout: number;
  isWon: boolean;
  cashedOut: boolean;
}

export interface KenoGame {
  id: string;
  userId: string;
  stake: number;
  pickedNumbers: number[];
  drawnNumbers: number[];
  matchedNumbers: number[];
  multiplier: number;
  payout: number;
  createdAt: string;
}

export interface AffiliateProfile {
  id: string;
  userId: string;
  affiliateCode: string;
  revSharePercentage: number;
  totalEarnings: number;
  availableBalance: number;
  onHoldBalance: number;
  telebirrPayoutNumber: string;
  referredPlayers: {
    userId: string;
    username: string;
    joinedAt: string;
    totalDeposited: number;
    activeThisWeek: boolean;
  }[];
  activePlayersCount: number;
  minPayoutThreshold: number; // 500 ETB
  minActivePlayersRequired: number; // 3 players
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  type: 'OFFER' | 'CASHBACK' | 'RAIN';
  badgeText: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  minDeposit?: number;
  bonusPercent?: number;
  bonusAmount?: number;
  timeWindow?: string;
  expiryDate: string;
  actionText: string;
}

export interface MoneyRainWinner {
  username: string;
  maskedPhone: string;
  amount: number;
}

export interface MoneyRainDrop {
  id: string;
  totalAmount: number;
  recipientsCount: number;
  amountPerWinner: number;
  winners: MoneyRainWinner[];
  timestamp: string;
}
