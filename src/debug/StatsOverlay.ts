/**
 * Statistics overlay for debugging and performance monitoring.
 * Displays FPS (60-frame moving average), frame interval, renderFrame
 * execution time, kind-wise particle counts, and total count.
 *
 * Usage:
 *   const overlay = new StatsOverlay();
 *   // In animation loop:
 *   overlay.frame(timestamp);     // from requestAnimationFrame (FPS / interval)
 *   overlay.setFrameTime(ms);     // renderFrame() execution time (JS time)
 *   overlay.setStats(counts);     // Map<kind, count>
 *   overlay.render();             // Update DOM display
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
   * Update FPS calculation with a new frame timestamp.
   * Call this with each requestAnimationFrame callback.
   *
   * @param timestamp - The DOMHighResTimeStamp from requestAnimationFrame
   */
  public frame(timestamp: number): void {
    if (this.lastTimestamp !== null) {
      const interval = timestamp - this.lastTimestamp;
      this.frameIntervals.push(interval);

      // Keep only the last 60 frame intervals (for 60-frame moving average)
      if (this.frameIntervals.length > 60) {
        this.frameIntervals.shift();
      }

      // Store the current frame interval
      this.frameInterval = interval;
    }
    this.lastTimestamp = timestamp;
  }

  /**
   * Set the execution time of the frame update (e.g. renderFrame()).
   * This is distinct from the frame interval: the interval is the wall time
   * between rAF callbacks, while this is the JS time spent in the update.
   *
   * @param ms - Execution time in milliseconds
   */
  public setFrameTime(ms: number): void {
    this.updateTime = ms;
  }

  /**
   * Set particle counts by kind.
   *
   * @param stats - Map of particle kind to count
   */
  public setStats(stats: Map<string, number>): void {
    this.currentStats = stats;
    this.totalCount = Array.from(stats.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
  }

  /**
   * Calculate FPS from the last 60 frame intervals.
   *
   * @returns FPS value, or 0 if insufficient data
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
   * Update the overlay DOM with current stats.
   * Call this after setStats() in each frame.
   */
  public render(): void {
    const fps = this.getFPS();
    const lines: string[] = [];

    // FPS with 1 decimal place
    lines.push(`FPS: ${fps.toFixed(1)}`);

    // Frame interval (rAF timestamp delta) with 1 decimal place
    lines.push(`Frame: ${this.frameInterval.toFixed(1)}ms`);

    // renderFrame execution time (JS time) with 1 decimal place
    // (avoids flooring like the old Math.floor approach: 0.58 → 0.6, not 0)
    lines.push(`Update: ${this.updateTime.toFixed(1)}ms`);

    // Kind-wise particle counts (in insertion order of the map)
    for (const [kind, count] of this.currentStats.entries()) {
      lines.push(`${kind}: ${count}`);
    }

    // Total particle count
    lines.push(`Total: ${this.totalCount}`);

    this.overlayElement.innerText = lines.join('\n');
  }

  /**
   * Remove the overlay from the DOM.
   * Useful for cleanup or testing.
   */
  public remove(): void {
    if (this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
  }

  /**
   * Get the current display text (for testing purposes).
   * Returns the text that would be shown in the overlay.
   *
   * @returns The display text
   */
  public getText(): string {
    return this.overlayElement.innerText;
  }
}
