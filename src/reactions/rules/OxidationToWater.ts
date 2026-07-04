import type { Particle, ParticleKind } from '../../core/Particle';
import type { ParticleFactory } from '../../particles/ParticleFactory';
import type { ReactionResult, ReactionRule } from '../ReactionRule';

/**
 * O + H2 → H2o。
 * O の座標に H2o が生成され、O はランダムな新座標に再生成、
 * H2 は削除され、新しい H が 1 つ追加される
 * (個数収支: O ±0, H2 -1, H +1, H2o +1)。
 */
export class OxidationToWater implements ReactionRule {
  public readonly pair: [ParticleKind, ParticleKind] = ['O', 'H2'];

  constructor(private readonly factory: ParticleFactory) {}

  public react(a: Particle, b: Particle): ReactionResult {
    // 引数の順序に依存しないよう kind で判別する
    const o = a.kind === 'O' ? a : b;
    const h2 = a.kind === 'O' ? b : a;

    return {
      consumed: [o, h2],
      produced: [
        this.factory.createOAtRandom(), // O は新座標に再生成(正味 ±0)
        this.factory.createHAtRandom(), // 新しい H が 1 つ追加
        this.factory.createH2o(o.getX(), o.getY()), // O の座標に H2o
      ],
    };
  }
}
