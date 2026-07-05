import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/core/Random';
import { RiseAndSway } from '../../../src/core/behaviors/RiseAndSway';

describe('RiseAndSway のテスト', () => {
  const size = 20;

  it('毎ステップ size * 0.05 ずつ上昇すること(y が減少)', () => {
    const rise = new RiseAndSway(size, new SeededRandom(42));
    let y = 500;
    for (let i = 0; i < 10; i++) {
      const next = rise.next(100, y);
      expect(next.y).toBeCloseTo(y - size * 0.05, 10);
      y = next.y;
    }
  });

  it('横方向は 1 ステップあたり最大 1 の揺れに収まること', () => {
    const rise = new RiseAndSway(size, new SeededRandom(42));
    let x = 100;
    let y = 500;
    for (let i = 0; i < 100; i++) {
      const next = rise.next(x, y);
      expect(Math.abs(next.x - x)).toBeLessThanOrEqual(1);
      x = next.x;
      y = next.y;
    }
  });
});
