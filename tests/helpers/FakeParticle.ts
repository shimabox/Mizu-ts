import type { Particle, ParticleKind } from '../../src/core/Particle';

/** テスト用の座標・半径固定のダミー粒子 */
export class FakeParticle implements Particle {
  private dead = false;

  constructor(
    public readonly kind: ParticleKind,
    private readonly x: number,
    private readonly y: number,
    private readonly r: number,
  ) {}

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getRadius(): number {
    return this.r;
  }

  public update(): void {}

  public render(_ctx: CanvasRenderingContext2D): void {}

  public isDead(): boolean {
    return this.dead;
  }

  public markDead(): void {
    this.dead = true;
  }
}
