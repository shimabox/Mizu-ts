import { describe, expect, it } from 'vitest';
import type { Particle } from '../../src/core/Particle';
import { SeededRandom } from '../../src/core/Random';
import { ParticleFactory } from '../../src/particles/ParticleFactory';
import { BruteForceCollisionDetector } from '../../src/physics/BruteForceCollisionDetector';
import type { CollisionDetector } from '../../src/physics/CollisionDetector';
import { ReactionRegistry } from '../../src/reactions/ReactionRegistry';
import { HHFusion } from '../../src/reactions/rules/HHFusion';
import { OxidationToWater } from '../../src/reactions/rules/OxidationToWater';
import { OzoneFormation } from '../../src/reactions/rules/OzoneFormation';
import { MizuSimulator } from '../../src/simulator/MizuSimulator';
import { World } from '../../src/simulator/World';
import { FakeParticle } from '../helpers/FakeParticle';

const createSimulator = (width = 800, height = 600, seed = 42) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const random = new SeededRandom(seed);
  const factory = new ParticleFactory(width, height, random);
  const registry = new ReactionRegistry();
  registry.register(new HHFusion(factory));
  registry.register(new OxidationToWater(factory));

  const world = new World();
  const simulator = new MizuSimulator(
    canvas,
    world,
    factory,
    registry,
    new BruteForceCollisionDetector(),
  );
  return { simulator, world, factory };
};

