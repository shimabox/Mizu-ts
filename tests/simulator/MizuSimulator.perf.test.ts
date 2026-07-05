import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeededRandom } from '../../src/core/Random';
import { ParticleFactory } from '../../src/particles/ParticleFactory';
import { GridCollisionDetector } from '../../src/physics/GridCollisionDetector';
import { DEFAULT_CELL_SIZE, SpatialGrid } from '../../src/physics/SpatialGrid';
import { ReactionRegistry } from '../../src/reactions/ReactionRegistry';
import { HHFusion } from '../../src/reactions/rules/HHFusion';
import { OxidationToWater } from '../../src/reactions/rules/OxidationToWater';
import { MizuSimulator } from '../../src/simulator/MizuSimulator';
import { World } from '../../src/simulator/World';

/**
 * 性能の粗い回帰チェック(redesign-plan.md §4.5)。
 *
 * 目的は「桁劣化の検知」のみ(例: 衝突判定が O(n^2) 総当たりや O(n^3) に退行する、
 * 毎フレームのグリッド再アロケート等)。厳密なベンチマークは §2.5 の手動プロトコルで行う。
 *
 * 注意: jsdom + canvas パッケージのラスタライズ(特に shadowBlur 付き fillText)は
 * 実ブラウザと桁違いに遅く(実測 ~2.7ms/粒子)、素の renderFrame を 1000 体 × 100 回
 * 実行すると描画だけで数分かかり、Phase 2 の対象である衝突判定の劣化を検知できない
 * (描画コストは Phase 3 のスプライトキャッシュで対処する範囲)。
 * そのため 2D コンテキストをスタブして描画コストを除外し、
 * update → 衝突検出 → 反応適用 → sweep のシミュレーションパイプラインを計測する。
 */
describe('MizuSimulator の性能回帰チェック(粗い上限テスト)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('粒子1000体で renderFrame を100回実行しても十分高速であること(描画スタブ)', () => {
    // 描画を no-op にした 2D コンテキストのスタブ。
    // measureText はサイズ計測(ParticleFactory)で使われるため固定値を返す。
    const stubCtx = {
      canvas: null,
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      fillRect: () => {},
      fillText: () => {},
      drawImage: () => {},
      beginPath: () => {},
      closePath: () => {},
      arc: () => {},
      fill: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      measureText: (text: string) => ({ width: 15 * text.length }),
    };
    const canvasProto = Object.getPrototypeOf(
      document.createElement('canvas'),
    ) as HTMLCanvasElement;
    vi.spyOn(canvasProto, 'getContext').mockReturnValue(
      stubCtx as unknown as ReturnType<HTMLCanvasElement['getContext']>,
    );

    const width = 1280;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const random = new SeededRandom(42);
    const factory = new ParticleFactory(width, height, random);
    const registry = new ReactionRegistry();
    registry.register(new HHFusion(factory));
    registry.register(new OxidationToWater(factory));

    const grid = new SpatialGrid(width, height, DEFAULT_CELL_SIZE);
    const world = new World();
    const simulator = new MizuSimulator(
      canvas,
      world,
      factory,
      registry,
      new GridCollisionDetector(grid),
    );

    simulator.init(500, 500); // 合計 1000 体

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      simulator.renderFrame();
    }
    const elapsed = performance.now() - start;

    // 実測はアイドル環境で ~2s、他プロセス高負荷+テスト並列実行時でも ~24s。
    // 環境ノイズを吸収しつつ桁劣化(O(n^2) 退行や毎フレーム canvas 生成の混入等)
    // のみを検知する、余裕を持った閾値にしている。
    expect(elapsed).toBeLessThan(60_000);
  }, 120_000);
});
