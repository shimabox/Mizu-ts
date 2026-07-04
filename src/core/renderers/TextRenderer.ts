import type { ParticleRenderer } from './ParticleRenderer';

/**
 * 影付きテキスト描画(H, O 用)。
 * 旧 atoms/H.ts / O.ts の render() の描画部分をそのまま移植したもの。
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
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 1;

    ctx.font = `${this.fontSize}px sans-serif`;
    ctx.fillText(this.text, x, y);
  }
}
