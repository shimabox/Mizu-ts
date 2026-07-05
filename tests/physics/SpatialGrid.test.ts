import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../src/core/Random';
import { ParticleFactory } from '../../src/particles/ParticleFactory';
import {
  MAX_COLLISION_DISTANCE,
  MAX_PARTICLE_RADIUS,
  SpatialGrid,
} from '../../src/physics/SpatialGrid';
import { FakeParticle } from '../helpers/FakeParticle';

describe('SpatialGrid のテスト', () => {
  it('セル境界ちょうどの座標を正しいセルに割り当てること', () => {
    // cellSize=10。probe のセルは floor(25/10)=2 → 隣接9セルは col 1..3, row 1..3
    const grid = new SpatialGrid(100, 100, 10);
    const probe = new FakeParticle('H', 25, 25, 1);

    const justBelowBoundary = new FakeParticle('H', 9.999, 25, 1); // col 0 (範囲外)
    const onBoundary = new FakeParticle('H', 10, 25, 1); // col 1 (範囲内: ちょうど境界は次のセル)

    grid.insert(justBelowBoundary);
    grid.insert(onBoundary);

    const neighbors = grid.neighbors(probe);
    expect(neighbors).not.toContain(justBelowBoundary);
    expect(neighbors).toContain(onBoundary);
  });

  it('画面外の座標(width/height 以上)を最後のセルにクランプすること', () => {
    const grid = new SpatialGrid(100, 100, 10); // cols=rows=10, 最終セル index 9
    const probe = new FakeParticle('H', 95, 95, 1); // col=row=9
    const atEdge = new FakeParticle('H', 100, 100, 1); // 本来は col=10 だが 9 にクランプされるはず
    const farOutside = new FakeParticle('H', 1000, 1000, 1); // 大きく外れても 9 にクランプ

    grid.insert(atEdge);
    grid.insert(farOutside);

    const neighbors = grid.neighbors(probe);
    expect(neighbors).toContain(atEdge);
    expect(neighbors).toContain(farOutside);
  });

  it('負座標を先頭のセル(0,0)にクランプすること', () => {
    const grid = new SpatialGrid(100, 100, 10);
    const probe = new FakeParticle('H', 5, 5, 1); // col=row=0
    const negative = new FakeParticle('H', -50, -50, 1);
    const farNegative = new FakeParticle('H', -1000, -1000, 1);
    const distantProbe = new FakeParticle('H', 95, 95, 1); // col=row=9(離れたセル)

    grid.insert(negative);
    grid.insert(farNegative);

    expect(grid.neighbors(probe)).toContain(negative);
    expect(grid.neighbors(probe)).toContain(farNegative);
    // 負座標のパーティクルは (0,0) にクランプされているので、
    // 遠く離れたセルの neighbors には含まれない
    expect(grid.neighbors(distantProbe)).not.toContain(negative);
    expect(grid.neighbors(distantProbe)).not.toContain(farNegative);
  });

  it('neighbors は自セル+隣接8セル(3x3)の粒子を返すこと', () => {
    const grid = new SpatialGrid(300, 300, 10);
    const center = new FakeParticle('H', 105, 105, 1); // col=row=10

    // 3x3 の範囲内(col/row 9..11)
    const withinRange = [
      new FakeParticle('H', 95, 95, 1), // col=9,row=9
      new FakeParticle('H', 115, 115, 1), // col=11,row=11
      new FakeParticle('H', 105, 95, 1), // col=10,row=9
    ];
    // 範囲外(4セル以上離れる)
    const outOfRange = [
      new FakeParticle('H', 200, 200, 1), // col=20,row=20
      new FakeParticle('H', 5, 5, 1), // col=0,row=0
    ];

    grid.insert(center);
    for (const p of withinRange) {
      grid.insert(p);
    }
    for (const p of outOfRange) {
      grid.insert(p);
    }

    const neighbors = grid.neighbors(center);
    expect(neighbors).toContain(center); // 自セルなので自分自身も含まれる
    for (const p of withinRange) {
      expect(neighbors).toContain(p);
    }
    for (const p of outOfRange) {
      expect(neighbors).not.toContain(p);
    }
  });

  it('clear() を呼ぶと全セルが空になること', () => {
    const grid = new SpatialGrid(100, 100, 10);
    const p = new FakeParticle('H', 50, 50, 1);
    grid.insert(p);
    expect(grid.neighbors(p)).toContain(p);

    grid.clear();
    expect(grid.neighbors(p)).toEqual([]);
  });

  it('clear() 後に insert すると、以前の内容が残っていないこと', () => {
    const grid = new SpatialGrid(100, 100, 10);
    const first = new FakeParticle('H', 50, 50, 1);
    const second = new FakeParticle('H', 50, 50, 1);

    grid.insert(first);
    grid.clear();
    grid.insert(second);

    const neighbors = grid.neighbors(second);
    expect(neighbors).toContain(second);
    expect(neighbors).not.toContain(first);
  });

  it('セル境界をまたぐ2粒子でも互いの neighbors に含まれること', () => {
    const grid = new SpatialGrid(100, 100, 10);
    // x=9.9 は col 0、x=10.1 は col 1 と、隣接するが異なるセルに入る
    const a = new FakeParticle('H', 9.9, 50, 5);
    const b = new FakeParticle('H', 10.1, 50, 5);

    grid.insert(a);
    grid.insert(b);

    expect(grid.neighbors(a)).toContain(b);
    expect(grid.neighbors(b)).toContain(a);
  });

  it('cellSize が 0 以下の場合は例外を投げること', () => {
    expect(() => new SpatialGrid(100, 100, 0)).toThrow();
    expect(() => new SpatialGrid(100, 100, -5)).toThrow();
  });

  it('cellSize は最大衝突距離(MAX_COLLISION_DISTANCE)以上であること', () => {
    expect(MAX_COLLISION_DISTANCE).toBe(MAX_PARTICLE_RADIUS * 2);
  });

  it('ParticleFactory が生成する粒子の半径は MAX_PARTICLE_RADIUS を超えないこと(canary)', () => {
    // SpatialGrid.cellSize の前提(想定最大半径 24px)が崩れていないかを継続的に検証する。
    const random = new SeededRandom(1);
    const factory = new ParticleFactory(1280, 800, random);

    for (let i = 0; i < 200; i++) {
      const h = factory.createHAtRandom();
      const h2 = factory.createH2(0, 0);
      const o = factory.createOAtRandom();
      const h2o = factory.createH2o(0, 0);

      expect(h.getRadius()).toBeLessThanOrEqual(MAX_PARTICLE_RADIUS);
      expect(h2.getRadius()).toBeLessThanOrEqual(MAX_PARTICLE_RADIUS);
      expect(o.getRadius()).toBeLessThanOrEqual(MAX_PARTICLE_RADIUS);
      expect(h2o.getRadius()).toBeLessThanOrEqual(MAX_PARTICLE_RADIUS);
    }
  });
});
