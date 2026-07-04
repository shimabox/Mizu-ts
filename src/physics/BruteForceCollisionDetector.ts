import type { Particle } from '../core/Particle';
import type { CollisionDetector } from './CollisionDetector';

/**
 * 総当たり O(n^2) の衝突検出。
 * Phase 2 で SpatialGrid ベースの実装に置き換えた後も、
 * プロパティテストの参照実装として残す。
 */
export class BruteForceCollisionDetector implements CollisionDetector {
  public findHitPairs(
    particles: readonly Particle[],
  ): Array<[Particle, Particle]> {
    const pairs: Array<[Particle, Particle]> = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        if (this.isHit(particles[i], particles[j])) {
          pairs.push([particles[i], particles[j]]);
        }
      }
    }
    return pairs;
  }

  private isHit(a: Particle, b: Particle): boolean {
    const dx = b.getX() - a.getX();
    const dy = b.getY() - a.getY();
    const distance = Math.sqrt(dx * dx + dy * dy); // 2粒子間の距離(ピタゴラスの定理)
    const hitDistance = a.getRadius() + b.getRadius(); // 当たり判定の距離(半径の和)

    return distance < hitDistance;
  }
}
