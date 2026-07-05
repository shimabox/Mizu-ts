import { StatsOverlay } from './debug/StatsOverlay';
import { MizuSimulator } from './simulator/MizuSimulator';

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

  const overlay = isMeasureMode ? new StatsOverlay() : null;

  const loop = (timestamp: DOMHighResTimeStamp) => {
    if (isMeasureMode && overlay) {
      overlay.frame(timestamp);
      const start = performance.now();
      simulator.renderFrame();
      const end = performance.now();
      overlay.setFrameTime(end - start);

      const counts = new Map<string, number>();
      counts.set('H', simulator.getHLength());
      counts.set('H2', simulator.getH2Length());
      counts.set('O', simulator.getOLength());
      counts.set('H2o', simulator.getH2oLength());
      overlay.setStats(counts);

      overlay.render();
    } else {
      simulator.renderFrame();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
