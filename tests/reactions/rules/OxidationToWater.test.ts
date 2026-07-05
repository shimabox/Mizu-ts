import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/core/Random';
import { ParticleFactory } from '../../../src/particles/ParticleFactory';
import { OxidationToWater } from '../../../src/reactions/rules/OxidationToWater';

describe('OxidationToWater のテスト', () => {
  const sw = 800;
  const sh = 600;

  const setup = () => {
    const factory = new ParticleFactory(sw, sh, new SeededRandom(42));
    return { factory, rule: new OxidationToWater(factory) };
  };

  it('pair が (O, H2) であること', () => {
    const { rule } = setup();
    expect(rule.pair).toEqual(['O', 'H2']);
  });

  it('個数収支が O: ±0, H2: -1, H: +1, H2o: +1 であること', () => {
    const { factory, rule } = setup();
    const o = factory.createO(100, 100);
    const h2 = factory.createH2(105, 105);

    const result = rule.react(o, h2);

    const balance = (kind: string) =>
      result.produced.filter((p) => p.kind === kind).length -
      result.consumed.filter((p) => p.kind === kind).length;

    expect(balance('O')).toBe(0);
    expect(balance('H2')).toBe(-1);
    expect(balance('H')).toBe(1);
    expect(balance('H2o')).toBe(1);
  });

  it('H2o が O の座標に生成されること', () => {
    const { factory, rule } = setup();
    const o = factory.createO(200, 300);
    const h2 = factory.createH2(205, 305);

    const result = rule.react(o, h2);

    const h2o = result.produced.find((p) => p.kind === 'H2o');
    expect(h2o).toBeDefined();
    expect(h2o?.getX()).toBe(200);
    expect(h2o?.getY()).toBe(300);
  });

  it('引数の順序が (H2, O) でも同じ結果になること', () => {
    const { factory, rule } = setup();
    const o = factory.createO(200, 300);
    const h2 = factory.createH2(205, 305);

    const result = rule.react(h2, o);

    expect(result.consumed).toContain(o);
    expect(result.consumed).toContain(h2);

    const h2o = result.produced.find((p) => p.kind === 'H2o');
    expect(h2o?.getX()).toBe(200); // O の座標
    expect(h2o?.getY()).toBe(300);
  });

  it('再生成された O と新規 H が画面内の座標であること', () => {
    const { factory, rule } = setup();
    const o = factory.createO(100, 100);
    const h2 = factory.createH2(105, 105);

    const result = rule.react(o, h2);

    const newO = result.produced.find((p) => p.kind === 'O');
    const newH = result.produced.find((p) => p.kind === 'H');
    for (const p of [newO, newH]) {
      expect(p).toBeDefined();
      expect(p?.getX()).toBeGreaterThanOrEqual(0);
      expect(p?.getX()).toBeLessThan(sw);
      expect(p?.getY()).toBeGreaterThanOrEqual(0);
      expect(p?.getY()).toBeLessThan(sh);
    }
  });
});
