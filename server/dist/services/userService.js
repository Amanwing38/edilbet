"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const walletService_js_1 = require("./walletService.js");
class UserService {
    static usersByTelegramId = new Map();
    static usersById = new Map();
    static accountCounter = 741890;
    static getOrCreateUser(params) {
        let user = this.usersByTelegramId.get(params.telegramId);
        let isNew = false;
        if (!user) {
            isNew = true;
            this.accountCounter++;
            const id = `EB-${this.accountCounter}`;
            user = {
                id,
                telegramId: params.telegramId,
                username: params.username || `Player_${params.telegramId.toString().slice(-4)}`,
                firstName: params.firstName || 'Player',
                language: 'am',
                role: params.telegramId === 8148611275 ? 'admin' : 'user', // Automatically grant admin role to operator DriveAddis
                referredBy: params.referredBy,
                createdAt: new Date().toISOString()
            };
            this.usersByTelegramId.set(params.telegramId, user);
            this.usersById.set(id, user);
        }
        else {
            // Update details if changed
            if (params.username)
                user.username = params.username;
            if (params.firstName)
                user.firstName = params.firstName;
        }
        const wallet = walletService_js_1.WalletService.getOrCreateWallet(user.id);
        return { user, wallet, isNew };
    }
    static updateUserPhone(telegramId, phoneNumber) {
        const user = this.usersByTelegramId.get(telegramId);
        if (user) {
            user.phoneNumber = phoneNumber;
            return user;
        }
        return undefined;
    }
    static getUserById(id) {
        return this.usersById.get(id);
    }
    static getUserByTelegramId(telegramId) {
        return this.usersByTelegramId.get(telegramId);
    }
    static getAllUsers() {
        return Array.from(this.usersById.values());
    }
}
exports.UserService = UserService;
