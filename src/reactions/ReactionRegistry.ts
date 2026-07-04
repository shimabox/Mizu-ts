import type { ParticleKind } from '../core/Particle';
import type { ReactionRule } from './ReactionRule';

/**
 * (kindA, kindB) → ReactionRule の登録・検索。
 * ペアは順不同でマッチする。
 */
export class ReactionRegistry {
  private readonly rules = new Map<string, ReactionRule>();

  public register(rule: ReactionRule): void {
    const [a, b] = rule.pair;
    this.rules.set(this.key(a, b), rule);
    this.rules.set(this.key(b, a), rule);
  }

  public find(a: ParticleKind, b: ParticleKind): ReactionRule | undefined {
    return this.rules.get(this.key(a, b));
  }

  private key(a: ParticleKind, b: ParticleKind): string {
    return `${a}|${b}`;
  }
}
