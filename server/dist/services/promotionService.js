"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
const uuid_1 = require("uuid");
const walletService_js_1 = require("./walletService.js");
class PromotionService {
    static coupons = new Map([
        ['EDIL2026', { amount: 50, maxUses: 1000, usedCount: 12 }],
        ['TELEBIRR', { amount: 25, maxUses: 500, usedCount: 45 }],
        ['VIPBONUS', { amount: 100, maxUses: 200, usedCount: 5 }]
    ]);
    static redeemedUsers = new Set(); // userId:couponCode
    static activePromotions = [
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
    static moneyRainHistory = [
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
    static getPromotions() {
        return this.activePromotions;
    }
    static redeemCoupon(userId, code) {
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
        const wallet = walletService_js_1.WalletService.getOrCreateWallet(userId);
        wallet.availableBalance = parseFloat((wallet.availableBalance + coupon.amount).toFixed(2));
        wallet.updatedAt = new Date().toISOString();
        return {
            amount: coupon.amount,
            message: `Coupon successfully redeemed! ${coupon.amount} ETB added to your wallet.`
        };
    }
    static getLatestMoneyRain() {
        return this.moneyRainHistory[0];
    }
    static triggerMoneyRain(totalAmount = 420, recipients = 21) {
        const amountPerRecipient = parseFloat((totalAmount / recipients).toFixed(2));
        const sampleNames = ['Besu', 'dave', 'Abdu', 'Gez', 'Esma', 'Mahi', 'zam', 'Fff', 'Ayes', 'dagn', 'Sami', 'Tedi', 'Blen'];
        const winners = Array.from({ length: recipients }, (_, i) => {
            const name = sampleNames[i % sampleNames.length] + '**';
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            return {
                username: name,
                maskedPhone: `251*****${randomDigits}`,
                amount: amountPerRecipient
            };
        });
        const drop = {
            id: (0, uuid_1.v4)(),
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
exports.PromotionService = PromotionService;
