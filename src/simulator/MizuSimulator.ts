import { Coordinate } from '../atoms/Coordinate';
import { H } from '../atoms/H';
import { O } from '../atoms/O';

export class MizuSimulator {
  private h: H[] = [];
  private o: O[] = [];
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

  public init(hCount: number, oCount: number): void {
    for (let i = 0; i < hCount; i++) {
      this.h.push(this.createHAtom());
    }
    for (let i = 0; i < oCount; i++) {
      this.o.push(this.createOAtom());
    }
  }

  public renderFrame(): void {
    this.bufferCtx.fillStyle = '#fff';
    this.bufferCtx.fillRect(0, 0, this.cw, this.ch);

    this.renderH(this.h);
    this.renderO(this.o);

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

  private createHAtom(): H {
    const x = this.cw * Math.random();
    const y = this.ch * Math.random();
    const h = new H(this.cw, this.ch);
    h.initializeDrawingProperties(new Coordinate(x, y));
    return h;
  }

  private createOAtom(): O {
    const x = this.cw * Math.random();
    const y = this.ch * Math.random();
    const o = new O(this.cw, this.ch);
    o.initializeDrawingProperties(new Coordinate(x, y));
    return o;
  }

  private renderH(atoms: H[]): void {
    for (let i = 0; i < atoms.length; i++) {
      const _h = atoms[i];
      _h.updatePosition();
      _h.render(this.bufferCtx);

      if (_h.isMergedH()) {
        continue;
      }

      for (let j = i + 1; j < atoms.length; j++) {
        const target = atoms[j];
        if (!_h.isHit(target)) {
          continue;
        }

        // 結合処理
        _h.mergeAndRender(this.bufferCtx, new Coordinate(_h.x, _h.y));

        // 衝突した相手は新しい H に差し替え
        atoms[j] = this.createHAtom();

        break;
      }
    }
  }

  private renderO(atoms: O[]): void {
    for (let i = 0; i < atoms.length; i++) {
      const _o = atoms[i];
      _o.updatePosition();
      _o.render(this.bufferCtx);
    }
  }
}
