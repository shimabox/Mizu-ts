import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { StatsOverlay } from '../../src/debug/StatsOverlay';

describe('StatsOverlay のテスト', () => {
  let overlay: StatsOverlay;

  beforeEach(() => {
    overlay = new StatsOverlay();
  });

  afterEach(() => {
    overlay.remove();
  });

  describe('FPS 計算', () => {
    it('フレームが記録されていない場合 FPS が 0.0 を返すこと', () => {
      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();
      expect(text).toContain('FPS: 0.0');
    });

    it('16.67ms 間隔の60フレームで FPS が 60.0 と計算されること', () => {
      // 標準的な 60fps (16.67ms 間隔)で60フレーム分をシミュレート
      let timestamp = 0;
      for (let i = 0; i < 60; i++) {
        overlay.frame(timestamp);
        timestamp += 16.67;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      // FPS はおよそ 60 になるべき
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);
      expect(fps).toBeCloseTo(60, 0); // 1fps の許容差
    });

    it('33.33ms 間隔の60フレームで FPS が 30.0 と計算されること', () => {
      // 30fps (33.33ms 間隔)でフレーム分をシミュレート
      let timestamp = 0;
      for (let i = 0; i < 60; i++) {
        overlay.frame(timestamp);
        timestamp += 33.33;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);
      expect(fps).toBeCloseTo(30, 0); // 1fps の許容差
    });

    it('直近60フレームの移動平均を使用すること', () => {
      // 最初の50フレームは 10ms (100fps)
      let timestamp = 0;
      for (let i = 0; i < 50; i++) {
        overlay.frame(timestamp);
        timestamp += 10;
      }

      // 次の20フレームは 50ms (20fps) - 古い 10ms フレームが削除される
      for (let i = 0; i < 20; i++) {
        overlay.frame(timestamp);
        timestamp += 50;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      // 50ms 間隔に影響された移動平均になるべき
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);

      // 平均間隔: (10*50 + 50*10) / 60 = 1000/60 = 16.67ms
      // FPS = 1000 / 16.67 ≈ 60
      expect(fps).toBeGreaterThan(20); // 両方の間隔に影響されるべき
      expect(fps).toBeLessThan(100); // 純粋な 100fps ではないべき
    });

    it('直近60フレーム間隔のみを保持すること', () => {
      // 100フレーム追加
      let timestamp = 0;
      for (let i = 0; i < 100; i++) {
        overlay.frame(timestamp);
        timestamp += 16.67;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      // FPS はおよそ 60 のままになるべき(直近60フレーム間隔のみを使用)
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);
      expect(fps).toBeCloseTo(60, 0);
    });
  });

  describe('フレーム時間計測', () => {
    it('フレーム時間を小数精度で表示すること', () => {
      overlay.frame(0);
      overlay.frame(16.58); // 16.58ms 間隔
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Frame: 16.6ms');
    });

    it('フレーム時間を floor しないこと (0.58ms が 0ms にならない)', () => {
      overlay.frame(0);
      overlay.frame(0.58); // 非常に小さいフレーム時間
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();

      // 0ms ではなく 0.5ms または 0.6ms を表示するべき
      const frameMatch = text.match(/Frame: ([\d.]+)ms/);
      expect(frameMatch).toBeTruthy();
      const frameTime = parseFloat(frameMatch![1]);
      expect(frameTime).toBeGreaterThan(0);
    });

    it('フレーム時間を小数第1位に丸めること', () => {
      overlay.frame(0);
      overlay.frame(16.667); // 16.6 または 16.7 に丸められるべき
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      const frameMatch = text.match(/Frame: ([\d.]+)ms/);
      expect(frameMatch).toBeTruthy();
      const frameTimeStr = frameMatch![1];

      // 正確に小数第1位のみを持つべき
      expect(frameTimeStr).toMatch(/^\d+\.\d$/);
    });
  });

  describe('更新時間 (renderFrame 実行時間)', () => {
    it('setFrameTime で設定した実行時間を表示すること', () => {
      overlay.setFrameTime(1.34);
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Update: 1.3ms');
    });

    it('実行時間を floor しないこと (0.58 が 0.6 になり 0 にはならない)', () => {
      overlay.setFrameTime(0.58);
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Update: 0.6ms');

      const updateMatch = text.match(/Update: ([\d.]+)ms/);
      expect(updateMatch).toBeTruthy();
      expect(parseFloat(updateMatch![1])).toBeGreaterThan(0);
    });

    it('rAF フレーム間隔と独立していること', () => {
      // rAF 間隔: 80ms だが renderFrame 実行: 69ms
      // (実際には分岐するため、両者を表示する必要がある)
      overlay.frame(0);
      overlay.frame(80);
      overlay.setFrameTime(69.2);
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Frame: 80.0ms');
      expect(text).toContain('Update: 69.2ms');
    });
  });

  describe('粒子数の表示', () => {
    it('種別ごとの粒子数を表示すること', () => {
      const stats = new Map<string, number>();
      stats.set('H', 30);
      stats.set('H2', 5);
      stats.set('O', 50);
      stats.set('H2o', 100);

      overlay.setStats(stats);
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('H: 30');
      expect(text).toContain('H2: 5');
      expect(text).toContain('O: 50');
      expect(text).toContain('H2o: 100');
    });

    it('合計粒子数を表示すること', () => {
      const stats = new Map<string, number>();
      stats.set('H', 30);
      stats.set('H2', 5);
      stats.set('O', 50);
      stats.set('H2o', 100);

      overlay.setStats(stats);
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Total: 185');
    });

    it('stats が空の場合 Total が 0 を表示すること', () => {
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Total: 0');
    });

    it('粒子種別の挿入順序を保持していること', () => {
      const stats = new Map<string, number>();
      stats.set('H', 30);
      stats.set('H2', 5);
      stats.set('O', 50);
      stats.set('H2o', 100);

      overlay.setStats(stats);
      overlay.render();

      const text = overlay.getText();
      const lines = text.split('\n');

      // 各種別のインデックスを取得
      const hIndex = lines.findIndex((l) => l.startsWith('H: '));
      const h2Index = lines.findIndex((l) => l.startsWith('H2: '));
      const oIndex = lines.findIndex((l) => l.startsWith('O: '));
      const h2oIndex = lines.findIndex((l) => l.startsWith('H2o: '));

      // 挿入順序になるべき
      expect(hIndex).toBeLessThan(h2Index);
      expect(h2Index).toBeLessThan(oIndex);
      expect(oIndex).toBeLessThan(h2oIndex);
    });
  });

  describe('表示形式', () => {
    it('FPS、Frame、Update、粒子数、Total が別々の行に表示されること', () => {
      const stats = new Map<string, number>();
      stats.set('H', 10);
      stats.set('O', 20);

      overlay.frame(0);
      overlay.frame(16.67);
      overlay.setFrameTime(1.3);
      overlay.setStats(stats);
      overlay.render();

      const text = overlay.getText();
      const lines = text.split('\n');

      expect(lines.length).toBe(6); // FPS, Frame, Update, H, O, Total
      expect(lines[0]).toMatch(/^FPS:/);
      expect(lines[1]).toMatch(/^Frame:/);
      expect(lines[2]).toMatch(/^Update:/);
      expect(lines[3]).toMatch(/^H:/);
      expect(lines[4]).toMatch(/^O:/);
      expect(lines[5]).toMatch(/^Total:/);
    });

    it('粒子数が 0 の種別も表示して、レイアウトの揺らぎを起こさないこと', () => {
      const stats = new Map<string, number>();
      stats.set('H', 30);
      stats.set('H2', 0);
      stats.set('O', 50);
      stats.set('H2o', 0);

      overlay.setStats(stats);
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('H2: 0');
      expect(text).toContain('H2o: 0');
      expect(text).toContain('Total: 80');
    });

    it('aqua 色を持つこと (元のオーバーレイに合わせた)', () => {
      const element = document.querySelector(
        'div[style*="position: absolute"]',
      ) as HTMLDivElement;
      expect(element.style.color).toBe('aqua');
      expect(element.style.backgroundColor).toContain('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('API 設計', () => {
    it('テスト用にタイムスタンプをインジェクション可能であること', () => {
      // 重要なテスト: タイムスタンプをインジェクションして
      // FPS 計算の決定的なテストを実現できることを検証
      const knownTimestamps = [0, 16.67, 33.34, 50.01, 66.68, 83.35, 100.02];

      for (const ts of knownTimestamps) {
        overlay.frame(ts);
      }

      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy(); // 既知の間隔から FPS が計算されるべき
    });
  });
});
