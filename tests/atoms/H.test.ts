import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { H } from '../../src/atoms/H';

describe('H クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('プロパティが初期化されること', () => {
    const h = new H(sw, sh);
    h.initializeDrawingProperties(new Coordinate(100, 200));

    expect(h.x).toBe(100);
    expect(h.y).toBe(200);
  });

  it('描画処理がエラーなく実行されること', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const h = new H(sw, sh);
    h.initializeDrawingProperties(new Coordinate(400, 300));

    expect(() => h.render(ctx)).not.toThrow();
  });

  it('位置がランダムに更新されること', () => {
    const h = new H(sw, sh);
    h.initializeDrawingProperties(new Coordinate(100, 100));

    const initialX = h.x;
    const initialY = h.y;

    h.updatePosition();

    expect(h.x).not.toBe(initialX);
    expect(h.y).not.toBe(initialY);
  });

  it('位置がキャンバスの範囲内に収まること', () => {
    const h = new H(sw, sh);
    h.initializeDrawingProperties(new Coordinate(100, 100));

    for (let i = 0; i < 100; i++) {
      h.updatePosition();

      expect(h.x).toBeGreaterThanOrEqual(0);
      expect(h.x).toBeLessThanOrEqual(sw);
      expect(h.y).toBeGreaterThanOrEqual(0);
      expect(h.y).toBeLessThanOrEqual(sh);
    }
  });
});
