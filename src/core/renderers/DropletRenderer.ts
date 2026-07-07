import type { ParticleRenderer } from './ParticleRenderer';

const SHADOW_COLOR = '#007fff';
const SHADOW_OFFSET_X = 1;
const SHADOW_OFFSET_Y = 1;
const TWO_PI = Math.PI * 2;

/**
 * 水滴(グラデーション円)描画(H2o 用)。
 *
 * shadow* プロパティは使わない。Canvas 2D の shadow は fill のたびに
 * 別レイヤーへの描画+ブラー+合成が走る高価な経路のため、
 * 「1px ずらした影色の単色円を先に描く」疑似シャドウで置き換えている
 * (旧実装の実効値は shadowBlur=1・オフセット(1,1) で、見た目の差は
 * 縁 1px のごく僅かなぼかしの有無のみ)。
 *
 * グラデーションは座標依存のため、原点基準で 1 度だけ生成してキャッシュし、
 * setTransform で粒子位置へ平行移動して使い回す(サイズはインスタンスごとに
 * 固定なので、粒子の生存期間を通して 1 個で足りる)。
 *
 * スプライトキャッシュ(オフスクリーン canvas + drawImage)は実ブラウザ計測で
 * フレーム全体のラスタライズが退行したため不採用(詳細は
 * .claude/docs/redesign-plan.md §2.3)。
 */
export class DropletRenderer implements ParticleRenderer {
  private gradient: CanvasGradient | null = null;

  constructor(private readonly size: number) {} // 水滴の直径

  public render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const r = this.size / 2;

    // 疑似シャドウ: 本体を 1px ずらした影色の単色円
    ctx.beginPath();
    ctx.arc(x + SHADOW_OFFSET_X, y + SHADOW_OFFSET_Y, r, 0, TWO_PI, true);
    ctx.fillStyle = SHADOW_COLOR;
    ctx.fill();

    // 本体(グラデーションは原点基準キャッシュ + setTransform で移動)
    if (!this.gradient) {
      const offset = this.size * 0.4;
      const grad = ctx.createRadialGradient(
        -offset,
        -offset,
        0,
        -offset,
        -offset,
        r + offset,
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(1, 'rgba(0, 127, 255, 1)');
      this.gradient = grad;
    }
    ctx.setTransform(1, 0, 0, 1, x, y);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI, true);
    ctx.fillStyle = this.gradient;
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
