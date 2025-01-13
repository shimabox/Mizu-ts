import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { H2o } from '../../src/atoms/H2o';

describe('H2o クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('プロパティが初期化されること', () => {
    const h2o = new H2o(sw, sh);
    h2o.initializeDrawingProperties(new Coordinate(100, 200));

    expect(h2o.x).toBe(100);
    expect(h2o.y).toBe(200);
    expect(h2o.w).toBeGreaterThan(0);
    expect(h2o.h).toBeGreaterThan(0);
  });

  it('位置が更新され、範囲外に出たとき削除フラグが立つこと', () => {
    const h2o = new H2o(sw, sh);
    h2o.initializeDrawingProperties(new Coordinate(100, sh));
    expect(h2o.isDeleted()).toBe(false);

    h2o.updatePosition();
    expect(h2o.isDeleted()).toBe(true);
  });

  it('描画処理がエラーなく実行されること', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const h2o = new H2o(sw, sh);
    h2o.initializeDrawingProperties(new Coordinate(300, 400));

    expect(() => h2o.render(ctx)).not.toThrow();
  });
});
