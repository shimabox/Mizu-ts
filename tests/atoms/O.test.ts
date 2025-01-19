import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { O } from '../../src/atoms/O';
import { H2 } from '../../src/atoms/H2';

describe('O クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('プロパティが初期化されること', () => {
    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(200, 300));

    expect(o.getX()).toBe(200);
    expect(o.getY()).toBe(300);
  });

  it('位置がランダムに更新され、範囲内に収まること', () => {
    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(200, 300));

    for (let i = 0; i < 100; i++) {
      o.updatePosition();

      expect(o.getX()).toBeGreaterThanOrEqual(0);
      expect(o.getX()).toBeLessThanOrEqual(sw);
      expect(o.getY()).toBeGreaterThanOrEqual(0);
      expect(o.getY()).toBeLessThanOrEqual(sh);
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

  it('H2と衝突判定できること', () => {
    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(100, 100));

    const h2 = new H2(sw, sh);
    h2.initializeDrawingProperties(new Coordinate(105, 105)); // 衝突する位置

    expect(o.isHit(h2)).toBe(true);
  });

  it('H2と衝突しない距離では衝突しないこと', () => {
    const o = new O(sw, sh);
    o.initializeDrawingProperties(new Coordinate(100, 100));

    const h2 = new H2(sw, sh);
    h2.initializeDrawingProperties(new Coordinate(300, 300)); // 衝突しない位置

    expect(o.isHit(h2)).toBe(false);
  });
});
