import { Bot, InlineKeyboard } from 'grammy';
import { UserService } from './services/userService.js';
import { WalletService } from './services/walletService.js';

let botInstance: Bot | null = null;
let currentWebAppHttpsUrl = process.env.WEBAPP_URL || 'https://edilbet.onrender.com';

export function updateBotWebAppUrl(url: string) {
  currentWebAppHttpsUrl = url;
  if (botInstance) {
    botInstance.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: '🎮 Play (ዕድል ቤት)',
        web_app: { url }
      }
    }).catch((err) => console.error('Error updating menu button:', err.message));
  }
}

export function launchBot(token: string, initialUrl?: string) {
  if (initialUrl) currentWebAppHttpsUrl = initialUrl;

  try {
    if (!token || token.includes('your_token')) {
      console.log('ℹ️ Telegram Bot Token not configured. Skipping bot polling.');
      return;
    }

    const bot = new Bot(token);
    botInstance = bot;

    // Global Error Handler to keep bot online
    bot.catch((err) => {
      console.error('⚠️ Telegram Bot Error caught:', err.message);
    });

    // Configure Persistent Bottom-Left "🎮 Play" Menu Button in Telegram
    bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: '🎮 Play (ዕድል ቤት)',
        web_app: { url: currentWebAppHttpsUrl }
      }
    }).then(() => {
      console.log(`✅ Telegram WebApp Menu Button configured with: ${currentWebAppHttpsUrl}`);
    }).catch((err) => {
      console.error('Menu button error:', err.message);
    });

    // /start command — Automatically creates unique Account ID & personal wallet!
    bot.command('start', async (ctx) => {
      const from = ctx.from;
      if (!from) return;
      console.log(`📥 Received /start from Telegram user: ${from.id} (@${from.username || from.first_name})`);

      const refParam = ctx.match; // e.g. ref_AFF000106
      const { user, wallet, isNew } = UserService.getOrCreateUser({
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name,
        referredBy: refParam ? String(refParam) : undefined
      });

      // App URL passing user telegram ID so the web app logs in automatically
      const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;

      const keyboard = new InlineKeyboard()
        .webApp('✈️ Play Aviator (ዕድል ቤት)', personalizedAppUrl)
        .row()
        .url('📢 Official Channel', 'https://t.me/EdilBetET')
        .url('💬 24/7 Support', 'https://t.me/EdilBetSupport');

      const welcomeText = 
`🇪🇹 **እንኳን ወደ ዕድል ቤት (Edil Bet) በደህና መጡ!**
**Welcome to Edil Bet — Ethiopia's Premier Instant Games Platform!**

👤 **የእርስዎ አካውንት ተፈጥሯል (Your Official Account):**
• 🆔 **Account ID**: \`${user.id}\`
• 👤 **Player**: **${user.firstName}** ${user.username ? '(@' + user.username + ')' : ''}
• 💰 **Available Balance**: **${wallet.availableBalance.toFixed(2)} ETB**
• 🎁 **Welcome Bonus**: **100% Match on First Deposit!**
• ⚡ **Status**: **Active & Verified**

✨ **Instant Games Available:**
✈️ **Aviator & Jet-X** — Crash Multipliers up to 500x
🎱 **Fast Keno** — 20-Ball Live Draws & Big Multipliers
🐔 **Chicken Road 2.0** — Step-by-Step Multiplier Walk
🎰 **Pragmatic & 777 Slots** — Jackpots & Free Spins
🏆 **Money Rain** — Free ETB Drops for Active Players!

💰 **Instant Deposits via Telebirr (0938749239)**
⚡ **Fast Withdrawals directly to your Telebirr account**

👇 **Tap below to launch Aviator with your account:**`;

      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Handle any message to immediately send launch button
    bot.on('message:text', async (ctx) => {
      if (ctx.message.text.startsWith('/')) return;
      const from = ctx.from;
      if (!from) return;
      console.log(`📥 Received text from ${from.id}: "${ctx.message.text}"`);

      const { user, wallet } = UserService.getOrCreateUser({
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name
      });
      const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;

      const keyboard = new InlineKeyboard()
        .webApp('✈️ Play Aviator (ዕድል ቤት)', personalizedAppUrl);

      await ctx.reply(
        `✈️ **ዕድል ቤት (Edil Bet) — Aviator**\n\n` +
        `🆔 **Account ID**: \`${user.id}\`\n` +
        `💰 **Balance**: **${wallet.availableBalance.toFixed(2)} ETB**\n\n` +
        `👇 **Tap the button below to start playing:**`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    });

    // /balance command
    bot.command('balance', async (ctx) => {
      const from = ctx.from;
      if (!from) return;

      const { user, wallet } = UserService.getOrCreateUser({
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name
      });

      await ctx.reply(
        `💳 **Your Edil Bet Account (${user.id}):**\n\n` +
        `• Player: **${user.firstName}**\n` +
        `• Available Balance: **${wallet.availableBalance.toFixed(2)} ETB**\n` +
        `• Bonus Balance: **${wallet.bonusBalance.toFixed(2)} ETB**\n` +
        `• Total Deposited: **${wallet.totalDeposited.toFixed(2)} ETB**\n` +
        `• Total Withdrawn: **${wallet.totalWithdrawn.toFixed(2)} ETB**\n\n` +
        `Use the Mini App to play, deposit or withdraw!`,
        { parse_mode: 'Markdown' }
      );
    });

    // /deposit command
    bot.command('deposit', async (ctx) => {
      const from = ctx.from;
      const depositUrl = `${currentWebAppHttpsUrl}?tab=wallet&tgId=${from?.id || ''}`;
      const keyboard = new InlineKeyboard().webApp('💳 Open Deposit Cashier', depositUrl);

      await ctx.reply(
        `📥 **Deposit ETB via Telebirr:**\n\n` +
        `• Minimum: **50 ETB** | Maximum: **10,000 ETB**\n` +
        `• Transfer to Telebirr: \`0938749239\`\n` +
        `• CBE Account: \`1000450457047\`\n\n` +
        `Tap below to open your cashier order!`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    });

    bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Telegram Bot @${botInfo.username} launched successfully with dynamic accounts!`);
      }
    }).catch((err) => {
      console.error('⚠️ Telegram polling error (handled):', err.message);
    });
  } catch (err: any) {
    console.error('Failed to launch Telegram bot:', err.message);
  }
}
