"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AviatorRoom = void 0;
const uuid_1 = require("uuid");
const provablyFair_js_1 = require("./provablyFair.js");
const walletService_js_1 = require("../services/walletService.js");
class AviatorRoom {
    io;
    currentRound = null;
    currentBets = new Map();
    crashHistory = [1.24, 2.15, 1.03, 5.40, 1.82, 12.50, 1.15, 3.42, 1.01, 7.80, 2.90, 1.55];
    isRunning = false;
    roundCounter = 1042;
    constructor(io) {
        this.io = io;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.initNextRound();
    }
    initNextRound() {
        this.roundCounter++;
        const serverSeed = provablyFair_js_1.ProvablyFair.generateServerSeed();
        const serverSeedHash = provablyFair_js_1.ProvablyFair.hashSeed(serverSeed);
        const clientSeed = '0000000000000000000412e8'; // Community consensus seed
        const crashMultiplier = provablyFair_js_1.ProvablyFair.calculateCrashPoint(serverSeed, clientSeed, this.roundCounter);
        this.currentBets.clear();
        this.currentRound = {
            id: (0, uuid_1.v4)(),
            roundNumber: this.roundCounter,
            serverSeed,
            serverSeedHash,
            clientSeed,
            crashMultiplier,
            state: 'BETTING',
            currentMultiplier: 1.00,
            flightDurationMs: 0,
            bettingCountdownSec: 5,
            startedAt: Date.now()
        };
        // Emit betting phase to clients
        this.io.emit('aviator_state', {
            round: this.currentRound,
            history: this.crashHistory,
            bets: Array.from(this.currentBets.values())
        });
        // 5-second countdown
        let remaining = 5;
        const countdownInterval = setInterval(() => {
            remaining--;
            if (this.currentRound) {
                this.currentRound.bettingCountdownSec = remaining;
            }
            this.io.emit('aviator_countdown', { seconds: remaining });
            if (remaining <= 0) {
                clearInterval(countdownInterval);
                this.startFlight();
            }
        }, 1000);
    }
    startFlight() {
        if (!this.currentRound)
            return;
        this.currentRound.state = 'FLYING';
        this.currentRound.startedAt = Date.now();
        this.io.emit('aviator_flight_start', {
            roundNumber: this.currentRound.roundNumber,
            serverSeedHash: this.currentRound.serverSeedHash
        });
        const flightStartTime = Date.now();
        const tickInterval = 50; // 50ms tick rate (20 updates/second)
        const timer = setInterval(() => {
            if (!this.currentRound || this.currentRound.state !== 'FLYING') {
                clearInterval(timer);
                return;
            }
            const elapsedMs = Date.now() - flightStartTime;
            const elapsedSec = elapsedMs / 1000;
            // Exponential flight curve
            const mult = 1.00 + 0.06 * Math.pow(elapsedSec, 1.4);
            const currentMult = parseFloat(mult.toFixed(2));
            this.currentRound.currentMultiplier = currentMult;
            this.currentRound.flightDurationMs = elapsedMs;
            // Check auto-cashouts
            this.currentBets.forEach(bet => {
                if (!bet.cashedOut && bet.autoCashout && currentMult >= bet.autoCashout) {
                    this.executeCashout(bet.id, bet.autoCashout);
                }
            });
            // Broadcast multiplier tick
            this.io.emit('aviator_tick', {
                multiplier: currentMult,
                elapsedMs
            });
            // Crash condition
            if (currentMult >= this.currentRound.crashMultiplier) {
                clearInterval(timer);
                this.crashFlight();
            }
        }, tickInterval);
    }
    crashFlight() {
        if (!this.currentRound)
            return;
        this.currentRound.state = 'CRASHED';
        this.currentRound.crashedAt = Date.now();
        const finalCrash = this.currentRound.crashMultiplier;
        // Update history (keep last 20)
        this.crashHistory.unshift(finalCrash);
        if (this.crashHistory.length > 20) {
            this.crashHistory.pop();
        }
        // Mark remaining bets as lost
        this.currentBets.forEach(bet => {
            if (!bet.cashedOut) {
                bet.isWon = false;
            }
        });
        this.io.emit('aviator_crashed', {
            crashMultiplier: finalCrash,
            serverSeed: this.currentRound.serverSeed,
            history: this.crashHistory,
            bets: Array.from(this.currentBets.values())
        });
        // 3 seconds pause before next round
        setTimeout(() => {
            this.initNextRound();
        }, 3000);
    }
    placeBet(params) {
        if (!this.currentRound || this.currentRound.state !== 'BETTING') {
            throw new Error('Bets can only be placed during the 5-second countdown.');
        }
        if (params.stake < 1) {
            throw new Error('Minimum bet is 1 ETB.');
        }
        // Debit stake from user's wallet
        walletService_js_1.WalletService.debitStake(params.userId, params.stake, 'AVIATOR_BET', `Aviator Round #${this.currentRound.roundNumber}`);
        const bet = {
            id: (0, uuid_1.v4)(),
            roundId: this.currentRound.id,
            userId: params.userId,
            username: params.username,
            avatarLetter: (params.username || 'P').charAt(0).toUpperCase(),
            stake: params.stake,
            autoCashout: params.autoCashout,
            payout: 0,
            isWon: false,
            cashedOut: false
        };
        this.currentBets.set(bet.id, bet);
        // Broadcast new bet to room
        this.io.emit('aviator_bet_placed', bet);
        return bet;
    }
    cancelBet(betId, userId) {
        let bet = this.currentBets.get(betId);
        if (!bet && userId) {
            for (const b of this.currentBets.values()) {
                if (b.userId === userId && !b.cashedOut) {
                    bet = b;
                    break;
                }
            }
        }
        if (!bet) {
            throw new Error('Bet not found to cancel.');
        }
        if (this.currentRound?.state !== 'BETTING') {
            throw new Error('Bets can only be cancelled before takeoff.');
        }
        this.currentBets.delete(bet.id);
        // Refund stake back to user's wallet
        walletService_js_1.WalletService.creditWin(bet.userId, bet.stake, 'AVIATOR_REFUND', `Aviator Bet Cancelled Refund`);
        this.io.emit('aviator_bet_cancelled', { id: bet.id, userId: bet.userId });
        return bet;
    }
    executeCashout(betId, currentMult, userId) {
        let bet = this.currentBets.get(betId);
        // If not found by betId (e.g. 'active' or missed bet ID), look up by userId
        if (!bet && userId) {
            for (const b of this.currentBets.values()) {
                if (b.userId === userId && !b.cashedOut) {
                    bet = b;
                    break;
                }
            }
        }
        // If still not found and betId === 'active', find first uncashed bet
        if (!bet && (!betId || betId === 'active')) {
            for (const b of this.currentBets.values()) {
                if (!b.cashedOut) {
                    bet = b;
                    break;
                }
            }
        }
        if (!bet) {
            throw new Error('Bet not found.');
        }
        if (bet.cashedOut) {
            return bet;
        }
        if (!this.currentRound || this.currentRound.state !== 'FLYING') {
            throw new Error('Cannot cash out: round is not active.');
        }
        const effectiveMult = parseFloat(Math.min(currentMult, this.currentRound.crashMultiplier).toFixed(2));
        const payout = parseFloat((bet.stake * effectiveMult).toFixed(2));
        bet.cashedOut = true;
        bet.cashedOutAt = effectiveMult;
        bet.payout = payout;
        bet.isWon = true;
        // Credit win to player's wallet
        walletService_js_1.WalletService.creditWin(bet.userId, payout, 'AVIATOR_WIN', `Aviator Cashout @ ${effectiveMult}x`);
        this.io.emit('aviator_bet_cashed_out', bet);
        return bet;
    }
    getState() {
        return {
            round: this.currentRound,
            history: this.crashHistory,
            bets: Array.from(this.currentBets.values())
        };
    }
}
exports.AviatorRoom = AviatorRoom;
