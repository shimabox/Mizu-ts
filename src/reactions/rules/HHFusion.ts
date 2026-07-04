import type { Particle, ParticleKind } from '../../core/Particle';
import type { ParticleFactory } from '../../particles/ParticleFactory';
import type { ReactionResult, ReactionRule } from '../ReactionRule';

/**
 * H + H → H2。
 * 片方(b)の座標で H2 が生まれ、もう片方はランダムな新座標の H として
 * 再生成される(個数収支: H -1, H2 +1)。
 */
export class HHFusion implements ReactionRule {
  public readonly pair: [ParticleKind, ParticleKind] = ['H', 'H'];

  constructor(private readonly factory: ParticleFactory) {}

  public react(a: Particle, b: Particle): ReactionResult {
    return {
      consumed: [a, b],
      produced: [
        this.factory.createH2(b.getX(), b.getY()), // 片方の座標で H2 化
        this.factory.createHAtRandom(), // もう片方は再生成(不変条件)
      ],
    };
  }
}
