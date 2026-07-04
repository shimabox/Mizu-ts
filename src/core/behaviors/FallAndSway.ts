import type { Random } from '../Random';
import type { MovementBehavior } from './MovementBehavior';

/**
 * H2o の「揺れながら落下」する動き。
 * 旧 atoms/H2o.ts の updatePosition() をそのまま移植したもの。
 */
export class FallAndSway implements MovementBehavior {
  constructor(
    private readonly sh: number,
    private readonly size: number, // 水滴の直径 w
    private readonly random: Random,
  ) {}

  public next(x: number, y: number): { x: number; y: number } {
    const dx = this.random.next() * 5;
    return {
      x: x + Math.cos((y + dx) / 100),
      y: y + this.size * 0.1,
    };
  }

  /** 画面下端(sh)に到達したか */
  public hasLanded(y: number): boolean {
    return y >= this.sh;
  }
}
