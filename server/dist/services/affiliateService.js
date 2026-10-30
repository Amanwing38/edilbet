"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateService = void 0;
class AffiliateService {
    static profiles = new Map();
    static getOrCreateProfile(userId, username) {
        let profile = this.profiles.get(userId);
        if (!profile) {
            const affiliateCode = `AFF-${Math.floor(100000 + Math.random() * 900000)}`;
            profile = {
                id: `aff-${Date.now()}`,
                userId,
                affiliateCode,
                revSharePercentage: 10.0,
                totalEarnings: 0.0,
                availableBalance: 0.0,
                onHoldBalance: 0.0,
                telebirrPayoutNumber: '0938749239',
                activePlayersCount: 1,
                minPayoutThreshold: 500.0,
                minActivePlayersRequired: 3,
                referredPlayers: [
                    {
                        userId: 'user-driveaddis',
                        username: 'DriveAddis',
                        joinedAt: new Date().toLocaleDateString('en-US'),
                        totalDeposited: 1500,
                        activeThisWeek: true
                    }
                ]
            };
            this.profiles.set(userId, profile);
        }
        return profile;
    }
    static getDeepLink(botUsername, affiliateCode) {
        const cleanBot = botUsername.replace('@', '');
        return `https://t.me/${cleanBot}?startapp=ref_${affiliateCode}`;
    }
    static updatePayoutNumber(userId, phoneNumber) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error('Affiliate profile not found.');
        }
        profile.telebirrPayoutNumber = phoneNumber.trim();
        return profile;
    }
    static requestAffiliatePayout(userId) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error('Affiliate profile not found.');
        }
        if (profile.availableBalance < profile.minPayoutThreshold) {
            throw new Error(`Minimum payout threshold is ${profile.minPayoutThreshold} ETB. Your available balance is ${profile.availableBalance} ETB.`);
        }
        if (profile.activePlayersCount < profile.minActivePlayersRequired) {
            throw new Error(`You must maintain at least ${profile.minActivePlayersRequired} active players in the current payout cycle. Currently: ${profile.activePlayersCount}`);
        }
        const amount = profile.availableBalance;
        profile.availableBalance = 0;
        return {
            amount,
            message: `Affiliate payout request of ${amount} ETB successfully submitted for Telebirr number ${profile.telebirrPayoutNumber}.`
        };
    }
}
exports.AffiliateService = AffiliateService;
