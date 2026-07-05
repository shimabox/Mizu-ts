import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../src/core/Random';
import { ParticleFactory } from '../../src/particles/ParticleFactory';

const sw = 800;
const sh = 600;

const createFactory = (seed = 42) => new ParticleFactory(sw, sh, new SeededRandom(seed));

const createCtx = (): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  return ctx;
};

describe.each([
  ['H', (f: ParticleFactory) => f.createH(100, 200)],
  ['H2', (f: ParticleFactory) => f.createH2(100, 200)],
  ['O', (f: ParticleFactory) => f.createO(100, 200)],
  ['O3', (f: ParticleFactory) => f.createO3(100, 200)],
] as const)('%s クラスのテスト', (kind, create) => {
  it('プロパティが初期化されること', () => {
    const p = create(createFactory());
    expect(p.kind).toBe(kind);
    expect(p.getX()).toBe(100);
    expect(p.getY()).toBe(200);
    expect(p.getRadius()).toBeGreaterThan(0);
    expect(p.isDead()).toBe(false);
  });

  it('update() で位置が更新されること', () => {
    const p = create(createFactory());
    p.update();
    expect(p.getX() === 100 && p.getY() === 200).toBe(false);
  });

  it('update() を繰り返しても画面範囲(ラップアラウンド込み)に収まること', () => {
    const p = create(createFactory());
    for (let i = 0; i < 100; i++) {
      p.update();
      expect(p.getX()).toBeGreaterThanOrEqual(-p.getRadius() * 2);
      expect(p.getX()).toBeLessThanOrEqual(sw + p.getRadius());
      expect(p.getY()).toBeGreaterThanOrEqual(-p.getRadius() * 2);
      expect(p.getY()).toBeLessThanOrEqual(sh + p.getRadius());
    }
  });

  it('render() がエラーなく実行され、状態を変更しないこと', () => {
    const p = create(createFactory());
    p.update();
    const x = p.getX();
    const y = p.getY();

    expect(() => p.render(createCtx())).not.toThrow();

    expect(p.getX()).toBe(x);
    expect(p.getY()).toBe(y);
    expect(p.isDead()).toBe(false);
  });

  it('markDead() で isDead() が true になること', () => {
    const p = create(createFactory());
    p.markDead();
    expect(p.isDead()).toBe(true);
  });
});

describe('H2o クラスのテスト', () => {
  it('プロパティが初期化されること', () => {
    const h2o = createFactory().createH2o(100, 200);
    expect(h2o.kind).toBe('H2o');
    expect(h2o.getX()).toBe(100);
    expect(h2o.getY()).toBe(200);
    expect(h2o.getRadius()).toBeGreaterThan(0);
    expect(h2o.isDead()).toBe(false);
  });

  it('update() で落下する(y が増える)こと', () => {
    const h2o = createFactory().createH2o(100, 100);
    const y = h2o.getY();
    h2o.update();
    expect(h2o.getY()).toBeGreaterThan(y);
  });

  it('画面下端に達したら dead になること', () => {
    const h2o = createFactory().createH2o(100, sh);
    expect(h2o.isDead()).toBe(false);

    h2o.update();
    expect(h2o.isDead()).toBe(true);
  });

  it('render() がエラーなく実行され、状態を変更しないこと', () => {
    const h2o = createFactory().createH2o(300, 400);
    h2o.update();
    const x = h2o.getX();
    const y = h2o.getY();

    expect(() => h2o.render(createCtx())).not.toThrow();

    expect(h2o.getX()).toBe(x);
    expect(h2o.getY()).toBe(y);
    expect(h2o.isDead()).toBe(false);
  });
});
