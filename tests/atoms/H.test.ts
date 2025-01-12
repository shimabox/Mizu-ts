import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { H } from '../../src/atoms/H';

describe('H クラスのテスト', () => {
  it('プロパティが初期化されること', () => {
    const h = new H(800);
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

    const h = new H(800);
    h.initializeDrawingProperties(new Coordinate(400, 300));

    expect(() => h.render(ctx)).not.toThrow();
  });
});
