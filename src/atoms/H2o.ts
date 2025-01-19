import type { Coordinate } from './Coordinate';

export class H2o {
  private x = 0;
  private y = 0;
  private w = 0;

  private isDeletedFlag = false;

  constructor(
    private sw: number,
    private sh: number,
  ) {}

  public initializeDrawingProperties(coordinate: Coordinate): void {
    const w = (Math.random() * 10 + 18) * this.getScale();
    this.x = coordinate.getX();
    this.y = coordinate.getY();
    this.w = w;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public updatePosition(): void {
    const dx = Math.random() * 5;
    this.x += Math.cos((this.y + dx) / 100);
    this.y += this.w * 0.1;

    if (this.y >= this.sh) {
      this.isDeletedFlag = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const offset = this.w * 0.4;
    const gx = this.x - offset;
    const gy = this.y - offset;
    const gr = this.w / 2 + offset;
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(0, 127, 255, 1)');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.w / 2, 0, Math.PI * 2, true);
    ctx.shadowColor = '#007fff';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.closePath();
  }

  public isDeleted(): boolean {
    return this.isDeletedFlag;
  }

  private getScale(): number {
    return this.sw < 768 ? 1.0 : 1.2;
  }
}
