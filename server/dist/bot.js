"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketEmitter = registerSocketEmitter;
exports.notifyAdminNewDeposit = notifyAdminNewDeposit;
exports.updateBotWebAppUrl = updateBotWebAppUrl;
exports.launchBot = launchBot;
const grammy_1 = require("grammy");
const userService_js_1 = require("./services/userService.js");
const walletService_js_1 = require("./services/walletService.js");
let botInstance = null;
let currentWebAppHttpsUrl = process.env.WEBAPP_URL || 'https://edilbet.onrender.com';
let socketEmitterCallback = null;
function registerSocketEmitter(emitter) {
    socketEmitterCallback = emitter;
}
async function notifyAdminNewDeposit(order) {
    if (!botInstance)
        return;
    const adminChatId = 8148611275;
    const keyboard = new grammy_1.InlineKeyboard()
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
function updateBotWebAppUrl(url) {
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
function launchBot(token, initialUrl) {
    if (initialUrl)
        currentWebAppHttpsUrl = initialUrl;
    try {
        if (!token || token.includes('your_token')) {
            console.log('ℹ️ Telegram Bot Token not configured. Skipping bot polling.');
            return;
        }
        const bot = new grammy_1.Bot(token);
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
            if (!from)
                return;
            console.log(`📥 Received /start from Telegram user: ${from.id} (@${from.username || from.first_name})`);
            const refParam = ctx.match; // e.g. ref_AFF000106
            const { user, wallet, isNew } = userService_js_1.UserService.getOrCreateUser({
                telegramId: from.id,
                username: from.username,
                firstName: from.first_name,
                referredBy: refParam ? String(refParam) : undefined
            });
            const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;
            // If user hasn't shared their phone number yet, request it
            if (!user.phoneNumber) {
                const phoneKeyboard = new grammy_1.Keyboard()
                    .requestContact('📱 ስልክ ቁጥርዎን ያጋሩ (Share Phone Number)')
                    .resized()
                    .oneTime();
                await ctx.reply(`🇪🇹 **እንኳን ወደ ዕድል ቤት (Edil Bet) በደህና መጡ!**\n\n` +
                    `👤 **የአካውንት መለያዎ (Account ID)**: \`${user.id}\`\n\n` +
                    `አካውንትዎን ለማረጋገጥ እና የቴሌብር (Telebirr) ፈጣን ተቀማጭ/ማውጣት ለማገናኘት እባክዎ ከታች ያለውን **"📱 ስልክ ቁጥርዎን ያጋሩ"** የሚለውን በተን ይጫኑ:\n\n` +
                    `*(To activate your account and enable Telebirr cashier, tap the "Share Phone Number" button below:)*`, {
                    parse_mode: 'Markdown',
                    reply_markup: phoneKeyboard
                });
                return;
            }
            // If already verified, send full welcome with play button
            const keyboard = new grammy_1.InlineKeyboard()
                .webApp('🎮 Play Games (ዕድል ቤት)', personalizedAppUrl)
                .row()
                .url('📢 Official Channel', 'https://t.me/EdilBetET')
                .url('💬 24/7 Support', 'https://t.me/EdilBetSupport');
            const welcomeText = `🇪🇹 **እንኳን ወደ ዕድል ቤት (Edil Bet) በደህና መጡ!**
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
            if (!from || !contact)
                return;
            const rawPhone = contact.phone_number;
            const cleanPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
            console.log(`📱 User ${from.id} shared phone number: ${cleanPhone}`);
            const user = userService_js_1.UserService.updateUserPhone(from.id, cleanPhone);
            const wallet = walletService_js_1.WalletService.getOrCreateWallet(user?.id || 'EB-741891');
            const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;
            const inlineKeyboard = new grammy_1.InlineKeyboard()
                .webApp('🎮 Play Games (ዕድል ቤት)', personalizedAppUrl)
                .row()
                .url('📢 Official Channel', 'https://t.me/EdilBetET')
                .url('💬 24/7 Support', 'https://t.me/EdilBetSupport');
            await ctx.reply(`✅ **ስልክ ቁጥርዎ በተሳካ ሁኔታ ተረጋግጧል!**\n\n` +
                `👤 **የእርስዎ አካውንት (Your Verified Account):**\n` +
                `• 🆔 **Account ID**: \`${user?.id || 'EB-741891'}\`\n` +
                `• 📱 **ስልክ (Phone)**: \`${cleanPhone}\`\n` +
                `• 💰 **Available Balance**: **${wallet.availableBalance.toFixed(2)} ETB**\n` +
                `• 🎁 **Welcome Bonus**: **100% Match on First Deposit!**\n\n` +
                `👇 **ጨዋታዎችን ለመጀመር ከታች ያለውን ይጫኑ (Tap below to play):**`, {
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard
            });
        });
        // Handle any message to immediately send launch button
        bot.on('message:text', async (ctx) => {
            if (ctx.message.text.startsWith('/'))
                return;
            const from = ctx.from;
            if (!from)
                return;
            console.log(`📥 Received text from ${from.id}: "${ctx.message.text}"`);
            const { user, wallet } = userService_js_1.UserService.getOrCreateUser({
                telegramId: from.id,
                username: from.username,
                firstName: from.first_name
            });
            const personalizedAppUrl = `${currentWebAppHttpsUrl}?tgId=${from.id}&name=${encodeURIComponent(from.first_name || 'Player')}&v=2`;
            const keyboard = new grammy_1.InlineKeyboard()
                .webApp('✈️ Play Aviator (ዕድል ቤት)', personalizedAppUrl);
            await ctx.reply(`✈️ **ዕድል ቤት (Edil Bet) — Aviator**\n\n` +
                `🆔 **Account ID**: \`${user.id}\`\n` +
                `💰 **Balance**: **${wallet.availableBalance.toFixed(2)} ETB**\n\n` +
                `👇 **Tap the button below to start playing:**`, { parse_mode: 'Markdown', reply_markup: keyboard });
        });
        // /balance command
        bot.command('balance', async (ctx) => {
            const from = ctx.from;
            if (!from)
                return;
            const { user, wallet } = userService_js_1.UserService.getOrCreateUser({
                telegramId: from.id,
                username: from.username,
                firstName: from.first_name
            });
            await ctx.reply(`💳 **Your Edil Bet Account (${user.id}):**\n\n` +
                `• Player: **${user.firstName}**\n` +
                `• Available Balance: **${wallet.availableBalance.toFixed(2)} ETB**\n` +
                `• Bonus Balance: **${wallet.bonusBalance.toFixed(2)} ETB**\n` +
                `• Total Deposited: **${wallet.totalDeposited.toFixed(2)} ETB**\n` +
                `• Total Withdrawn: **${wallet.totalWithdrawn.toFixed(2)} ETB**\n\n` +
                `Use the Mini App to play, deposit or withdraw!`, { parse_mode: 'Markdown' });
        });
        // /deposit command
        bot.command('deposit', async (ctx) => {
            const from = ctx.from;
            const depositUrl = `${currentWebAppHttpsUrl}?tab=wallet&tgId=${from?.id || ''}`;
            const keyboard = new grammy_1.InlineKeyboard().webApp('💳 Open Deposit Cashier', depositUrl);
            await ctx.reply(`📥 **Deposit ETB via Telebirr:**\n\n` +
                `• Minimum: **50 ETB** | Maximum: **10,000 ETB**\n` +
                `• Transfer to Telebirr: \`0938749239\`\n` +
                `• CBE Account: \`1000450457047\`\n\n` +
                `Tap below to open your cashier order!`, { parse_mode: 'Markdown', reply_markup: keyboard });
        });
        // Callback queries for instant Telegram Deposit Approval
        bot.callbackQuery(/^approve_dep:(.+)$/, async (ctx) => {
            const orderId = ctx.match[1];
            try {
                const result = walletService_js_1.WalletService.approveDeposit(orderId, ctx.from.username || ctx.from.first_name || 'Admin');
                if (socketEmitterCallback) {
                    socketEmitterCallback(result.order.userId, result.wallet);
                }
                await ctx.answerCallbackQuery({ text: `✓ Approved ${result.order.amount} ETB!` });
                await ctx.editMessageText(`✅ **Deposit Approved & Credited!**\n\n` +
                    `• **Order ID**: \`${result.order.orderNumber}\`\n` +
                    `• **Player ID**: \`${result.order.userId}\`\n` +
                    `• **Amount**: **+${result.order.amount} ETB**\n` +
                    `• **Tx ID**: \`${result.order.referenceCode}\`\n` +
                    `• **New Balance**: **${result.wallet.availableBalance.toFixed(2)} ETB**\n` +
                    `• **Approved By**: @${ctx.from.username || ctx.from.first_name}`, { parse_mode: 'Markdown' });
            }
            catch (err) {
                await ctx.answerCallbackQuery({ text: err.message, show_alert: true });
            }
        });
        bot.callbackQuery(/^reject_dep:(.+)$/, async (ctx) => {
            const orderId = ctx.match[1];
            try {
                const rejected = walletService_js_1.WalletService.rejectDeposit(orderId, 'Rejected by Telegram Admin.');
                await ctx.answerCallbackQuery({ text: 'Deposit rejected.' });
                await ctx.editMessageText(`❌ **Deposit Rejected!**\n\n` +
                    `• **Order ID**: \`${rejected.orderNumber}\`\n` +
                    `• **Player ID**: \`${rejected.userId}\`\n` +
                    `• **Amount**: **${rejected.amount} ETB**\n` +
                    `• **Reason**: Verification failed`, { parse_mode: 'Markdown' });
            }
            catch (err) {
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
    }
    catch (err) {
        console.error('Failed to launch Telegram bot:', err.message);
    }
}
