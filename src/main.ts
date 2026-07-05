import { MathRandom } from './core/Random';
import { StatsOverlay } from './debug/StatsOverlay';
import { ParticleFactory } from './particles/ParticleFactory';
import { GridCollisionDetector } from './physics/GridCollisionDetector';
import { DEFAULT_CELL_SIZE, SpatialGrid } from './physics/SpatialGrid';
import { ReactionRegistry } from './reactions/ReactionRegistry';
import { HHFusion } from './reactions/rules/HHFusion';
import { OxidationToWater } from './reactions/rules/OxidationToWater';
import { MizuSimulator } from './simulator/MizuSimulator';
import { World } from './simulator/World';

const query = window.location.search;
const urlParams = new URLSearchParams(query);
const isMeasureMode = urlParams.get('m') === '1';

const getSafeNumber = (param: string | null, defaultValue: number): number => {
  const value = Number.parseInt(param || '', 10);
  return Number.isNaN(value) ? defaultValue : value;
};
const hCount = getSafeNumber(urlParams.get('h'), 30);
const oCount = getSafeNumber(urlParams.get('o'), 50);

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#myCanvas');
  if (!canvas) {
    throw new Error('Canvas element not found');
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // DI: Factory・Registry・Detector を組んで Simulator に渡す
  const random = new MathRandom();
  const factory = new ParticleFactory(canvas.width, canvas.height, random);
  const registry = new ReactionRegistry();
  registry.register(new HHFusion(factory));
  registry.register(new OxidationToWater(factory));

  const grid = new SpatialGrid(canvas.width, canvas.height, DEFAULT_CELL_SIZE);
  const simulator = new MizuSimulator(
    canvas,
    new World(),
    factory,
    registry,
    new GridCollisionDetector(grid),
  );

  const scale = simulator.getScale();
  simulator.init(hCount * scale, oCount * scale);

  let overlay: StatsOverlay | null = null;
  if (isMeasureMode) {
    overlay = new StatsOverlay();
  }

  const loop = (timestamp: DOMHighResTimeStamp) => {
    if (overlay) {
      overlay.frame(timestamp);

      // Measure renderFrame execution time (JS time, distinct from rAF interval)
      const renderStart = performance.now();
      simulator.renderFrame();
      overlay.setFrameTime(performance.now() - renderStart);

      // Collect particle counts by kind (always show all kinds, even at 0)
      const stats = new Map<string, number>();
      const allKinds = ['H', 'H2', 'O', 'H2o'];
      for (const kind of allKinds) {
        stats.set(kind, simulator.count(kind));
      }

      overlay.setStats(stats);
      overlay.render();
    } else {
      simulator.renderFrame();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
