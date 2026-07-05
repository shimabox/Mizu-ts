import { describe, expect, it } from 'vitest';
import { MathRandom, SeededRandom } from '../../src/core/Random';

describe('MathRandom のテスト', () => {
  it('[0, 1) の値を返すこと', () => {
    const random = new MathRandom();
    for (let i = 0; i < 100; i++) {
      const v = random.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('SeededRandom のテスト', () => {
  it('[0, 1) の値を返すこと', () => {
    const random = new SeededRandom(1);
    for (let i = 0; i < 100; i++) {
      const v = random.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('同じシードからは同じ乱数列が得られること(決定的)', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    for (let i = 0; i < 50; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('異なるシードからは異なる乱数列が得られること', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });
});
