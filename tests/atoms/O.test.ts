import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { O } from '../../src/atoms/O';

describe('O クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('プロパティが初期化されること', () => {
    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(200, 300));

    expect(o.x).toBe(200);
    expect(o.y).toBe(300);
    expect(o.getName()).toBe('O');
  });

  it('位置がランダムに更新され、範囲内に収まること', () => {
    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(200, 300));

    for (let i = 0; i < 100; i++) {
      o.updatePosition();

      expect(o.x).toBeGreaterThanOrEqual(0);
      expect(o.x).toBeLessThanOrEqual(sw);
      expect(o.y).toBeGreaterThanOrEqual(0);
      expect(o.y).toBeLessThanOrEqual(sh);
    }
  });

  it('描画処理がエラーなく実行されること', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(300, 400));

    expect(() => o.render(ctx)).not.toThrow();
  });
});
