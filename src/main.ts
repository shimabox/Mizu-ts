import { MathRandom } from './core/Random';
import { ParticleFactory } from './particles/ParticleFactory';
import { GridCollisionDetector } from './physics/GridCollisionDetector';
import { DEFAULT_CELL_SIZE, SpatialGrid } from './physics/SpatialGrid';
import { ReactionRegistry } from './reactions/ReactionRegistry';
import { HHFusion } from './reactions/rules/HHFusion';
import { OxidationToWater } from './reactions/rules/OxidationToWater';
import { MizuSimulator } from './simulator/MizuSimulator';
import { World } from './simulator/World';
import { Measurement } from './util/Measurement';

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

  const loop = () => {
    if (isMeasureMode) {
      Measurement.factory()
        .measure(() => simulator.renderFrame())
        .add(`H: ${simulator.count('H')}`)
        .add(`H2: ${simulator.count('H2')}`)
        .add(`O: ${simulator.count('O')}`)
        .add(`H2o: ${simulator.count('H2o')}`)
        .render();
    } else {
      simulator.renderFrame();
    }
    requestAnimationFrame(loop);
  };
  loop();
});
