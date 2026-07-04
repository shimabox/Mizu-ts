import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/core/Random';
import { FallAndSway } from '../../../src/core/behaviors/FallAndSway';

describe('FallAndSway のテスト', () => {
  const sh = 600;
  const size = 20;

  it('毎ステップ size * 0.1 ずつ落下すること', () => {
    const fall = new FallAndSway(sh, size, new SeededRandom(42));
    let y = 100;
    for (let i = 0; i < 10; i++) {
      const next = fall.next(100, y);
      expect(next.y).toBeCloseTo(y + size * 0.1, 10);
      y = next.y;
    }
  });

  it('横方向は 1 ステップあたり最大 1 の揺れに収まること', () => {
    const fall = new FallAndSway(sh, size, new SeededRandom(42));
    let x = 100;
    let y = 0;
    for (let i = 0; i < 100; i++) {
      const next = fall.next(x, y);
      expect(Math.abs(next.x - x)).toBeLessThanOrEqual(1);
      x = next.x;
      y = next.y;
    }
  });

  it('画面下端(sh)に到達したら hasLanded が true になること', () => {
    const fall = new FallAndSway(sh, size, new SeededRandom(42));
    expect(fall.hasLanded(sh - 1)).toBe(false);
    expect(fall.hasLanded(sh)).toBe(true);
    expect(fall.hasLanded(sh + 1)).toBe(true);
  });
});
