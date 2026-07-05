import { describe, expect, it } from 'vitest';
import { World } from '../../src/simulator/World';
import { FakeParticle } from '../helpers/FakeParticle';

describe('World のテスト', () => {
  it('add / count / all が機能すること', () => {
    const world = new World();
    world.add(new FakeParticle('H', 0, 0, 1));
    world.add(new FakeParticle('H', 10, 10, 1));
    world.add(new FakeParticle('O', 20, 20, 1));

    expect(world.count('H')).toBe(2);
    expect(world.count('O')).toBe(1);
    expect(world.count('H2')).toBe(0);
    expect(world.all()).toHaveLength(3);
  });

  it('sweep 後に dead な粒子が残らないこと', () => {
    const world = new World();
    const p1 = new FakeParticle('H', 0, 0, 1);
    const p2 = new FakeParticle('H', 10, 10, 1);
    const p3 = new FakeParticle('H', 20, 20, 1);
    world.add(p1);
    world.add(p2);
    world.add(p3);

    p2.markDead();
    world.sweep();

    expect(world.count('H')).toBe(2);
    expect(world.all().some((p) => p.isDead())).toBe(false);
  });

  it('sweep 後も生存粒子の順序が保たれること', () => {
    const world = new World();
    const p1 = new FakeParticle('H', 0, 0, 1);
    const p2 = new FakeParticle('H2', 10, 10, 1);
    const p3 = new FakeParticle('O', 20, 20, 1);
    world.add(p1);
    world.add(p2);
    world.add(p3);

    p2.markDead();
    world.sweep();

    expect(world.all()).toEqual([p1, p3]);
  });

  it('空の World でも count / sweep がエラーにならないこと', () => {
    const world = new World();
    expect(world.count('H')).toBe(0);
    expect(() => world.sweep()).not.toThrow();
    expect(world.all()).toEqual([]);
  });
});
