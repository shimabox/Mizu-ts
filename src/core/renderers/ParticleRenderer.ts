export interface ParticleRenderer {
  /** 指定座標に描画する。描画のみで状態を変更してはならない */
  render(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}
