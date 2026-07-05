import type { Particle } from '../core/Particle';

/**
 * 粒子の想定される最大半径(px)。
 *
 * 根拠(ParticleFactory の生成ロジックより。node canvas での実測値も併記):
 * - フォントサイズは `24 * getScale()`(getScale は 1.0 または 1.2 の2段階)なので上限は 28.8px。
 * - 最も幅の広いテキストは "H2"(H2 の添字含む描画幅)で、実測(node canvas, sans-serif)では
 *   フォントサイズ 28.8px のとき幅 ≈ 36.8px → 半径 ≈ 18.4px。
 * - H2o(水滴)の直径は `(乱数 * 10 + 18) * getScale()` なので上限は `28 * 1.2 = 33.6px` → 半径 16.8px。
 * - 実測上の最大半径は約 18.4px。ブラウザ・フォント差による誤差を吸収するため
 *   安全マージンを載せて 24px を「想定最大半径」として採用する。
 *
 * この前提は `tests/physics/SpatialGrid.test.ts` の
 * 「ParticleFactory が生成する半径が MAX_PARTICLE_RADIUS を超えない」という
 * canary テストで継続的に検証する。前提が崩れた場合はそこで検知できる。
 */
export const MAX_PARTICLE_RADIUS = 24;

/**
 * 2 粒子が衝突しうる最大距離(= 双方が想定最大半径のときの半径の和)。
 * cellSize はこの値以上でなければならない。
 *
 * これにより「衝突しうる2粒子は、必ず同一セルか隣接セル(3x3)に収まる」という
 * 不変条件が成り立ち、自セル+隣接8セルの走査だけで衝突候補を漏れなく列挙できる
 * (cellSize 未満の距離しか離れていない2点は、各軸のセルインデックス差が高々1になるため)。
 */
export const MAX_COLLISION_DISTANCE = MAX_PARTICLE_RADIUS * 2;

/** CollisionDetector 等が特に理由なく使う既定のセルサイズ。 */
export const DEFAULT_CELL_SIZE = MAX_COLLISION_DISTANCE;

/**
 * 一様グリッドによる空間分割。
 *
 * - セル(バケツ)の配列はコンストラクタで一度だけ確保し、以後使い回す。
 *   `clear()` は各バケツの `length = 0` にするだけで、配列そのものは再アロケートしない。
 * - 座標が画面外(負値・width/height 以上)でも、最も近い端のセルにクランプする。
 */
export class SpatialGrid {
  private readonly cols: number;
  private readonly rows: number;
  private readonly buckets: Particle[][];

  constructor(
    width: number,
    height: number,
    private readonly cellSize: number,
  ) {
    if (cellSize <= 0) {
      throw new Error('cellSize must be greater than 0');
    }
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.buckets = Array.from(
      { length: this.cols * this.rows },
      () => [] as Particle[],
    );
  }

  /** 全バケツを空にする(配列自体は再利用する)。 */
  public clear(): void {
    for (const bucket of this.buckets) {
      bucket.length = 0;
    }
  }

  public insert(p: Particle): void {
    this.buckets[this.cellIndex(p.getX(), p.getY())].push(p);
  }

  /** p と同セル+隣接8セル(3x3)にいる粒子(p 自身を含む)を返す。 */
  public neighbors(p: Particle): Particle[] {
    const col = this.clampCol(Math.floor(p.getX() / this.cellSize));
    const row = this.clampRow(Math.floor(p.getY() / this.cellSize));

    const result: Particle[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      const ny = row + dy;
      if (ny < 0 || ny >= this.rows) {
        continue;
      }
      for (let dx = -1; dx <= 1; dx++) {
        const nx = col + dx;
        if (nx < 0 || nx >= this.cols) {
          continue;
        }
        const bucket = this.buckets[ny * this.cols + nx];
        for (const q of bucket) {
          result.push(q);
        }
      }
    }
    return result;
  }

  private cellIndex(x: number, y: number): number {
    const col = this.clampCol(Math.floor(x / this.cellSize));
    const row = this.clampRow(Math.floor(y / this.cellSize));
    return row * this.cols + col;
  }

  private clampCol(col: number): number {
    return Math.min(Math.max(col, 0), this.cols - 1);
  }

  private clampRow(row: number): number {
    return Math.min(Math.max(row, 0), this.rows - 1);
  }
}
