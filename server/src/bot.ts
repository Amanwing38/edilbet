import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { UserService } from './services/userService.js';
import { WalletService } from './services/walletService.js';

let botInstance: Bot | null = null;
let currentWebAppHttpsUrl = process.env.WEBAPP_URL || 'https://edilbet.onrender.com';
let socketEmitterCallback: ((userId: string, wallet: any) => void) | null = null;

export function registerSocketEmitter(emitter: (userId: string, wallet: any) => void) {
  socketEmitterCallback = emitter;
}

export async function notifyAdminNewDeposit(order: any) {
  if (!botInstance) return;
  const adminChatId = 8148611275;
  const keyboard = new InlineKeyboard()
    .text('✅ Approve (+ Credit)', `approve_dep:${order.id}`)
    .text('❌ Reject', `reject_dep:${order.id}`);

  const msg = `🔔 **New Deposit Submitted!**\n\n` +
    `• **Order ID**: \`${order.orderNumber}\`\n` +
    `• **Player ID**: \`${order.userId}\` (${order.username})\n` +
    `• **Method**: ${order.paymentMethod}\n` +
    `• **Amount**: **${order.amount} ETB**\n` +
    `• **Sender Phone**: \`${order.senderPhone}\`\n` +
    `• **Transaction ID / SMS**: \`${order.referenceCode}\`\n\n` +
    `Tap Approve to instantly credit player's wallet:`;

  await botInstance.api.sendMessage(adminChatId, msg, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  }).catch((e) => console.error('Error notifying admin of deposit:', e.message));
}

export async function notifyAdminNewWithdrawal(tx: any) {
  if (!botInstance) return;
  const adminChatId = 8148611275;
  const keyboard = new InlineKeyboard()
    .text('✅ Paid / ተከፍሏል', `paid_with:${tx.id}`)
    .text('❌ Reject & Refund / መልስ', `reject_with:${tx.id}`);

  const payoutAmount = Math.abs(tx.amount);
  const fee = tx.fee || 50;
  const totalDeducted = payoutAmount + fee;

  let destDetails = '';
  if (tx.paymentMethod === 'CBE_BIRR' || tx.paymentMethod === 'CBE_BANK') {
    destDetails = `• **ዘዴ (Method)**: 🏦 **CBE Bank (የኢትዮጵያ ንግድ ባንክ)**\n` +
      `• **ሂሳብ ቁጥር (CBE Account)**: \`${tx.recipientAccount}\`\n` +
      `• **የሂሳብ ባለቤት (Full Name)**: **${tx.accountHolderName || 'N/A'}**`;
  } else {
    destDetails = `• **ዘዴ (Method)**: 📱 **Telebirr (ቴሌብር)**\n` +
      `• **የቴሌብር ስልክ (Telebirr Phone)**: \`${tx.recipientPhone || tx.senderPhone || '0938749239'}\``;
  }

  const msg = `💸 **አዲስ የገንዘብ ማውጣት ጥያቄ (New Withdrawal Request)!**\n\n` +
    `• **Order ID**: \`${tx.orderNumber}\`\n` +
    `• **ተጫዋች (Player)**: \`${tx.userId}\` (${tx.username})\n` +
    `${destDetails}\n\n` +
    `💰 **የሚላክለት (Payout Amount)**: **${payoutAmount.toFixed(2)} ETB**\n` +
    `⚡ **የዝውውር ክፍያ (Transfer Fee)**: **${fee.toFixed(2)} ETB**\n` +
    `📉 **ከአካውንቱ የተቆረጠው ድምር (Total Deducted)**: **${totalDeducted.toFixed(2)} ETB**\n\n` +
    `እባክዎ ገንዘቡን ልከው ሲያጠናቅቁ ከታች "✅ ተከፍሏል" የሚለውን ይጫኑ:`;

  await botInstance.api.sendMessage(adminChatId, msg, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  }).catch((e) => console.error('Error notifying admin of withdrawal:', e.message));
}

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

    // /start command — Automatically creates unique Account ID & requests phone verification
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

      const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;

      // If user hasn't shared their phone number yet, request it
      if (!user.phoneNumber) {
        const phoneKeyboard = new Keyboard()
          .requestContact('📱 ስልክ ቁጥርዎን ያጋሩ (Share Phone Number)')
          .resized()
          .oneTime();

        await ctx.reply(
          `🇪🇹 **እንኳን ወደ ዕድል ቤት (Edil Bet) በደህና መጡ!**\n\n` +
          `👤 **የአካውንት መለያዎ (Account ID)**: \`${user.id}\`\n\n` +
          `አካውንትዎን ለማረጋገጥ እና የቴሌብር (Telebirr) ፈጣን ተቀማጭ/ማውጣት ለማገናኘት እባክዎ ከታች ያለውን **"📱 ስልክ ቁጥርዎን ያጋሩ"** የሚለውን በተን ይጫኑ:\n\n` +
          `*(To activate your account and enable Telebirr cashier, tap the "Share Phone Number" button below:)*`,
          {
            parse_mode: 'Markdown',
            reply_markup: phoneKeyboard
          }
        );
        return;
      }

      // If already verified, send full welcome with play button
      const keyboard = new InlineKeyboard()
        .webApp('🎮 Play Games (ዕድል ቤት)', personalizedAppUrl)
        .row()
        .url('📢 Official Channel', 'https://t.me/EdilBetET')
        .url('💬 24/7 Support', 'https://t.me/EdilBetSupport');

      const welcomeText = 