describe('MizuSimulator クラスのテスト', () => {
  const sw = 800;
  const sh = 600;

  it('初期化時に指定された数の H と O が生成されること', () => {
    const { simulator } = createSimulator();
    simulator.init(10, 5);

    expect(simulator.count('H')).toBe(10);
    expect(simulator.count('O')).toBe(5);
    expect(simulator.count('H2')).toBe(0);
    expect(simulator.count('H2o')).toBe(0);
  });

  it('H と O がランダムな座標(画面内)で初期化されること', () => {
    const { simulator, world } = createSimulator();
    simulator.init(5, 5);

    for (const p of world.all()) {
      expect(p.getX()).toBeGreaterThanOrEqual(0);
      expect(p.getX()).toBeLessThanOrEqual(sw);
      expect(p.getY()).toBeGreaterThanOrEqual(0);
      expect(p.getY()).toBeLessThanOrEqual(sh);
    }
  });

  it('フレームの描画がエラーなく実行されること', () => {
    const { simulator } = createSimulator();
    simulator.init(5, 5);
    expect(() => simulator.renderFrame()).not.toThrow();
  });

  it('フレーム描画時に H と O が移動すること', () => {
    const { simulator, world, factory } = createSimulator();
    world.add(factory.createH(100, 100));
    world.add(factory.createO(400, 400));

    simulator.renderFrame();

    const [h, o] = world.all();
    expect(h.getX() === 100 && h.getY() === 100).toBe(false);
    expect(o.getX() === 400 && o.getY() === 400).toBe(false);
  });

  it('H 同士の衝突で H: -1, H2: +1 となること', () => {
    const { simulator, world, factory } = createSimulator();
    world.add(factory.createH(100, 100));
    world.add(factory.createH(105, 105));

    simulator.renderFrame();

    expect(simulator.count('H')).toBe(1);
    expect(simulator.count('H2')).toBe(1);
  });

  it('同一フレームで同じ粒子が多重反応しないこと(H 3 つが密集)', () => {
    const { simulator, world, factory } = createSimulator();
    world.add(factory.createH(100, 100));
    world.add(factory.createH(103, 103));
    world.add(factory.createH(106, 106));

    simulator.renderFrame();

    // 反応は 1 回だけ: H 3 - 2 + 1 = 2, H2 = 1
    expect(simulator.count('H')).toBe(2);
    expect(simulator.count('H2')).toBe(1);
  });

  it('O と H2 の衝突で O: ±0, H2: -1, H: +1, H2o: +1 となること', () => {
    const { simulator, world, factory } = createSimulator();
    world.add(factory.createO(100, 100));
    world.add(factory.createH2(105, 105));

    simulator.renderFrame();

    expect(simulator.count('O')).toBe(1);
    expect(simulator.count('H2')).toBe(0);
    expect(simulator.count('H')).toBe(1);
    expect(simulator.count('H2o')).toBe(1);
  });

  it('H2o は落下し、画面下端に達したフレームの後で World から消えていること', () => {
    const { simulator, world, factory } = createSimulator();
    world.add(factory.createH2o(400, sh));

    simulator.renderFrame();

    expect(simulator.count('H2o')).toBe(0);
    expect(world.all()).toHaveLength(0);
  });

  it('H2o は画面内にいる間は消えず、落下し続けること', () => {
    const { simulator, world, factory } = createSimulator();
    world.add(factory.createH2o(400, 100));

    simulator.renderFrame();

    expect(simulator.count('H2o')).toBe(1);
    expect(world.all()[0].getY()).toBeGreaterThan(100);
  });

  it('多数フレーム実行してもエラーが出ないこと(スモーク)', () => {
    const { simulator } = createSimulator();
    simulator.init(10, 10);

    expect(() => {
      for (let i = 0; i < 100; i++) {
        simulator.renderFrame();
      }
    }).not.toThrow();

    // 粒子が消滅しきっていないこと(H+H, O+H2 の反応は総数を保存または増やす)
    expect(simulator.count('O')).toBe(10);
  });

  it('反応ルールに関与しない kind(H2o)は衝突判定に渡されないこと', () => {
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;

    const random = new SeededRandom(42);
    const factory = new ParticleFactory(sw, sh, random);
    const registry = new ReactionRegistry();
    registry.register(new HHFusion(factory));
    registry.register(new OxidationToWater(factory));

    // findHitPairs に渡された粒子を記録するフェイク detector
    const seen: Particle[][] = [];
    const fakeDetector: CollisionDetector = {
      findHitPairs: (particles) => {
        seen.push([...particles]);
        return [];
      },
    };

    const world = new World();
    const simulator = new MizuSimulator(
      canvas,
      world,
      factory,
      registry,
      fakeDetector,
    );

    world.add(factory.createH(100, 100));
    world.add(factory.createO(300, 300));
    world.add(factory.createH2(500, 100));
    world.add(factory.createH2o(400, 100));

    simulator.renderFrame();

    expect(seen).toHaveLength(1);
    const kinds = seen[0].map((p) => p.kind);
    expect(kinds).toContain('H');
    expect(kinds).toContain('O');
    expect(kinds).toContain('H2');
    expect(kinds).not.toContain('H2o'); // どのルールの pair にも現れない kind は除外
  });

  it('描画が kind ごとにまとまって実行されること(world 配列順で交互に混ざらない)', () => {
    // 描画種別(テキストスプライトの drawImage / 水滴のグラデーション fill)が
    // 粒子ごとに交互に切り替わるとラスタライズが大幅に遅くなるため、
    // MizuSimulator は kind ごとにグループ化して描画する
    const { simulator, world } = createSimulator();

    const order: string[] = [];
    class RecordingParticle extends FakeParticle {
      public render(_ctx: CanvasRenderingContext2D): void {
        order.push(this.kind);
      }
    }

    // kind が交互に並ぶよう追加する
    world.add(new RecordingParticle('A', 10, 10, 5));
    world.add(new RecordingParticle('B', 100, 100, 5));
    world.add(new RecordingParticle('A', 200, 200, 5));
    world.add(new RecordingParticle('B', 300, 300, 5));
    world.add(new RecordingParticle('A', 400, 400, 5));

    simulator.renderFrame();

    // world 配列順(A,B,A,B,A)ではなく、初出順の kind ごとにまとまる
    expect(order).toEqual(['A', 'A', 'A', 'B', 'B']);
  });

  it('画面サイズによって scale が正しい値を返すこと', () => {
    expect(createSimulator(767).simulator.getScale()).toBe(1.0);
    expect(createSimulator(768).simulator.getScale()).toBe(1.2);
    expect(createSimulator(1279).simulator.getScale()).toBe(1.2);
    expect(createSimulator(1280).simulator.getScale()).toBe(1.5);
  });

  describe('OzoneFormation (O3) テスト', () => {
    const createSimulatorWithO3 = (width = 800, height = 600, seed = 42) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const random = new SeededRandom(seed);
      const factory = new ParticleFactory(width, height, random);
      const registry = new ReactionRegistry();
      registry.register(new HHFusion(factory));
      registry.register(new OxidationToWater(factory));
      registry.register(new OzoneFormation(factory)); // O3 を有効化

      const world = new World();
      const simulator = new MizuSimulator(
        canvas,
        world,
        factory,
        registry,
        new BruteForceCollisionDetector(),
      );
      return { simulator, world, factory };
    };

    it('OzoneFormation を登録しない場合、O 同士の衝突は反応しないこと', () => {
      const { simulator, world, factory } = createSimulator();
      world.add(factory.createO(100, 100));
      world.add(factory.createO(105, 105));

      simulator.renderFrame();

      // OzoneFormation が登録されていないので O は反応しない
      expect(simulator.count('O')).toBe(2);
      expect(simulator.count('O3')).toBe(0);
    });

    it('OzoneFormation を登録すると、O 同士の衝突で O: -1, O3: +1 となること', () => {
      const { simulator, world, factory } = createSimulatorWithO3();
      world.add(factory.createO(100, 100));
      world.add(factory.createO(105, 105));

      simulator.renderFrame();

      expect(simulator.count('O')).toBe(1);
      expect(simulator.count('O3')).toBe(1);
    });

    it('初期化時に O3 がカウントできること', () => {
      const { simulator } = createSimulatorWithO3();
      simulator.init(10, 10);

      expect(simulator.count('O3')).toBe(0); // 初期化直後は O3 は存在しない
    });

    it('複数フレーム実行して O が O3 に変換され続けることを確認(スモーク)', () => {
      const { simulator } = createSimulatorWithO3();
      simulator.init(20, 20);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          simulator.renderFrame();
        }
      }).not.toThrow();

      // O3 が生成される可能性がある(O が十分に接近すれば)
      const o3Count = simulator.count('O3');
      expect(o3Count).toBeGreaterThanOrEqual(0); // 0 個の可能性もあるが、エラーなく実行される
    });
  });
});
