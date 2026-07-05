import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/core/Random';
import { ParticleFactory } from '../../../src/particles/ParticleFactory';
import { OzoneFormation } from '../../../src/reactions/rules/OzoneFormation';

describe('OzoneFormation のテスト', () => {
  const sw = 800;
  const sh = 600;

  const setup = () => {
    const factory = new ParticleFactory(sw, sh, new SeededRandom(42));
    return { factory, rule: new OzoneFormation(factory) };
  };

  it('pair が (O, O) であること', () => {
    const { rule } = setup();
    expect(rule.pair).toEqual(['O', 'O']);
  });

  it('衝突した 2 つの O が consumed になること', () => {
    const { factory, rule } = setup();
    const a = factory.createO(100, 100);
    const b = factory.createO(105, 105);

    const result = rule.react(a, b);

    expect(result.consumed).toEqual([a, b]);
  });

  it('produced に O3(衝突相手の座標)と新規 O が含まれること', () => {
    const { factory, rule } = setup();
    const a = factory.createO(100, 100);
    const b = factory.createO(105, 105);

    const result = rule.react(a, b);

    expect(result.produced).toHaveLength(2);

    const o3 = result.produced.find((p) => p.kind === 'O3');
    expect(o3).toBeDefined();
    expect(o3?.getX()).toBe(105); // b の座標で O3 化
    expect(o3?.getY()).toBe(105);

    const o = result.produced.find((p) => p.kind === 'O');
    expect(o).toBeDefined();
    expect(o?.getX()).toBeGreaterThanOrEqual(0);
    expect(o?.getX()).toBeLessThan(sw);
    expect(o?.getY()).toBeGreaterThanOrEqual(0);
    expect(o?.getY()).toBeLessThan(sh);
  });

  it('個数収支が O: -1, O3: +1 であること', () => {
    const { factory, rule } = setup();
    const a = factory.createO(100, 100);
    const b = factory.createO(105, 105);

    const result = rule.react(a, b);

    const consumedO = result.consumed.filter((p) => p.kind === 'O').length;
    const producedO = result.produced.filter((p) => p.kind === 'O').length;
    const consumedO3 = result.consumed.filter((p) => p.kind === 'O3').length;
    const producedO3 = result.produced.filter((p) => p.kind === 'O3').length;

    expect(producedO - consumedO).toBe(-1);
    expect(producedO3 - consumedO3).toBe(1);
  });
});
