import type { Particle, ParticleKind } from '../core/Particle';

/**
 * 粒子の追加/削除/kind 別カウントを管理する。
 */
export class World {
  private particles: Particle[] = [];

  public add(p: Particle): void {
    this.particles.push(p);
  }

  public count(kind: ParticleKind): number {
    let n = 0;
    for (const p of this.particles) {
      if (p.kind === kind) {
        n++;
      }
    }
    return n;
  }

  public all(): readonly Particle[] {
    return this.particles;
  }

  /** isDead() な粒子を 1 パスで除去する(生存粒子の順序は保たれる) */
  public sweep(): void {
    this.particles = this.particles.filter((p) => !p.isDead());
  }
}
