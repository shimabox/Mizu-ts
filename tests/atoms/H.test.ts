import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { H } from '../../src/atoms/H';

describe('H クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('プロパティが初期化されること', () => {
    const h = new H(sw, sh);
    h.initializeDrawingProperties(new Coordinate(100, 200));

    expect(h.getX()).toBe(100);
    expect(h.getY()).toBe(200);
  });

  it('H同士の衝突を正しく判定すること', () => {
    const h1 = new H(sw, sh);
    h1.initializeDrawingProperties(new Coordinate(100, 100));

    const h2 = new H(sw, sh);
    h2.initializeDrawingProperties(new Coordinate(110, 110));

    expect(h1.isHit(h2)).toBe(true);

    h2.initializeDrawingProperties(new Coordinate(300, 300));
    expect(h1.isHit(h2)).toBe(false);
  });

  it('描画処理がエラーなく実行されること', () => {
    const canvas = document.createElement('canvas');
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

    const initialX = h.getX();
    const initialY = h.getY();

    h.updatePosition();

    expect(h.getX()).not.toBe(initialX);
    expect(h.getY()).not.toBe(initialY);
  });
});
