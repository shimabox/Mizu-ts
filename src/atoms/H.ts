import type { Coordinate } from './Coordinate';

export class H {
  public x = 0;
  public y = 0;
  public w = 0;
  public h = 0;
  public r = 0;
  public color = '';

  private name = 'H';
  private mergedName = 'H2';
  private isMerged = false;
  private vx = 0;
  private vy = 0;

  constructor(
    private sw: number,
    private sh: number,
  ) {}

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
    if (this.isMerged) {
      return this.mergedName;
    }

    return this.name;
  }

  public getColor(): string {
    if (this.isMerged) {
      return this.color;
    }

    return `#${Math.random().toString(16).slice(-6)}`;
  }

  public getScale(): number {
    return this.sw < 768 ? 1.0 : 1.2;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 1;

    const fontSize = 24 * this.getScale();
    ctx.font = `${fontSize}px sans-serif`;
    if (this.isMerged) {
      // "H" と 下付き "2" を分けて描画する
      ctx.fillText('H', this.x - this.w / 2, this.y);
      const fontSize2 = 18 * this.getScale();
      ctx.font = `${fontSize2}px sans-serif`;
      ctx.fillText('2', this.x, this.y + 2);
      return;
    }

    ctx.fillText(this.getName(), this.x, this.y);
  }

  public updatePosition(): void {
    const randomAngle = 2 * Math.PI * Math.random();
    const speedFactor = 0.075;

    this.vx += speedFactor * Math.cos(randomAngle);
    this.vy += speedFactor * Math.sin(randomAngle);

    const maxSpeed = 1.05;
    const currentSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    if (currentSpeed > maxSpeed) {
      this.vx = (this.vx / currentSpeed) * maxSpeed;
      this.vy = (this.vy / currentSpeed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x > this.sw + this.w / 2) this.x = -(this.w / 2);
    if (this.x + this.w < 0) this.x = this.sw + this.w / 2;
    if (this.y > this.sh + this.h / 2) this.y = -(this.h / 2);
    if (this.y + this.h < 0) this.y = this.sh + this.h / 2;
  }

  isHit(target: H): boolean {
    const dx = target.x - this.x; // ターゲットとのx座標の差分を計算
    const dy = target.y - this.y; // ターゲットとのy座標の差分を計算
    const distance = Math.sqrt(dx * dx + dy * dy); // ターゲットとの距離を計算 (ピタゴラスの定理を使用)
    const hitDistance = this.r + target.r; // 当たり判定の距離を計算 (2つのAtomの半径の和)

    return distance < hitDistance; // 距離が当たり判定の距離より小さい場合、衝突していると判定
  }

  public isMergedH(): boolean {
    return this.isMerged;
  }

  public mergeAndRender(
    ctx: CanvasRenderingContext2D,
    coordinate: Coordinate,
  ): void {
    this.isMerged = true;
    this.initializeDrawingProperties(coordinate);
    this.render(ctx);
  }
}
