import type { Random } from '../../src/core/Random';
import { MAX_PARTICLE_RADIUS } from '../../src/physics/SpatialGrid';
import { FakeParticle } from './FakeParticle';

/**
 * SeededRandom を使い、指定範囲内にランダムな座標・半径を持つ FakeParticle 集合を生成する。
 * 半径は MAX_PARTICLE_RADIUS 以下に収め、SpatialGrid の cellSize 前提を満たす。
 */
export function createRandomParticles(
  count: number,
  random: Random,
  width: number,
  height: number,
): FakeParticle[] {
  const particles: FakeParticle[] = [];
  for (let i = 0; i < count; i++) {
    const x = random.next() * width;
    const y = random.next() * height;
    const r = 4 + random.next() * (MAX_PARTICLE_RADIUS - 4);
    particles.push(new FakeParticle('H', x, y, r));
  }
  return particles;
}
