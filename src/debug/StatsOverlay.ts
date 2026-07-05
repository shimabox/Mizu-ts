/**
 * デバッグとパフォーマンス計測用の統計情報オーバーレイ。
 * FPS (直近60フレームの移動平均)、フレーム間隔、renderFrame の実行時間、
 * 種別ごとの粒子数、および合計粒子数をリアルタイム表示する。
 *
 * 使用方法:
 *   const overlay = new StatsOverlay();
 *   // アニメーションループ内で:
 *   overlay.frame(timestamp);     // requestAnimationFrame から (FPS / 間隔計算)
 *   overlay.setFrameTime(ms);     // renderFrame() の実行時間 (JS 計測)
 *   overlay.setStats(counts);     // Map<種別名, 粒子数>
 *   overlay.render();             // DOM 表示を更新
 */
export class StatsOverlay {
  private frameIntervals: number[] = [];
  private lastTimestamp: number | null = null;
  private currentStats: Map<string, number> = new Map();
  private totalCount = 0;
  private frameInterval = 0;
  private updateTime = 0;
  private overlayElement: HTMLDivElement;

  constructor() {
    this.overlayElement = document.createElement('div');
    this.overlayElement.style.position = 'absolute';
    this.overlayElement.style.top = '0px';
    this.overlayElement.style.left = '0px';
    this.overlayElement.style.color = 'aqua';
    this.overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.overlayElement.style.padding = '3px 5px';
    this.overlayElement.style.fontFamily = 'monospace';
    this.overlayElement.style.fontSize = '12px';
    this.overlayElement.style.zIndex = '9999';

    document.body.appendChild(this.overlayElement);
  }

  /**
   * 新しいフレームのタイムスタンプで FPS 計算を更新する。
   * requestAnimationFrame のコールバック毎に呼び出す。
   *
   * @param timestamp - requestAnimationFrame から受け取った DOMHighResTimeStamp
   */
  public frame(timestamp: number): void {
    if (this.lastTimestamp !== null) {
      const interval = timestamp - this.lastTimestamp;
      this.frameIntervals.push(interval);

      // 直近60フレーム分の間隔のみ保持(60フレーム移動平均の計算用)
      if (this.frameIntervals.length > 60) {
        this.frameIntervals.shift();
      }

      // 現在のフレーム間隔を保存
      this.frameInterval = interval;
    }
    this.lastTimestamp = timestamp;
  }

  /**
   * フレーム更新処理(例: renderFrame())の実行時間を設定する。
   * フレーム間隔とは別概念：間隔は rAF コールバック間の実際の経過時間、
   * 一方これは JS の処理に費やされた時間を計測する。
   *
   * @param ms - 実行時間(ミリ秒)
   */
  public setFrameTime(ms: number): void {
    this.updateTime = ms;
  }

  /**
   * 種別ごとの粒子数を設定する。
   *
   * @param stats - 粒子種別から個数へのマップ
   */
  public setStats(stats: Map<string, number>): void {
    this.currentStats = stats;
    this.totalCount = Array.from(stats.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
  }

  /**
   * 直近60フレーム間隔から FPS を計算する。
   *
   * @returns FPS の値、または データ不足の場合は 0
   */
  private getFPS(): number {
    if (this.frameIntervals.length === 0) {
      return 0;
    }

    const totalInterval = this.frameIntervals.reduce(
      (sum, interval) => sum + interval,
      0,
    );
    const avgInterval = totalInterval / this.frameIntervals.length;

    if (avgInterval === 0) {
      return 0;
    }

    return 1000 / avgInterval;
  }

  /**
   * オーバーレイ DOM を現在の統計情報で更新する。
   * 各フレーム内で setStats() の後に呼び出す。
   */
  public render(): void {
    const fps = this.getFPS();
    const lines: string[] = [];

    // 小数第1位の FPS
    lines.push(`FPS: ${fps.toFixed(1)}`);

    // フレーム間隔 (rAF タイムスタンプの差分) 小数第1位
    lines.push(`Frame: ${this.frameInterval.toFixed(1)}ms`);

    // renderFrame の実行時間 (JS 計測) 小数第1位
    // (Math.floor と異なり、0.58 は 0.5 または 0.6 に丸められ 0 にはならない)
    lines.push(`Update: ${this.updateTime.toFixed(1)}ms`);

    // 種別ごとの粒子数(マップの挿入順序を保持)
    for (const [kind, count] of this.currentStats.entries()) {
      lines.push(`${kind}: ${count}`);
    }

    // 総粒子数
    lines.push(`Total: ${this.totalCount}`);

    this.overlayElement.innerText = lines.join('\n');
  }

  /**
   * DOM からオーバーレイを削除する。
   * クリーンアップやテスト時に有用。
   */
  public remove(): void {
    if (this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
  }

  /**
   * 現在の表示テキストを取得する (テスト目的)。
   * オーバーレイに表示されるテキストを返す。
   *
   * @returns 表示テキスト
   */
  public getText(): string {
    return this.overlayElement.innerText;
  }
}
