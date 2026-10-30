import { Promotion, MoneyRainDrop, MoneyRainWinner } from '../types.js';
import { v4 as uuidv4 } from 'uuid';
import { WalletService } from './walletService.js';

export class PromotionService {
  private static coupons: Map<string, { amount: number; maxUses: number; usedCount: number }> = new Map([
    ['EDIL2026', { amount: 50, maxUses: 1000, usedCount: 12 }],
    ['TELEBIRR', { amount: 25, maxUses: 500, usedCount: 45 }],
    ['VIPBONUS', { amount: 100, maxUses: 200, usedCount: 5 }]
  ]);

  private static redeemedUsers: Set<string> = new Set(); // userId:couponCode

  private static activePromotions: Promotion[] = [
    {
      id: 'promo-1',
      title: 'MORNING DEPOSIT BOOST',
      subtitle: 'Get 10.00% reward on your next eligible action.',
      type: 'OFFER',
      badgeText: '10% Bonus',
      status: 'SCHEDULED',
      minDeposit: 50,
      bonusPercent: 10,
      timeWindow: '06:00 - 12:00',
      expiryDate: 'Until Dec 31',
      actionText: 'Play Games'
    },
    {
      id: 'promo-2',
      title: 'DAILY CASHBACK',
      subtitle: 'Get 15% cashback on your losses every day',
      type: 'CASHBACK',
      badgeText: '15% Daily Cashback',
      status: 'ACTIVE',
      bonusPercent: 15,
      expiryDate: 'Ongoing',
      actionText: 'Play Games'
    },
    {
      id: 'promo-3',
      title: '100% MATCH ON YOUR FIRST DEPOSIT UP TO 500 BIRR',
      subtitle: 'Claim Your 500 Birr Bonus! Get a 100% match on your first deposit.',
      type: 'OFFER',
      badgeText: '100% Match',
      status: 'ACTIVE',
      minDeposit: 49,
      bonusAmount: 500,
      expiryDate: 'Until Dec 31',
      actionText: 'Deposit'
    }
  ];

  private static moneyRainHistory: MoneyRainDrop[] = [
    {
      id: 'rain-1',
      totalAmount: 420,
      recipientsCount: 21,
      amountPerWinner: 20,
      timestamp: new Date().toISOString(),
      winners: [
        { username: 'Besu**', maskedPhone: '251*****9644', amount: 20 },
        { username: 'dave**', maskedPhone: '251*****5168', amount: 20 },
        { username: 'Abdu**', maskedPhone: '251*****1036', amount: 20 },
        { username: 'Gez**', maskedPhone: '251*****2461', amount: 20 },
        { username: 'Esma**', maskedPhone: '251*****0309', amount: 20 },
        { username: 'Mahi**', maskedPhone: '251*****8182', amount: 20 },
        { username: 'zam**', maskedPhone: '251*****2351', amount: 20 },
        { username: 'Fff**', maskedPhone: '251*****8287', amount: 20 },
        { username: '@mem**', maskedPhone: '251*****4539', amount: 20 },
        { username: 'Ayes**', maskedPhone: '251*****3157', amount: 20 },
        { username: 'dagn**', maskedPhone: '251*****2880', amount: 20 }
      ]
    }
  ];

  static getPromotions(): Promotion[] {
    return this.activePromotions;
  }

  static redeemCoupon(userId: string, code: string): { amount: number; message: string } {
    const upper = code.trim().toUpperCase();
    const coupon = this.coupons.get(upper);
    if (!coupon) {
      throw new Error('Invalid coupon code. Please check and try again.');
    }

    const key = `${userId}:${upper}`;
    if (this.redeemedUsers.has(key)) {
      throw new Error('You have already redeemed this coupon code.');
    }

    if (coupon.usedCount >= coupon.maxUses) {
      throw new Error('This coupon has reached its maximum redemptions.');
    }

    coupon.usedCount++;
    this.redeemedUsers.add(key);

    // Credit bonus to wallet
    const wallet = WalletService.getOrCreateWallet(userId);
    wallet.availableBalance = parseFloat((wallet.availableBalance + coupon.amount).toFixed(2));
    wallet.updatedAt = new Date().toISOString();

    return {
      amount: coupon.amount,
      message: `Coupon successfully redeemed! ${coupon.amount} ETB added to your wallet.`
    };
  }

  static getLatestMoneyRain(): MoneyRainDrop {
    return this.moneyRainHistory[0];
  }

  static triggerMoneyRain(totalAmount: number = 420, recipients: number = 21): MoneyRainDrop {
    const amountPerRecipient = parseFloat((totalAmount / recipients).toFixed(2));
    const sampleNames = ['Besu', 'dave', 'Abdu', 'Gez', 'Esma', 'Mahi', 'zam', 'Fff', 'Ayes', 'dagn', 'Sami', 'Tedi', 'Blen'];
    
    const winners: MoneyRainWinner[] = Array.from({ length: recipients }, (_, i) => {
      const name = sampleNames[i % sampleNames.length] + '**';
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      return {
        username: name,
        maskedPhone: `251*****${randomDigits}`,
        amount: amountPerRecipient
      };
    });

    const drop: MoneyRainDrop = {
      id: uuidv4(),
      totalAmount,
      recipientsCount: recipients,
      amountPerWinner: amountPerRecipient,
      winners,
      timestamp: new Date().toISOString()
    };

    this.moneyRainHistory.unshift(drop);
    return drop;
  }
}
