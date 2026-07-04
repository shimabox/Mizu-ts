import type { Random } from '../core/Random';
import { FallAndSway } from '../core/behaviors/FallAndSway';
import { RandomWalk } from '../core/behaviors/RandomWalk';
import { DropletRenderer } from '../core/renderers/DropletRenderer';
import { SubscriptTextRenderer } from '../core/renderers/SubscriptTextRenderer';
import { TextRenderer } from '../core/renderers/TextRenderer';
import { H } from './H';
import { H2 } from './H2';
import { H2o } from './H2o';
import { O } from './O';

/**
 * 粒子の生成を一元化する Factory。
 * 乱数・画面サイズ・スケールを注入して behavior + renderer を合成する。
 */
export class ParticleFactory {
  constructor(
    private readonly sw: number,
    private readonly sh: number,
    private readonly random: Random,
  ) {}

  public createH(x: number, y: number): H {
    const size = this.measureTextWidth('H');
    return new H(
      x,
      y,
      size / 2,
      new RandomWalk(this.sw, this.sh, size, this.random),
      new TextRenderer('H', this.randomColor(), this.baseFontSize()),
    );
  }

  public createHAtRandom(): H {
    return this.createH(
      this.sw * this.random.next(),
      this.sh * this.random.next(),
    );
  }

  public createH2(x: number, y: number): H2 {
    const size = this.measureTextWidth('H2');
    return new H2(
      x,
      y,
      size / 2,
      new RandomWalk(this.sw, this.sh, size, this.random),
      new SubscriptTextRenderer(
        'H',
        '2',
        this.randomColor(),
        this.baseFontSize(),
        18 * this.getScale(),
        size,
      ),
    );
  }

  public createO(x: number, y: number): O {
    const size = this.measureTextWidth('O');
    return new O(
      x,
      y,
      size / 2,
      new RandomWalk(this.sw, this.sh, size, this.random),
      new TextRenderer('O', this.randomColor(), this.baseFontSize()),
    );
  }

  public createOAtRandom(): O {
    return this.createO(
      this.sw * this.random.next(),
      this.sh * this.random.next(),
    );
  }

  public createH2o(x: number, y: number): H2o {
    const size = (this.random.next() * 10 + 18) * this.getScale();
    return new H2o(
      x,
      y,
      size / 2,
      new FallAndSway(this.sh, size, this.random),
      new DropletRenderer(size),
    );
  }

  private baseFontSize(): number {
    return 24 * this.getScale();
  }

  private measureTextWidth(text: string): number {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    ctx.font = `${this.baseFontSize()}px sans-serif`;
    return ctx.measureText(text).width;
  }

  private randomColor(): string {
    return `#${this.random.next().toString(16).slice(-6)}`;
  }

  private getScale(): number {
    return this.sw < 768 ? 1.0 : 1.2;
  }
}
