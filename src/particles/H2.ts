import type { Particle, ParticleKind } from '../core/Particle';
import type { MovementBehavior } from '../core/behaviors/MovementBehavior';
import type { ParticleRenderer } from '../core/renderers/ParticleRenderer';

/** 水素分子。behavior + renderer の合成による薄いクラス */
export class H2 implements Particle {
  public readonly kind: ParticleKind = 'H2';

  private dead = false;

  constructor(
    private x: number,
    private y: number,
    private readonly r: number,
    private readonly movement: MovementBehavior,
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
