"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const walletService_js_1 = require("./walletService.js");
const database_js_1 = require("../db/database.js");
class UserService {
    static getOrCreateUser(params) {
        let user = database_js_1.DBService.getUserByTelegramId(params.telegramId);
        let isNew = false;
        if (!user) {
            isNew = true;
            const count = database_js_1.DBService.countUsers();
            const id = `EB-${741891 + count}`;
            user = {
                id,
                telegramId: params.telegramId,
                username: params.username || `Player_${params.telegramId.toString().slice(-4)}`,
                firstName: params.firstName || 'Player',
                language: 'am',
                role: params.telegramId === 8148611275 ? 'admin' : 'user',
                referredBy: params.referredBy,
                createdAt: new Date().toISOString()
            };
            database_js_1.DBService.saveUser(user);
        }
        else {
            let updated = false;
            if (params.username && params.username !== user.username) {
                user.username = params.username;
                updated = true;
            }
            if (params.firstName && params.firstName !== user.firstName) {
                user.firstName = params.firstName;
                updated = true;
            }
            if (updated) {
                database_js_1.DBService.saveUser(user);
            }
        }
        const wallet = walletService_js_1.WalletService.getOrCreateWallet(user.id);
        return { user, wallet, isNew };
    }
    static updateUserPhone(telegramId, phoneNumber) {
        database_js_1.DBService.updateUserPhone(telegramId, phoneNumber);
        const user = database_js_1.DBService.getUserByTelegramId(telegramId);
        return user || undefined;
    }
    static getUserById(id) {
        const user = database_js_1.DBService.getUserById(id);
        return user || undefined;
    }
    static getUserByTelegramId(telegramId) {
        const user = database_js_1.DBService.getUserByTelegramId(telegramId);
        return user || undefined;
    }
}
exports.UserService = UserService;
