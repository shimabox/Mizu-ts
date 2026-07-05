import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { StatsOverlay } from '../../src/debug/StatsOverlay';

describe('StatsOverlay', () => {
  let overlay: StatsOverlay;

  beforeEach(() => {
    overlay = new StatsOverlay();
  });

  afterEach(() => {
    overlay.remove();
  });

  describe('FPS calculation', () => {
    it('should return 0 FPS when no frames have been recorded', () => {
      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();
      expect(text).toContain('FPS: 0.0');
    });

    it('should calculate FPS correctly with 60 frames at 16.67ms intervals (60fps)', () => {
      // Simulate 60 frames with 16.67ms intervals (standard 60fps)
      let timestamp = 0;
      for (let i = 0; i < 60; i++) {
        overlay.frame(timestamp);
        timestamp += 16.67;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      // FPS should be approximately 60
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);
      expect(fps).toBeCloseTo(60, 0); // Allow 1 fps tolerance
    });

    it('should calculate FPS correctly with 30fps intervals (33.33ms)', () => {
      // Simulate frames with 33.33ms intervals (30fps)
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
      expect(fps).toBeCloseTo(30, 0); // Allow 1 fps tolerance
    });

    it('should use moving average of last 60 frames', () => {
      // First 50 frames at 10ms (100fps)
      let timestamp = 0;
      for (let i = 0; i < 50; i++) {
        overlay.frame(timestamp);
        timestamp += 10;
      }

      // Next 20 frames at 50ms (20fps) - this should push out the old 10ms frames
      for (let i = 0; i < 20; i++) {
        overlay.frame(timestamp);
        timestamp += 50;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      // Should have moved average that's influenced by the 50ms intervals
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);

      // Average interval: (10*50 + 50*10) / 60 = 1000/60 = 16.67ms
      // FPS = 1000 / 16.67 ≈ 60
      expect(fps).toBeGreaterThan(20); // Should be influenced by both intervals
      expect(fps).toBeLessThan(100); // Should not be pure 100fps
    });

    it('should keep only last 60 frame intervals', () => {
      // Add 100 frames
      let timestamp = 0;
      for (let i = 0; i < 100; i++) {
        overlay.frame(timestamp);
        timestamp += 16.67;
      }

      overlay.setStats(new Map());
      overlay.render();
      const text = overlay.getText();

      // Should still show FPS ~60 (only using last 60 intervals)
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy();
      const fps = parseFloat(fpsMatch![1]);
      expect(fps).toBeCloseTo(60, 0);
    });
  });

  describe('Frame time measurement', () => {
    it('should display frame time with decimal precision', () => {
      overlay.frame(0);
      overlay.frame(16.58); // 16.58ms interval
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Frame: 16.6ms');
    });

    it('should not floor frame time (no 0.58ms → 0ms)', () => {
      overlay.frame(0);
      overlay.frame(0.58); // Very small frame time
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();

      // Should show 0.5ms or 0.6ms, not 0ms
      const frameMatch = text.match(/Frame: ([\d.]+)ms/);
      expect(frameMatch).toBeTruthy();
      const frameTime = parseFloat(frameMatch![1]);
      expect(frameTime).toBeGreaterThan(0);
    });

    it('should round frame time to 1 decimal place', () => {
      overlay.frame(0);
      overlay.frame(16.667); // Should round to 16.6 or 16.7
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      const frameMatch = text.match(/Frame: ([\d.]+)ms/);
      expect(frameMatch).toBeTruthy();
      const frameTimeStr = frameMatch![1];

      // Should have exactly 1 decimal place
      expect(frameTimeStr).toMatch(/^\d+\.\d$/);
    });
  });

  describe('Update time (renderFrame execution time)', () => {
    it('should display the execution time set via setFrameTime', () => {
      overlay.setFrameTime(1.34);
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Update: 1.3ms');
    });

    it('should not floor the execution time (0.58 → 0.6, not 0)', () => {
      overlay.setFrameTime(0.58);
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Update: 0.6ms');

      const updateMatch = text.match(/Update: ([\d.]+)ms/);
      expect(updateMatch).toBeTruthy();
      expect(parseFloat(updateMatch![1])).toBeGreaterThan(0);
    });

    it('should be independent from the rAF frame interval', () => {
      // rAF interval: 80ms, but renderFrame execution: 69ms
      // (these diverge in practice; both must be shown)
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

  describe('Particle count display', () => {
    it('should display kind-wise particle counts', () => {
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

    it('should display total particle count', () => {
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

    it('should display total as 0 when stats is empty', () => {
      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      expect(text).toContain('Total: 0');
    });

    it('should maintain insertion order of particle kinds', () => {
      const stats = new Map<string, number>();
      stats.set('H', 30);
      stats.set('H2', 5);
      stats.set('O', 50);
      stats.set('H2o', 100);

      overlay.setStats(stats);
      overlay.render();

      const text = overlay.getText();
      const lines = text.split('\n');

      // Find indices of each kind
      const hIndex = lines.findIndex((l) => l.startsWith('H: '));
      const h2Index = lines.findIndex((l) => l.startsWith('H2: '));
      const oIndex = lines.findIndex((l) => l.startsWith('O: '));
      const h2oIndex = lines.findIndex((l) => l.startsWith('H2o: '));

      // Should be in insertion order
      expect(hIndex).toBeLessThan(h2Index);
      expect(h2Index).toBeLessThan(oIndex);
      expect(oIndex).toBeLessThan(h2oIndex);
    });
  });

  describe('Display format', () => {
    it('should display FPS, Frame, Update, particle counts, and total on separate lines', () => {
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

    it('should keep kinds with count 0 visible (no layout jitter)', () => {
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

    it('should have aqua color (matching original overlay)', () => {
      const element = document.querySelector(
        'div[style*="position: absolute"]',
      ) as HTMLDivElement;
      expect(element.style.color).toBe('aqua');
      expect(element.style.backgroundColor).toContain('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('API design', () => {
    it('should allow injection of timestamps for testing', () => {
      // This is the key test: verify that timestamps can be injected
      // to enable deterministic testing of FPS calculation
      const knownTimestamps = [0, 16.67, 33.34, 50.01, 66.68, 83.35, 100.02];

      for (const ts of knownTimestamps) {
        overlay.frame(ts);
      }

      overlay.setStats(new Map());
      overlay.render();

      const text = overlay.getText();
      const fpsMatch = text.match(/FPS: ([\d.]+)/);
      expect(fpsMatch).toBeTruthy(); // Should calculate FPS from known intervals
    });
  });
});
