import type { Coordinate } from './Coordinate';

export class H {
  public x = 0;
  public y = 0;
  public w = 0;
  public h = 0;
  public r = 0;
  public color = '';

  constructor(private sw: number) {}

  public initializeDrawingProperties(coordinate: Coordinate): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    const fontSize = 24 * this.getScale();
    ctx.font = `${fontSize}px sans-serif`;
    const txtSize = ctx.measureText(this.getName()).width;

    this.x = coordinate.x;
    this.y = coordinate.y;
    this.w = txtSize;
    this.h = txtSize;
    this.r = txtSize / 2;
    this.color = this.getColor();
  }

  public getName(): string {
    return 'H';
  }

  public getColor(): string {
    return `#${Math.random().toString(16).slice(-6)}`;
  }

  public getScale(): number {
    return this.sw < 768 ? 1.0 : 1.2;
  }

  public fillText(
    ctx: CanvasRenderingContext2D,
    name: string,
    props: { size: number; x: number; y: number },
  ): void {
    ctx.fillText(name, props.x, props.y);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const fontSize = 24 * this.getScale();
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 1;

    this.fillText(ctx, this.getName(), { size: this.w, x: this.x, y: this.y });
  }
}
