import type { ParticleKind } from '../core/Particle';
import type { ReactionRule } from './ReactionRule';

/**
 * (kindA, kindB) → ReactionRule の登録・検索。
 * ペアは順不同でマッチする。
 */
export class ReactionRegistry {
  private readonly rules = new Map<string, ReactionRule>();
  private readonly kinds = new Set<ParticleKind>();

  public register(rule: ReactionRule): void {
    const [a, b] = rule.pair;
    this.rules.set(this.key(a, b), rule);
    this.rules.set(this.key(b, a), rule);
    this.kinds.add(a);
    this.kinds.add(b);
  }

  public find(a: ParticleKind, b: ParticleKind): ReactionRule | undefined {
    return this.rules.get(this.key(a, b));
  }

  /**
   * 登録済みルールの pair に現れる kind の集合(= 反応に関与しうる kind)。
   * どのルールにも現れない kind(例: H2o)は衝突判定の対象から除外できる。
   * 返り値は内部集合の読み取り専用ビューで、後からルールを register しても追随する。
   */
  public reactiveKinds(): ReadonlySet<ParticleKind> {
    return this.kinds;
  }

  private key(a: ParticleKind, b: ParticleKind): string {
    return `${a}|${b}`;
  }
}
