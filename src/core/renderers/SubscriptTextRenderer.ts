import type { ParticleRenderer } from './ParticleRenderer';

const SHADOW_COLOR = '#888';
const SHADOW_OFFSET_X = 1;
const SHADOW_OFFSET_Y = 1;

/**
 * 下付き文字付きテキスト描画(H2 用)。毎フレーム fillText で直描きする。
 *
 * shadow* プロパティは使わない。Canvas 2D の shadow は描画のたびに
 * 別レイヤーへの描画+ブラー+合成が走る高価な経路のため、
 * 「1px ずらした影色のテキストを先に描く」疑似シャドウで置き換えている
 * (旧実装の実効値は shadowBlur=1・オフセット(1,1))。
 * 描画順は旧実装と同じ「本体(影→本体)→ 下付き文字(影→本体)」で、
 * font の切り替えが 2 回で済むようにしている。
 *
 * スプライトキャッシュ(オフスクリーン canvas + drawImage)は実ブラウザ計測で
 * フレーム全体のラスタライズが退行したため不採用(詳細は
 * .claude/docs/redesign-plan.md §2.3)。
 */
export class SubscriptTextRenderer implements ParticleRenderer {
  constructor(
    private readonly text: string, // 例: 'H'
    private readonly subscript: string, // 例: '2'
    private readonly color: string,
    private readonly fontSize: number, // 本体のフォントサイズ
    private readonly subscriptFontSize: number, // 下付き文字のフォントサイズ
    private readonly bodyWidth: number, // 本体テキスト幅(位置の微調整に使う)
  ) {}

  public render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 本体(位置は微調整)
    const bodyX = x - this.bodyWidth / 6;
    ctx.font = `${this.fontSize}px sans-serif`;
    ctx.fillStyle = SHADOW_COLOR;
    ctx.fillText(this.text, bodyX + SHADOW_OFFSET_X, y + SHADOW_OFFSET_Y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, bodyX, y);

    // 下付き文字(位置は微調整)
    const subX = x + 12;
    const subY = y + 3;
    ctx.font = `${this.subscriptFontSize}px sans-serif`;
    ctx.fillStyle = SHADOW_COLOR;
    ctx.fillText(
      this.subscript,
      subX + SHADOW_OFFSET_X,
      subY + SHADOW_OFFSET_Y,
    );
    ctx.fillStyle = this.color;
    ctx.fillText(this.subscript, subX, subY);
  }
}
