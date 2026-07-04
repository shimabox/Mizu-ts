import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/core/Random';
import { ParticleFactory } from '../../../src/particles/ParticleFactory';
import { HHFusion } from '../../../src/reactions/rules/HHFusion';

describe('HHFusion のテスト', () => {
  const sw = 800;
  const sh = 600;

  const setup = () => {
    const factory = new ParticleFactory(sw, sh, new SeededRandom(42));
    return { factory, rule: new HHFusion(factory) };
  };

  it('pair が (H, H) であること', () => {
    const { rule } = setup();
    expect(rule.pair).toEqual(['H', 'H']);
  });

  it('衝突した 2 つの H が consumed になること', () => {
    const { factory, rule } = setup();
    const a = factory.createH(100, 100);
    const b = factory.createH(105, 105);

    const result = rule.react(a, b);

    expect(result.consumed).toEqual([a, b]);
  });

  it('produced に H2(衝突相手の座標)と新規 H が含まれること', () => {
    const { factory, rule } = setup();
    const a = factory.createH(100, 100);
    const b = factory.createH(105, 105);

    const result = rule.react(a, b);

    expect(result.produced).toHaveLength(2);

    const h2 = result.produced.find((p) => p.kind === 'H2');
    expect(h2).toBeDefined();
    expect(h2?.getX()).toBe(105); // b の座標で H2 化
    expect(h2?.getY()).toBe(105);

    const h = result.produced.find((p) => p.kind === 'H');
    expect(h).toBeDefined();
    expect(h?.getX()).toBeGreaterThanOrEqual(0);
    expect(h?.getX()).toBeLessThan(sw);
    expect(h?.getY()).toBeGreaterThanOrEqual(0);
    expect(h?.getY()).toBeLessThan(sh);
  });

  it('個数収支が H: -1, H2: +1 であること', () => {
    const { factory, rule } = setup();
    const a = factory.createH(100, 100);
    const b = factory.createH(105, 105);

    const result = rule.react(a, b);

    const consumedH = result.consumed.filter((p) => p.kind === 'H').length;
    const producedH = result.produced.filter((p) => p.kind === 'H').length;
    const consumedH2 = result.consumed.filter((p) => p.kind === 'H2').length;
    const producedH2 = result.produced.filter((p) => p.kind === 'H2').length;

    expect(producedH - consumedH).toBe(-1);
    expect(producedH2 - consumedH2).toBe(1);
  });
});
