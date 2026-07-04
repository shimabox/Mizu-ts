import type { Particle, ParticleKind } from '../core/Particle';

export interface ReactionResult {
  /** 消滅する粒子 */
  consumed: Particle[];
  /** 新規生成する粒子 */
  produced: Particle[];
}

export interface ReactionRule {
  /** このルールが反応させる kind のペア(順不同でマッチさせる) */
  readonly pair: [ParticleKind, ParticleKind];
  react(a: Particle, b: Particle): ReactionResult;
}
