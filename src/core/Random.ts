/**
 * 乱数生成のインターフェース。
 * 実行時は MathRandom を、テストでは SeededRandom を注入することで
 * 挙動を決定的にできる。
 */
export interface Random {
  /** [0, 1) の乱数を返す */
  next(): number;
}

export class MathRandom implements Random {
  public next(): number {
    return Math.random();
  }
}

/**
 * mulberry32 によるシード付き乱数(テスト用)。
 * 同じシードからは常に同じ乱数列が得られる。
 */
export class SeededRandom implements Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
