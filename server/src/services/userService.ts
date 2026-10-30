import { User, Wallet } from '../types.js';
import { WalletService } from './walletService.js';
import { DBService } from '../db/database.js';

export class UserService {
  static getOrCreateUser(params: {
    telegramId: number;
    username?: string;
    firstName?: string;
    referredBy?: string;
  }): { user: User; wallet: Wallet; isNew: boolean } {
    let user = DBService.getUserByTelegramId(params.telegramId);
    let isNew = false;

    if (!user) {
      isNew = true;
      const count = DBService.countUsers();
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
      DBService.saveUser(user);
    } else {
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
        DBService.saveUser(user);
      }
    }

    const wallet = WalletService.getOrCreateWallet(user.id);
    return { user, wallet, isNew };
  }

  static updateUserPhone(telegramId: number, phoneNumber: string): User | undefined {
    DBService.updateUserPhone(telegramId, phoneNumber);
    const user = DBService.getUserByTelegramId(telegramId);
    return user || undefined;
  }

  static getUserById(id: string): User | undefined {
    const user = DBService.getUserById(id);
    return user || undefined;
  }

  static getUserByTelegramId(telegramId: number): User | undefined {
    const user = DBService.getUserByTelegramId(telegramId);
    return user || undefined;
  }
}
