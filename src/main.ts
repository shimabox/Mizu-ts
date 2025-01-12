import { MizuSimulator } from './simulator/MizuSimulator';

document.addEventListener('DOMContentLoaded', () => {
  const simulator = new MizuSimulator();
  const scale = simulator.getScale();
  simulator.init(30 * scale);
  simulator.renderFrame();
});
