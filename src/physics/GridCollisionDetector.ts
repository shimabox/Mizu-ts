import type { Particle } from '../core/Particle';
import type { CollisionDetector } from './CollisionDetector';
import type { SpatialGrid } from './SpatialGrid';

/**
 * SpatialGrid(一様グリッド)を使った衝突検出。
 *
 * BruteForceCollisionDetector(O(n^2))の代わりに実行時はこちらを使う。
 * SpatialGrid.cellSize が最大衝突距離以上であれば、隣接9セルの走査だけで
 * 全ての衝突候補を漏れなく列挙できる(SpatialGrid のコメント参照)。
 * 平均計算量は密度が極端でない限り O(N) 相当になる。
 */
export class GridCollisionDetector implements CollisionDetector {
  constructor(private readonly grid: SpatialGrid) {}

  public findHitPairs(
    particles: readonly Particle[],
  ): Array<[Particle, Particle]> {
    this.grid.clear();
    for (const p of particles) {
      this.grid.insert(p);
    }

    // (a,b) と (b,a) の重複・自己ペアを避けるため、元配列での index を
    // 「正準の順序」として使う(index が小さい方を必ず先に置く)。
    const indexOf = new Map<Particle, number>();
    particles.forEach((p, i) => indexOf.set(p, i));

    const pairs: Array<[Particle, Particle]> = [];
    for (const p of particles) {
      const pIndex = indexOf.get(p);
      if (pIndex === undefined) {
        continue;
      }
      for (const q of this.grid.neighbors(p)) {
        if (q === p) {
          continue; // 自分自身を除外
        }
        const qIndex = indexOf.get(q);
        if (qIndex === undefined || qIndex <= pIndex) {
          continue; // 重複ペア((a,b)/(b,a))を除外
        }
        if (this.isHit(p, q)) {
          pairs.push([p, q]);
        }
      }
    }
    return pairs;
  }

  private isHit(a: Particle, b: Particle): boolean {
    const dx = b.getX() - a.getX();
    const dy = b.getY() - a.getY();
    const hitDistance = a.getRadius() + b.getRadius();
    // Math.sqrt を避け、距離の2乗と半径の和の2乗を比較する。
    return dx * dx + dy * dy < hitDistance * hitDistance;
  }
}
