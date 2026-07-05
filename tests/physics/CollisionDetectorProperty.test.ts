import { describe, expect, it } from 'vitest';
import type { Particle } from '../../src/core/Particle';
import { SeededRandom } from '../../src/core/Random';
import { BruteForceCollisionDetector } from '../../src/physics/BruteForceCollisionDetector';
import { GridCollisionDetector } from '../../src/physics/GridCollisionDetector';
import { DEFAULT_CELL_SIZE, SpatialGrid } from '../../src/physics/SpatialGrid';
import { createRandomParticles } from '../helpers/randomParticles';

/** ペアを (元配列でのインデックスの組) に正規化し、ソートして比較可能にする */
function normalize(
  pairs: Array<[Particle, Particle]>,
  particles: readonly Particle[],
): string[] {
  const indexOf = new Map(particles.map((p, i) => [p, i] as const));
  return pairs
    .map(([a, b]) => {
      const ia = indexOf.get(a);
      const ib = indexOf.get(b);
      const [lo, hi] = [ia, ib].sort((x, y) => (x ?? -1) - (y ?? -1));
      return `${lo}-${hi}`;
    })
    .sort();
}

describe('SpatialGrid ベースの衝突検出は総当たりと同じ結果になること(プロパティテスト)', () => {
  const width = 800;
  const height = 600;
  const seeds = [1, 2, 3, 4, 5, 6, 7];

  for (const seed of seeds) {
    it(`seed=${seed}: 500 粒子でペアが完全一致すること`, () => {
      const random = new SeededRandom(seed);
      const particles = createRandomParticles(500, random, width, height);

      const expected = normalize(
        new BruteForceCollisionDetector().findHitPairs(particles),
        particles,
      );

      const grid = new SpatialGrid(width, height, DEFAULT_CELL_SIZE);
      const actual = normalize(
        new GridCollisionDetector(grid).findHitPairs(particles),
        particles,
      );

      expect(actual).toEqual(expected);
      // 少なくともいくつかは衝突が発生する密度にしていることの確認(テストの意味があることの担保)
      expect(expected.length).toBeGreaterThan(0);
    });
  }

  it('粒子が密集していない(疎)な場合でも一致すること', () => {
    const random = new SeededRandom(99);
    const particles = createRandomParticles(50, random, width * 3, height * 3);

    const expected = normalize(
      new BruteForceCollisionDetector().findHitPairs(particles),
      particles,
    );
    const grid = new SpatialGrid(width * 3, height * 3, DEFAULT_CELL_SIZE);
    const actual = normalize(
      new GridCollisionDetector(grid).findHitPairs(particles),
      particles,
    );

    expect(actual).toEqual(expected);
  });
});
