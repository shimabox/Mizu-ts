import type { Random } from '../Random';
import type { MovementBehavior } from './MovementBehavior';

/**
 * O3 の「揺れながら上昇」する動き。
 * FallAndSway を参考に、y を減らす（上昇）版。
 * 速度は FallAndSway (size * 0.1) の半分程度(size * 0.05) でゆっくり上昇。
 */
export class RiseAndSway implements MovementBehavior {
  constructor(
    private readonly size: number, // O3 の直径 w
    private readonly random: Random,
  ) {}

  public next(x: number, y: number): { x: number; y: number } {
    const dx = this.random.next() * 5;
    return {
      x: x + Math.cos((y + dx) / 100),
      y: y - this.size * 0.05,
    };
  }
}
