import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeededRandom } from '../../src/core/Random';
import { ParticleFactory } from '../../src/particles/ParticleFactory';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ParticleFactory のテスト', () => {
  const sw = 800;
  const sh = 600;

  const createFactory = (width = sw, seed = 42) =>
    new ParticleFactory(width, sh, new SeededRandom(seed));

  it('createH / createH2 / createO / createO3 / createH2o が指定座標で生成すること', () => {
    const factory = createFactory();
    expect(factory.createH(10, 20).getX()).toBe(10);
    expect(factory.createH2(30, 40).getY()).toBe(40);
    expect(factory.createO(50, 60).getX()).toBe(50);
    expect(factory.createO3(70, 80).getX()).toBe(70);
    expect(factory.createH2o(90, 100).getY()).toBe(100);
  });

  it('createHAtRandom / createOAtRandom / createO3AtRandom が画面内の座標で生成すること', () => {
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

      const o3 = factory.createO3AtRandom();
      expect(o3.getX()).toBeGreaterThanOrEqual(0);
      expect(o3.getX()).toBeLessThan(sw);
      expect(o3.getY()).toBeGreaterThanOrEqual(0);
      expect(o3.getY()).toBeLessThan(sh);
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

  it('measureText キャッシュがヒットし、2体目以降で canvas 生成が呼ばれないこと', async () => {
    // このファイルの他テストで既に 'H@24' / 'H@28.8' 等がキャッシュ済みのため、
    // 「初回は canvas 生成される」ことまで検証するには static キャッシュをリセットする必要がある。
    // vi.resetModules() 後に動的 import することで、まっさらな static キャッシュを持つ
    // ParticleFactory を得る(このファイル冒頭で静的 import 済みのクラスには影響しない)。
    vi.resetModules();
    const { ParticleFactory: FreshParticleFactory } = await import('../../src/particles/ParticleFactory');
    const { SeededRandom: FreshSeededRandom } = await import('../../src/core/Random');

    const createElementSpy = vi.spyOn(document, 'createElement');
    const factory = new FreshParticleFactory(sw, sh, new FreshSeededRandom(1));

    factory.createH(0, 0);
    const canvasCallsAfterFirst = createElementSpy.mock.calls.filter(([tag]) => tag === 'canvas').length;
    expect(canvasCallsAfterFirst).toBeGreaterThan(0); // 初回は measureText のため canvas が生成される

    factory.createH(10, 10);
    const canvasCallsAfterSecond = createElementSpy.mock.calls.filter(([tag]) => tag === 'canvas').length;
    expect(canvasCallsAfterSecond).toBe(canvasCallsAfterFirst); // 2体目以降はキャッシュヒットで増えない

    factory.createH(20, 20);
    const canvasCallsAfterThird = createElementSpy.mock.calls.filter(([tag]) => tag === 'canvas').length;
    expect(canvasCallsAfterThird).toBe(canvasCallsAfterFirst);
  });
});
