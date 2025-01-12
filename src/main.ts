import { MizuSimulator } from './simulator/MizuSimulator';

document.addEventListener('DOMContentLoaded', () => {
  const simulator = new MizuSimulator();
  const scale = simulator.getScale();
  simulator.init(30 * scale);

  const loop = () => {
    simulator.renderFrame();
    requestAnimationFrame(loop);
  };
  loop();
});