`🇪🇹 **እንኳን ወደ ዕድል ቤት (Edil Bet) በደህና መጡ!**
**Welcome to Edil Bet — Ethiopia's Premier Instant Games Platform!**

👤 **የእርስዎ አካውንት (Your Official Account):**
• 🆔 **Account ID**: \`${user.id}\`
• 📱 **ስልክ (Phone)**: \`${user.phoneNumber}\`
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

👇 **Tap below to open the games lobby:**`;

      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Handle Contact Sharing from Telegram Button
    bot.on('message:contact', async (ctx) => {
      const from = ctx.from;
      const contact = ctx.message.contact;
      if (!from || !contact) return;

      const rawPhone = contact.phone_number;
      const cleanPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
      console.log(`📱 User ${from.id} shared phone number: ${cleanPhone}`);

      const user = UserService.updateUserPhone(from.id, cleanPhone);
      const wallet = WalletService.getOrCreateWallet(user?.id || 'EB-741891');
      const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;

      const inlineKeyboard = new InlineKeyboard()
        .webApp('🎮 Play Games (ዕድል ቤት)', personalizedAppUrl)
        .row()
        .url('📢 Official Channel', 'https://t.me/EdilBetET')
        .url('💬 24/7 Support', 'https://t.me/EdilBetSupport');

      await ctx.reply(
        `✅ **ስልክ ቁጥርዎ በተሳካ ሁኔታ ተረጋግጧል!**\n\n` +
        `👤 **የእርስዎ አካውንት (Your Verified Account):**\n` +
        `• 🆔 **Account ID**: \`${user?.id || 'EB-741891'}\`\n` +
        `• 📱 **ስልክ (Phone)**: \`${cleanPhone}\`\n` +
        `• 💰 **Available Balance**: **${wallet.availableBalance.toFixed(2)} ETB**\n` +
        `• 🎁 **Welcome Bonus**: **100% Match on First Deposit!**\n\n` +
        `👇 **ጨዋታዎችን ለመጀመር ከታች ያለውን ይጫኑ (Tap below to play):**`,
        {
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard
        }
      );
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

    // Callback queries for instant Telegram Deposit Approval
    bot.callbackQuery(/^approve_dep:(.+)$/, async (ctx) => {
      const orderId = ctx.match[1];
      try {
        const result = WalletService.approveDeposit(orderId, ctx.from.username || ctx.from.first_name || 'Admin');
        if (socketEmitterCallback) {
          socketEmitterCallback(result.order.userId, result.wallet);
        }
        await ctx.answerCallbackQuery({ text: `✓ Approved ${result.order.amount} ETB!` });
        await ctx.editMessageText(
          `✅ **Deposit Approved & Credited!**\n\n` +
          `• **Order ID**: \`${result.order.orderNumber}\`\n` +
          `• **Player ID**: \`${result.order.userId}\`\n` +
          `• **Amount**: **+${result.order.amount} ETB**\n` +
          `• **Tx ID**: \`${result.order.referenceCode}\`\n` +
          `• **New Balance**: **${result.wallet.availableBalance.toFixed(2)} ETB**\n` +
          `• **Approved By**: @${ctx.from.username || ctx.from.first_name}`,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        await ctx.answerCallbackQuery({ text: err.message, show_alert: true });
      }
    });

    bot.callbackQuery(/^reject_dep:(.+)$/, async (ctx) => {
      const orderId = ctx.match[1];
      try {
        const rejected = WalletService.rejectDeposit(orderId, 'Rejected by Telegram Admin.');
        await ctx.answerCallbackQuery({ text: 'Deposit rejected.' });
        await ctx.editMessageText(
          `❌ **Deposit Rejected!**\n\n` +
          `• **Order ID**: \`${rejected.orderNumber}\`\n` +
          `• **Player ID**: \`${rejected.userId}\`\n` +
          `• **Amount**: **${rejected.amount} ETB**\n` +
          `• **Reason**: Verification failed`,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        await ctx.answerCallbackQuery({ text: err.message, show_alert: true });
      }
    });

    bot.callbackQuery(/^paid_with:(.+)$/, async (ctx) => {
      const txId = ctx.match[1];
      try {
        const completed = WalletService.completeWithdrawal(txId, ctx.from.username || ctx.from.first_name || 'Admin');
        await ctx.answerCallbackQuery({ text: '✓ Withdrawal marked as Paid!' });
        await ctx.editMessageText(
          `✅ **Withdrawal Paid & Dispatched!**\n\n` +
          `• **Order ID**: \`${completed.orderNumber}\`\n` +
          `• **Player ID**: \`${completed.userId}\` (${completed.username})\n` +
          `• **Payout Amount**: **${Math.abs(completed.amount).toFixed(2)} ETB**\n` +
          `• **Method**: ${completed.paymentMethod}\n` +
          `• **Status**: Completed\n` +
          `• **Handled By**: @${ctx.from.username || ctx.from.first_name}`,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        await ctx.answerCallbackQuery({ text: err.message, show_alert: true });
      }
    });

    bot.callbackQuery(/^reject_with:(.+)$/, async (ctx) => {
      const txId = ctx.match[1];
      try {
        const result = WalletService.rejectWithdrawal(txId, 'Rejected by Telegram Admin.');
        if (socketEmitterCallback) {
          socketEmitterCallback(result.transaction.userId, result.wallet);
        }
        const refundTotal = Math.abs(result.transaction.amount) + (result.transaction.fee || 50);
        await ctx.answerCallbackQuery({ text: `✓ Rejected & Refunded ${refundTotal} ETB!` });
        await ctx.editMessageText(
          `❌ **Withdrawal Rejected & Refunded!**\n\n` +
          `• **Order ID**: \`${result.transaction.orderNumber}\`\n` +
          `• **Player ID**: \`${result.transaction.userId}\`\n` +
          `• **Refunded to Wallet**: **+${refundTotal.toFixed(2)} ETB** (includes 50 ETB fee)\n` +
          `• **Player Available Balance**: **${result.wallet.availableBalance.toFixed(2)} ETB**\n` +
          `• **Status**: Cancelled & Restored`,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        await ctx.answerCallbackQuery({ text: err.message, show_alert: true });
      }
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
