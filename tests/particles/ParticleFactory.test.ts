import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../src/core/Random';
import { ParticleFactory } from '../../src/particles/ParticleFactory';

describe('ParticleFactory のテスト', () => {
  const sw = 800;
  const sh = 600;

  const createFactory = (width = sw, seed = 42) =>
    new ParticleFactory(width, sh, new SeededRandom(seed));

  it('createH / createH2 / createO / createH2o が指定座標で生成すること', () => {
    const factory = createFactory();
    expect(factory.createH(10, 20).getX()).toBe(10);
    expect(factory.createH2(30, 40).getY()).toBe(40);
    expect(factory.createO(50, 60).getX()).toBe(50);
    expect(factory.createH2o(70, 80).getY()).toBe(80);
  });

  it('createHAtRandom / createOAtRandom が画面内の座標で生成すること', () => {
    const factory = createFactory();
    for (let i = 0; i < 20; i++) {
      const h = factory.createHAtRandom();
      expect(h.getX()).toBeGreaterThanOrEqual(0);
      expect(h.getX()).toBeLessThan(sw);
      expect(h.getY()).toBeGreaterThanOrEqual(0);
      expect(h.getY()).toBeLessThan(sh);

      const o = factory.createOAtRandom();
      expect(o.getX()).toBeGreaterThanOrEqual(0);
      expect(o.getX()).toBeLessThan(sw);
      expect(o.getY()).toBeGreaterThanOrEqual(0);
      expect(o.getY()).toBeLessThan(sh);
    }
  });

  it('画面幅 768 未満と以上で原子の大きさ(スケール)が変わること', () => {
    const small = createFactory(767).createH(0, 0);
    const large = createFactory(768).createH(0, 0);
    // scale 1.0(フォント 24px)と 1.2(フォント 28.8px)で文字幅が変わる
    expect(large.getRadius()).toBeGreaterThan(small.getRadius());
  });

  it('H2o の大きさがスケール込みの範囲(半径 [9, 14) × scale)に収まること', () => {
    // sw=800 → scale 1.2
    const factory = createFactory();
    for (let i = 0; i < 50; i++) {
      const h2o = factory.createH2o(100, 100);
      expect(h2o.getRadius()).toBeGreaterThanOrEqual(9 * 1.2);
      expect(h2o.getRadius()).toBeLessThan(14 * 1.2);
    }
  });

  it('同じシードなら同じ位置・大きさの粒子が生成されること(決定的)', () => {
    const a = createFactory(sw, 7).createHAtRandom();
    const b = createFactory(sw, 7).createHAtRandom();
    expect(a.getX()).toBe(b.getX());
    expect(a.getY()).toBe(b.getY());
    expect(a.getRadius()).toBe(b.getRadius());
  });
});
