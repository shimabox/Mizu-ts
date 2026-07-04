import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/core/Random';
import { RandomWalk } from '../../../src/core/behaviors/RandomWalk';

describe('RandomWalk のテスト', () => {
  const sw = 800;
  const sh = 600;
  const bodySize = 20;

  it('シード固定で軌道が決定的であること', () => {
    const walk1 = new RandomWalk(sw, sh, bodySize, new SeededRandom(42));
    const walk2 = new RandomWalk(sw, sh, bodySize, new SeededRandom(42));

    let p1 = { x: 400, y: 300 };
    let p2 = { x: 400, y: 300 };
    for (let i = 0; i < 100; i++) {
      p1 = walk1.next(p1.x, p1.y);
      p2 = walk2.next(p2.x, p2.y);
      expect(p1).toEqual(p2);
    }
  });

  it('位置が更新されること', () => {
    const walk = new RandomWalk(sw, sh, bodySize, new SeededRandom(42));
    const next = walk.next(400, 300);
    expect(next.x === 400 && next.y === 300).toBe(false);
  });

  it('1ステップの移動量が速度上限 1.05 を超えないこと', () => {
    // ラップアラウンドが起きないよう十分広い画面で検証する
    const walk = new RandomWalk(100000, 100000, bodySize, new SeededRandom(7));
    let x = 50000;
    let y = 50000;
    for (let i = 0; i < 500; i++) {
      const next = walk.next(x, y);
      const dx = next.x - x;
      const dy = next.y - y;
      const moved = Math.sqrt(dx * dx + dy * dy);
      expect(moved).toBeLessThanOrEqual(1.05 + 1e-9);
      x = next.x;
      y = next.y;
    }
  });

  describe('画面端のラップアラウンド(境界値)', () => {
    // speedFactor = 0 で速度をゼロに固定し、境界判定だけを検証する
    const stillWalk = () => new RandomWalk(sw, sh, bodySize, new SeededRandom(1), 0);

    it('右端ちょうど(sw + w/2)では折り返さないこと', () => {
      const next = stillWalk().next(sw + bodySize / 2, 300);
      expect(next.x).toBe(sw + bodySize / 2);
    });

    it('右端 +1 で左側(-w/2)へ折り返すこと', () => {
      const next = stillWalk().next(sw + bodySize / 2 + 1, 300);
      expect(next.x).toBe(-(bodySize / 2));
    });

    it('左端ちょうど(x + w = 0)では折り返さないこと', () => {
      const next = stillWalk().next(-bodySize, 300);
      expect(next.x).toBe(-bodySize);
    });

    it('左端 -1 で右側(sw + w/2)へ折り返すこと', () => {
      const next = stillWalk().next(-bodySize - 1, 300);
      expect(next.x).toBe(sw + bodySize / 2);
    });

    it('下端ちょうど(sh + h/2)では折り返さないこと', () => {
      const next = stillWalk().next(400, sh + bodySize / 2);
      expect(next.y).toBe(sh + bodySize / 2);
    });

    it('下端 +1 で上側(-h/2)へ折り返すこと', () => {
      const next = stillWalk().next(400, sh + bodySize / 2 + 1);
      expect(next.y).toBe(-(bodySize / 2));
    });

    it('上端ちょうど(y + h = 0)では折り返さないこと', () => {
      const next = stillWalk().next(400, -bodySize);
      expect(next.y).toBe(-bodySize);
    });

    it('上端 -1 で下側(sh + h/2)へ折り返すこと', () => {
      const next = stillWalk().next(400, -bodySize - 1);
      expect(next.y).toBe(sh + bodySize / 2);
    });
  });
});
