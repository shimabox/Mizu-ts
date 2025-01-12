import { Coordinate } from '../atoms/Coordinate';
import { H } from '../atoms/H';

export class MizuSimulator {
  private h: H[] = [];
  private cw: number;
  private ch: number;
  private ctx: CanvasRenderingContext2D;
  private bufferCanvas: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;

  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#myCanvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.cw = canvas.width;
    this.ch = canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;

    // ダブルバッファリング
    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = this.cw;
    this.bufferCanvas.height = this.ch;
    const bufferCtx = this.bufferCanvas.getContext('2d');
    if (!bufferCtx) {
      throw new Error('Buffer canvas context not available');
    }
    this.bufferCtx = bufferCtx;
  }

  public init(hCount: number): void {
    for (let i = 0; i < hCount; i++) {
      this.h.push(this.createAtom());
    }
  }

  public renderFrame(): void {
    this.bufferCtx.fillStyle = '#fff';
    this.bufferCtx.fillRect(0, 0, this.cw, this.ch);

    this.renderAtoms();

    this.ctx.drawImage(this.bufferCanvas, 0, 0);
  }

  public getScale(): number {
    if (this.cw < 768) {
      return 1.0;
    }
    if (this.cw >= 768 && this.cw < 1280) {
      return 1.2;
    }
    return 1.5;
  }

  private createAtom(): H {
    const x = this.cw * Math.random();
    const y = this.ch * Math.random();
    const h = new H(this.cw);
    h.initializeDrawingProperties(new Coordinate(x, y));
    return h;
  }

  private renderAtoms(): void {
    for (const h of this.h) {
      h.render(this.bufferCtx);
    }
  }
}
