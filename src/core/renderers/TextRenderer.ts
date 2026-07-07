import type { ParticleRenderer } from './ParticleRenderer';

const SHADOW_COLOR = '#888';
const SHADOW_OFFSET_X = 1;
const SHADOW_OFFSET_Y = 1;

/**
 * 影付きテキスト描画(H, O 用)。毎フレーム fillText で直描きする。
 *
 * shadow* プロパティは使わない。Canvas 2D の shadow は描画のたびに
 * 別レイヤーへの描画+ブラー+合成が走る高価な経路のため、
 * 「1px ずらした影色のテキストを先に描く」疑似シャドウで置き換えている
 * (旧実装の実効値は shadowBlur=1・オフセット(1,1))。
 *
 * スプライトキャッシュ(オフスクリーン canvas + drawImage)は実ブラウザ計測で
 * フレーム全体のラスタライズが退行したため不採用(詳細は
 * .claude/docs/redesign-plan.md §2.3)。
 */
export class TextRenderer implements ParticleRenderer {
  constructor(
    private readonly text: string,
    private readonly color: string,
    private readonly fontSize: number,
  ) {}

  public render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${this.fontSize}px sans-serif`;

    // 疑似シャドウ → 本体の順に描く
    ctx.fillStyle = SHADOW_COLOR;
    ctx.fillText(this.text, x + SHADOW_OFFSET_X, y + SHADOW_OFFSET_Y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, x, y);
  }
}
