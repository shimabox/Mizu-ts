import type { ParticleRenderer } from './ParticleRenderer';

/**
 * 下付き文字付きテキスト描画(H2 用)。毎フレーム fillText で直描きする。
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
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 1;

    // 本体と下付き文字を分けて描画する
    ctx.font = `${this.fontSize}px sans-serif`;
    ctx.fillText(this.text, x - this.bodyWidth / 6, y); // 位置は微調整
    // 下付き文字を描画
    ctx.font = `${this.subscriptFontSize}px sans-serif`;
    ctx.fillText(this.subscript, x + 12, y + 3); // 位置は微調整
  }
}
