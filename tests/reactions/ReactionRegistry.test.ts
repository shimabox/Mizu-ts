import { describe, expect, it } from 'vitest';
import { ReactionRegistry } from '../../src/reactions/ReactionRegistry';
import type { ReactionRule } from '../../src/reactions/ReactionRule';

const createRule = (pair: [string, string]): ReactionRule => ({
  pair,
  react: () => ({ consumed: [], produced: [] }),
});

describe('ReactionRegistry のテスト', () => {
  it('(A, B) と (B, A) の両順でルールが引けること', () => {
    const registry = new ReactionRegistry();
    const rule = createRule(['O', 'H2']);
    registry.register(rule);

    expect(registry.find('O', 'H2')).toBe(rule);
    expect(registry.find('H2', 'O')).toBe(rule);
  });

  it('同 kind ペア(H, H)のルールが引けること', () => {
    const registry = new ReactionRegistry();
    const rule = createRule(['H', 'H']);
    registry.register(rule);

    expect(registry.find('H', 'H')).toBe(rule);
  });

  it('未登録ペアは undefined を返すこと', () => {
    const registry = new ReactionRegistry();
    registry.register(createRule(['H', 'H']));

    expect(registry.find('H', 'O')).toBeUndefined();
    expect(registry.find('H2o', 'H2o')).toBeUndefined();
  });

  it('複数ルールを登録してもそれぞれ正しく引けること', () => {
    const registry = new ReactionRegistry();
    const hh = createRule(['H', 'H']);
    const oh2 = createRule(['O', 'H2']);
    registry.register(hh);
    registry.register(oh2);

    expect(registry.find('H', 'H')).toBe(hh);
    expect(registry.find('H2', 'O')).toBe(oh2);
  });
});
