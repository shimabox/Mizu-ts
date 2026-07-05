import type { ParticleRenderer } from './ParticleRenderer';

const SHADOW_COLOR = '#007fff';
const SHADOW_OFFSET_X = 1;
const SHADOW_OFFSET_Y = 1;
/**
 * 旧実装(atoms/H2o.ts)は shadowBlur を明示設定していなかったが、
 * 全粒子が共有する bufferCtx 上でテキスト粒子(H/H2/O)の render が設定した
 * shadowBlur = 1 が持ち越されるため、H2o は実質常に shadowBlur = 1 で
 * 描画されていた。暗黙の状態持ち越しに依存せず、実効値の 1 を明示的に設定する。
 */
const SHADOW_BLUR = 1;

/**
 * 水滴(グラデーション円)描画(H2o 用)。
 * 毎フレーム createRadialGradient + arc + fill で直描きする。
 *
 * スプライトキャッシュ(オフスクリーン canvas + drawImage)は実ブラウザ計測で
 * フレーム全体のラスタライズが退行したため不採用(詳細は
 * .claude/docs/redesign-plan.md §2.3)。
 */
export class DropletRenderer implements ParticleRenderer {
  constructor(private readonly size: number) {} // 水滴の直径

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
    ctx.shadowColor = SHADOW_COLOR;
    ctx.shadowOffsetX = SHADOW_OFFSET_X;
    ctx.shadowOffsetY = SHADOW_OFFSET_Y;
    ctx.shadowBlur = SHADOW_BLUR;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.closePath();
  }
}
