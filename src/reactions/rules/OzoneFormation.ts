import type { Particle, ParticleKind } from '../../core/Particle';
import type { ParticleFactory } from '../../particles/ParticleFactory';
import type { ReactionResult, ReactionRule } from '../ReactionRule';

/**
 * O + O → O3。
 * 簡略ルール(デモ目的)：
 * 片方(b)の座標で O3 が生まれ、もう片方はランダムな新座標の O として
 * 再生成される(個数収支: O -1, O3 +1)。
 *
 * 実世界の O + O → O3 反応(オゾン生成)は、実際には第3粒子への衝突で安定化する
 * 必要があり、本実装は単純化されたデモンストレーションです。
 */
export class OzoneFormation implements ReactionRule {
  public readonly pair: [ParticleKind, ParticleKind] = ['O', 'O'];

  constructor(private readonly factory: ParticleFactory) {}

  public react(a: Particle, b: Particle): ReactionResult {
    return {
      consumed: [a, b],
      produced: [
        this.factory.createO3(b.getX(), b.getY()), // 片方の座標で O3 化
        this.factory.createOAtRandom(), // もう片方は再生成
      ],
    };
  }
}
