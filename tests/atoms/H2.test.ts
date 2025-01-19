import { describe, expect, it } from 'vitest';
import { Coordinate } from '../../src/atoms/Coordinate';
import { H } from '../../src/atoms/H';
import { H2 } from '../../src/atoms/H2';

describe('H2 クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('プロパティが初期化されること', () => {
    const h2 = new H2(sw, sh, new Coordinate(100, 200));

    expect(h2.getX()).toBe(100);
    expect(h2.getY()).toBe(200);
  });

  it('Hが衝突してもfalseが返却されること', () => {
    const h2 = new H2(sw, sh, new Coordinate(100, 100));
    const h = new H(sw, sh, new Coordinate(110, 110));

    expect(h2.isHit(h)).toBe(false);
  });

  it('描画処理がエラーなく実行されること', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const h2 = new H2(sw, sh, new Coordinate(400, 300));

    expect(() => h2.render(ctx)).not.toThrow();
  });

  it('位置がランダムに更新されること', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const h2 = new H2(sw, sh, new Coordinate(100, 100));

    const initialX = h2.getX();
    const initialY = h2.getY();

    h2.render(ctx);

    expect(h2.getX()).not.toBe(initialX);
    expect(h2.getY()).not.toBe(initialY);
  });
});
