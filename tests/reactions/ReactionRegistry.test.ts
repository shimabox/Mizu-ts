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

  it('reactiveKinds が登録済みルールの pair に現れる kind の集合を返すこと', () => {
    const registry = new ReactionRegistry();
    registry.register(createRule(['H', 'H']));
    registry.register(createRule(['O', 'H2']));

    const kinds = registry.reactiveKinds();
    expect(kinds.has('H')).toBe(true);
    expect(kinds.has('O')).toBe(true);
    expect(kinds.has('H2')).toBe(true);
    expect(kinds.size).toBe(3);
  });

  it('reactiveKinds にどのルールにも現れない kind(H2o)が含まれないこと', () => {
    const registry = new ReactionRegistry();
    registry.register(createRule(['H', 'H']));
    registry.register(createRule(['O', 'H2']));

    expect(registry.reactiveKinds().has('H2o')).toBe(false);
  });

  it('ルール未登録なら reactiveKinds は空であること', () => {
    const registry = new ReactionRegistry();
    expect(registry.reactiveKinds().size).toBe(0);
  });

  it('reactiveKinds は後から register したルールにも追随すること(ライブビュー)', () => {
    const registry = new ReactionRegistry();
    const kinds = registry.reactiveKinds();
    expect(kinds.has('O3')).toBe(false);

    registry.register(createRule(['O', 'O3']));
    expect(kinds.has('O3')).toBe(true);
  });
});
