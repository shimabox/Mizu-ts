import type { Random } from '../Random';
import type { MovementBehavior } from './MovementBehavior';

/**
 * H / H2 / O 共通のランダムウォーク。
 * 旧 atoms/H.ts ほかの updatePosition() をそのまま移植したもの。
 * 速度上限 1.05・加速度 0.075・画面端でラップアラウンド。
 */
export class RandomWalk implements MovementBehavior {
  private vx = 0;
  private vy = 0;

  constructor(
    private readonly sw: number,
    private readonly sh: number,
    private readonly bodySize: number, // ラップアラウンド判定に使う w/h 相当
    private readonly random: Random,
    private readonly speedFactor = 0.075,
    private readonly maxSpeed = 1.05,
  ) {}

  public next(x: number, y: number): { x: number; y: number } {
    const randomAngle = 2 * Math.PI * this.random.next();

    this.vx += this.speedFactor * Math.cos(randomAngle);
    this.vy += this.speedFactor * Math.sin(randomAngle);

    const currentSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    if (currentSpeed > this.maxSpeed) {
      this.vx = (this.vx / currentSpeed) * this.maxSpeed;
      this.vy = (this.vy / currentSpeed) * this.maxSpeed;
    }

    let nx = x + this.vx;
    let ny = y + this.vy;

    const w = this.bodySize;
    const h = this.bodySize;
    if (nx > this.sw + w / 2) nx = -(w / 2);
    if (nx + w < 0) nx = this.sw + w / 2;
    if (ny > this.sh + h / 2) ny = -(h / 2);
    if (ny + h < 0) ny = this.sh + h / 2;

    return { x: nx, y: ny };
  }
}
