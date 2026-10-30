import crypto from 'crypto';

export class ProvablyFair {
  /**
   * Generates a random 32-byte hexadecimal server seed
   */
  static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a public SHA-256 hash of the server seed to share with players before the round
   */
  static hashSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  /**
   * Computes crash multiplier from server seed, client seed, and round ID
   * Standard Provably Fair crash algorithm with 3% house edge
   */
  static calculateCrashPoint(serverSeed: string, clientSeed: string, roundId: string | number): number {
    const message = `${clientSeed}:${roundId}`;
    const hmac = crypto.createHmac('sha256', serverSeed).update(message).digest('hex');

    // Take first 13 hex characters (52 bits)
    const subHash = hmac.substring(0, 13);
    const intVal = parseInt(subHash, 16);

    // 1 in 33 chance of instant crash at 1.00x (~3% house edge)
    if (intVal % 33 === 0) {
      return 1.00;
    }

    const e = Math.pow(2, 52);
    const multiplier = Math.floor((100 * e - intVal) / (e - intVal)) / 100;

    // Minimum crash point is 1.00x, cap at 500x
    const finalMultiplier = Math.max(1.00, Math.min(500.00, multiplier));
    return parseFloat(finalMultiplier.toFixed(2));
  }

  /**
   * Computes 20 unique drawn balls out of 1-80 for Fast Keno
   */
  static generateKenoDraw(serverSeed: string, clientSeed: string, roundId: string | number): number[] {
    const balls: number[] = Array.from({ length: 80 }, (_, i) => i + 1);
    const hash = crypto
      .createHmac('sha256', serverSeed)
      .update(`${clientSeed}:${roundId}:keno`)
      .digest('hex');

    // Fisher-Yates shuffle for first 20 numbers
    for (let i = 0; i < 20; i++) {
      const sub = hash.substring((i * 3) % (hash.length - 4), ((i * 3) % (hash.length - 4)) + 4);
      const randInt = parseInt(sub, 16);
      const targetIdx = i + (randInt % (80 - i));

      // Swap
      const temp = balls[i];
      balls[i] = balls[targetIdx];
      balls[targetIdx] = temp;
    }

    const drawn = balls.slice(0, 20);
    drawn.sort((a, b) => a - b);
    return drawn;
  }
}
