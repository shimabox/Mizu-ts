import { describe, expect, it } from 'vitest';
import type { Particle } from '../../src/core/Particle';
import { BruteForceCollisionDetector } from '../../src/physics/BruteForceCollisionDetector';
import { FakeParticle } from '../helpers/FakeParticle';

describe('BruteForceCollisionDetector のテスト', () => {
  const detector = new BruteForceCollisionDetector();

  it('接触しているペアを検出すること(距離 < 半径の和)', () => {
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 110, 100, 10); // 距離 10 < 20
    const pairs = detector.findHitPairs([a, b]);

    expect(pairs).toEqual([[a, b]]);
  });

  it('距離がちょうど半径の和のときは接触とみなさないこと', () => {
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 120, 100, 10); // 距離 20 = 半径の和
    expect(detector.findHitPairs([a, b])).toEqual([]);
  });

  it('離れているペアは検出しないこと', () => {
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 300, 300, 10);
    expect(detector.findHitPairs([a, b])).toEqual([]);
  });

  it('自分自身や重複ペア((a,b) と (b,a))を返さないこと', () => {
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 105, 100, 10);
    const c = new FakeParticle('H', 110, 100, 10);
    const pairs = detector.findHitPairs([a, b, c]);

    // 3 粒子が全て重なっている → ペアは 3 通りのみ
    expect(pairs).toHaveLength(3);
    for (const [p, q] of pairs) {
      expect(p).not.toBe(q);
    }
    const all: Particle[] = [a, b, c];
    const keys = pairs.map(([p, q]) =>
      [all.indexOf(p), all.indexOf(q)].sort().join('-'),
    );
    expect(new Set(keys).size).toBe(3);
  });

  it('kind に関係なく接触ペアを列挙すること(ルール適用は Registry の責務)', () => {
    const o = new FakeParticle('O', 100, 100, 10);
    const h2o = new FakeParticle('H2o', 105, 100, 10);
    expect(detector.findHitPairs([o, h2o])).toEqual([[o, h2o]]);
  });
});
