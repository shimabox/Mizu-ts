import type { Particle, ParticleKind } from '../core/Particle';
import type { ParticleFactory } from '../particles/ParticleFactory';
import type { CollisionDetector } from '../physics/CollisionDetector';
import type { ReactionRegistry } from '../reactions/ReactionRegistry';
import type { World } from './World';

/**
 * フレームパイプラインの指揮のみを行う。
 * 具象粒子クラス(H, O, …)は知らず、Factory / Registry 経由でのみ扱う。
 */
export class MizuSimulator {
  private readonly cw: number;
  private readonly ch: number;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly bufferCanvas: HTMLCanvasElement;
  private readonly bufferCtx: CanvasRenderingContext2D;
  /**
   * 反応に関与しうる kind の集合(Registry の読み取り専用ビュー)。
   * どのルールにも現れない kind(例: H2o)は衝突判定に渡さない。
   * Registry が返すのはライブビューなので毎フレーム作り直す必要はない。
   */
  private readonly reactiveKinds: ReadonlySet<ParticleKind>;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly world: World,
    private readonly factory: ParticleFactory,
    private readonly registry: ReactionRegistry,
    private readonly collisionDetector: CollisionDetector,
  ) {
    this.cw = canvas.width;
    this.ch = canvas.height;
    this.reactiveKinds = registry.reactiveKinds();

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
      this.world.add(this.factory.createHAtRandom());
    }
    for (let i = 0; i < oCount; i++) {
      this.world.add(this.factory.createOAtRandom());
    }
  }

  public renderFrame(): void {
    // 1. 更新
    for (const p of this.world.all()) {
      p.update();
    }

    // 2. 衝突検出(反応に関与しうる kind のみ。H2o 等の不活性粒子は
    //    大量に滞留するため、渡すとグリッド挿入・近傍列挙が支配的になる)
    const reactive: Particle[] = [];
    for (const p of this.world.all()) {
      if (this.reactiveKinds.has(p.kind)) {
        reactive.push(p);
      }
    }
    const pairs = this.collisionDetector.findHitPairs(reactive);

    // 3. 反応適用
    for (const [a, b] of pairs) {
      if (a.isDead() || b.isDead()) {
        continue; // 同一フレーム多重反応の防止
      }
      const rule = this.registry.find(a.kind, b.kind);
      if (!rule) {
        continue;
      }
      const result = rule.react(a, b);
      for (const c of result.consumed) {
        c.markDead();
      }
      for (const p of result.produced) {
        this.world.add(p);
      }
    }

    // 4. 死亡回収(1 パス)
    this.world.sweep();

    // 5. 描画
    this.bufferCtx.fillStyle = '#fff';
    this.bufferCtx.fillRect(0, 0, this.cw, this.ch);
    for (const p of this.world.all()) {
      p.render(this.bufferCtx);
    }
    this.ctx.drawImage(this.bufferCanvas, 0, 0);
  }

  public count(kind: ParticleKind): number {
    return this.world.count(kind);
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
}
