import type { ParticleRenderer } from './ParticleRenderer';

/**
 * 水滴(グラデーション円)描画(H2o 用)。
 * 旧 atoms/H2o.ts の render() の描画部分をそのまま移植したもの。
 */
export class DropletRenderer implements ParticleRenderer {
  constructor(private readonly size: number) {} // 水滴の直径 w

  public render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const offset = this.size * 0.4;
    const gx = x - offset;
    const gy = y - offset;
    const gr = this.size / 2 + offset;
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(0, 127, 255, 1)');

    ctx.beginPath();
    ctx.arc(x, y, this.size / 2, 0, Math.PI * 2, true);
    ctx.shadowColor = '#007fff';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.closePath();
  }
}
