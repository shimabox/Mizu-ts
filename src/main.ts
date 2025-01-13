import { MizuSimulator } from './simulator/MizuSimulator';
import { Measurement } from './util/Measurement';

const query = window.location.search;
const urlParams = new URLSearchParams(query);
const isMeasureMode = urlParams.get('m') === '1';

window.addEventListener('DOMContentLoaded', () => {
  const simulator = new MizuSimulator();
  const scale = simulator.getScale();
  simulator.init(30 * scale, 50 * scale);

  const loop = () => {
    if (isMeasureMode) {
      Measurement.factory()
        .measure(() => simulator.renderFrame())
        .add(`H: ${simulator.getHLength()}`)
        .add(`O: ${simulator.getOLength()}`)
        .add(`H2o: ${simulator.getH2oLength()}`)
        .render();
    } else {
      simulator.renderFrame();
    }
    requestAnimationFrame(loop);
  };
  loop();
});
