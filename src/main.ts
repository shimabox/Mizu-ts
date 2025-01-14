import { MizuSimulator } from './simulator/MizuSimulator';
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
  const simulator = new MizuSimulator();
  const scale = simulator.getScale();
  simulator.init(hCount * scale, oCount * scale);

  const loop = () => {
    if (isMeasureMode) {
      Measurement.factory()
        .measure(() => simulator.renderFrame())
        .add(`H: ${simulator.getHLength()}`)
        .add(`H2: ${simulator.getH2Length()}`)
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
