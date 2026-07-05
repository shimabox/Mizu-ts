import type { Particle, ParticleKind } from '../core/Particle';
import type { MovementBehavior } from '../core/behaviors/MovementBehavior';
import type { ParticleRenderer } from '../core/renderers/ParticleRenderer';

/** オゾン分子。behavior + renderer の合成による薄いクラス + 蒸発のライフサイクル */
export class O3 implements Particle {
  public readonly kind: ParticleKind = 'O3';

  private dead = false;
  private elapsedFrames = 0;
  private opacity = 1;

  constructor(
    private x: number,
    private y: number,
    private readonly r: number,
    private readonly movement: MovementBehavior,
    private readonly renderer: ParticleRenderer,
    private readonly lifespanFrames: number,
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

    this.elapsedFrames++;
    this.opacity = Math.max(0, 1 - this.elapsedFrames / this.lifespanFrames);

    if (this.elapsedFrames >= this.lifespanFrames) {
      this.markDead();
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * this.opacity;
    this.renderer.render(ctx, this.x, this.y);
    ctx.globalAlpha = prev;
  }

  public isDead(): boolean {
    return this.dead;
  }

  public markDead(): void {
    this.dead = true;
  }
}
