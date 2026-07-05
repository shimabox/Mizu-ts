export type ParticleKind = string; // 'H' | 'H2' | 'O' | 'H2o' | 将来 'O3' | 'CO2' ...

export interface Particle {
  readonly kind: ParticleKind;
  getX(): number;
  getY(): number;
  getRadius(): number;
  /** 位置・状態の更新。描画とは分離する */
  update(): void;
  /** 描画のみ。状態を変更してはならない */
  render(ctx: CanvasRenderingContext2D): void;
  /** World の回収対象か */
  isDead(): boolean;
  markDead(): void;
}
