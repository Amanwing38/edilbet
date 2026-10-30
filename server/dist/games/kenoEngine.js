"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KenoEngine = exports.KENO_PAYTABLE = void 0;
// Ethiopian Fast Keno Standard Paytable: [pickedCount][matchedCount] = multiplier
exports.KENO_PAYTABLE = {
    1: { 1: 3.5 },
    2: { 2: 12 },
    3: { 2: 2.5, 3: 42 },
    4: { 2: 1, 3: 5, 4: 100 },
    5: { 3: 3, 4: 25, 5: 500 },
    6: { 3: 1.5, 4: 8, 5: 80, 6: 1500 },
    7: { 4: 4, 5: 30, 6: 250, 7: 5000 },
    8: { 4: 2, 5: 12, 6: 90, 7: 1000, 8: 10000 },
    9: { 4: 1.5, 5: 6, 6: 40, 7: 350, 8: 4000, 9: 25000 },
    10: { 5: 2, 6: 15, 7: 80, 8: 500, 9: 2500, 10: 10000 }
};
class KenoEngine {
    static evaluate(pickedNumbers, drawnNumbers, stake) {
        const pickedCount = pickedNumbers.length;
        if (pickedCount < 1 || pickedCount > 10) {
            throw new Error('You must pick between 1 and 10 numbers.');
        }
        const matchedNumbers = pickedNumbers.filter(n => drawnNumbers.includes(n));
        const matchedCount = matchedNumbers.length;
        const tableForPick = exports.KENO_PAYTABLE[pickedCount] || {};
        const multiplier = tableForPick[matchedCount] || 0;
        const payout = parseFloat((stake * multiplier).toFixed(2));
        return {
            pickedCount,
            matchedCount,
            matchedNumbers,
            multiplier,
            payout
        };
    }
}
exports.KenoEngine = KenoEngine;
