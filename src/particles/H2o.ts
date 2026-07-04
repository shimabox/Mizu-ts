import type { Particle, ParticleKind } from '../core/Particle';
import type { FallAndSway } from '../core/behaviors/FallAndSway';
import type { ParticleRenderer } from '../core/renderers/ParticleRenderer';

/**
 * 水分子(水滴)。揺れながら落下し、画面下端に達すると dead になる。
 */
export class H2o implements Particle {
  public readonly kind: ParticleKind = 'H2o';

  private dead = false;

  constructor(
    private x: number,
    private y: number,
    private readonly r: number,
    private readonly movement: FallAndSway,
    private readonly renderer: ParticleRenderer,
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

  public update(): void {
    const next = this.movement.next(this.x, this.y);
    this.x = next.x;
    this.y = next.y;

    if (this.movement.hasLanded(this.y)) {
      this.markDead();
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.renderer.render(ctx, this.x, this.y);
  }

  public isDead(): boolean {
    return this.dead;
  }

  public markDead(): void {
    this.dead = true;
  }
}
