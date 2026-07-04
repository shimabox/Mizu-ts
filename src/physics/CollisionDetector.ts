import type { Particle } from '../core/Particle';

export interface CollisionDetector {
  /**
   * 接触している粒子ペアを列挙する。
   * 同一粒子・重複ペア((a,b) と (b,a))は含めない。
   */
  findHitPairs(particles: readonly Particle[]): Array<[Particle, Particle]>;
}
