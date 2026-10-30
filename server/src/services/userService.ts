import { User, Wallet } from '../types.js';
import { WalletService } from './walletService.js';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  private static usersByTelegramId: Map<number, User> = new Map();
  private static usersById: Map<string, User> = new Map();
  private static accountCounter: number = 741890;

  static getOrCreateUser(params: {
    telegramId: number;
    username?: string;
    firstName?: string;
    referredBy?: string;
  }): { user: User; wallet: Wallet; isNew: boolean } {
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
    } else {
      // Update details if changed
      if (params.username) user.username = params.username;
      if (params.firstName) user.firstName = params.firstName;
    }

    const wallet = WalletService.getOrCreateWallet(user.id);
    return { user, wallet, isNew };
  }

  static getUserById(id: string): User | undefined {
    return this.usersById.get(id);
  }

  static getUserByTelegramId(telegramId: number): User | undefined {
    return this.usersByTelegramId.get(telegramId);
  }

  static getAllUsers(): User[] {
    return Array.from(this.usersById.values());
  }
}
