export interface UserWallet {
  availableBalance: number;
  bonusBalance: number;
  wagerRemaining: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface DepositOrder {
  id: string;
  orderNumber: string;
  amount: number;
  paymentMethod: 'TELEBIRR' | 'CBE_BIRR';
  recipientPhone?: string;
  recipientAccount?: string;
  expiresAt: string;
  status: string;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  type: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface AviatorLiveBet {
  id: string;
  userId?: string;
  username: string;
  avatarLetter: string;
  stake: number;
  cashedOutAt?: number;
  payout: number;
  cashedOut: boolean;
}

export interface PromotionItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  status: string;
  minDeposit?: number;
  timeWindow?: string;
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
}
