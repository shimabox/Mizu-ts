import { describe, expect, it } from 'vitest';
import type { Particle } from '../../src/core/Particle';
import { GridCollisionDetector } from '../../src/physics/GridCollisionDetector';
import { DEFAULT_CELL_SIZE, SpatialGrid } from '../../src/physics/SpatialGrid';
import { FakeParticle } from '../helpers/FakeParticle';

describe('GridCollisionDetector のテスト', () => {
  const createDetector = (width = 800, height = 600) =>
    new GridCollisionDetector(new SpatialGrid(width, height, DEFAULT_CELL_SIZE));

  it('接触しているペアを検出すること(距離 < 半径の和)', () => {
    const detector = createDetector();
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 110, 100, 10); // 距離 10 < 20
    const pairs = detector.findHitPairs([a, b]);

    expect(pairs).toEqual([[a, b]]);
  });

  it('距離がちょうど半径の和のときは接触とみなさないこと', () => {
    const detector = createDetector();
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 120, 100, 10); // 距離 20 = 半径の和
    expect(detector.findHitPairs([a, b])).toEqual([]);
  });

  it('離れているペアは検出しないこと', () => {
    const detector = createDetector();
    const a = new FakeParticle('H', 100, 100, 10);
    const b = new FakeParticle('H', 300, 300, 10);
    expect(detector.findHitPairs([a, b])).toEqual([]);
  });

  it('自分自身や重複ペア((a,b) と (b,a))を返さないこと', () => {
    const detector = createDetector();
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
    const detector = createDetector();
    const o = new FakeParticle('O', 100, 100, 10);
    const h2o = new FakeParticle('H2o', 105, 100, 10);
    expect(detector.findHitPairs([o, h2o])).toEqual([[o, h2o]]);
  });

  it('セル境界をまたぐ2粒子の衝突を検出すること', () => {
    // cellSize=DEFAULT_CELL_SIZE。境界(x = cellSize の倍数)の直前・直後に粒子を置く。
    const cellSize = DEFAULT_CELL_SIZE;
    const detector = createDetector(cellSize * 4, cellSize * 4);
    const boundaryX = cellSize * 2;
    const a = new FakeParticle('H', boundaryX - 1, boundaryX, 5); // 左のセル
    const b = new FakeParticle('H', boundaryX + 1, boundaryX, 5); // 右のセル(距離2 < 半径の和10)

    expect(detector.findHitPairs([a, b])).toEqual([[a, b]]);
  });

  it('セルの隅を挟んで斜めに隣接する2粒子の衝突も検出すること', () => {
    const cellSize = DEFAULT_CELL_SIZE;
    const detector = createDetector(cellSize * 4, cellSize * 4);
    const boundary = cellSize * 2;
    const a = new FakeParticle('H', boundary - 1, boundary - 1, 5); // 左上セル
    const b = new FakeParticle('H', boundary + 1, boundary + 1, 5); // 右下セル(斜め隣接)

    expect(detector.findHitPairs([a, b])).toEqual([[a, b]]);
  });
});
