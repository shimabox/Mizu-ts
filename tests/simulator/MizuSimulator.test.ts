import { describe, expect, it, beforeEach } from 'vitest';
import { MizuSimulator } from '../../src/simulator/MizuSimulator';
import { Coordinate } from '../../src/atoms/Coordinate';

describe('MizuSimulator クラスのテスト', () => {
  let simulator: MizuSimulator;

  beforeEach(() => {
    simulator = new MizuSimulator();
  });

  it('初期化時に指定された数の H と O が生成されること', () => {
    simulator.init(10, 5);
    expect(simulator['h'].length).toBe(10);
    expect(simulator['o'].length).toBe(5);
  });

  it('H と O がランダムな座標で初期化されること', () => {
    simulator.init(1, 1);

    const h = simulator['h'][0];
    expect(h.x).toBeGreaterThanOrEqual(0);
    expect(h.x).toBeLessThanOrEqual(simulator['cw']);
    expect(h.y).toBeGreaterThanOrEqual(0);
    expect(h.y).toBeLessThanOrEqual(simulator['ch']);

    const o = simulator['o'][0];
    expect(o.x).toBeGreaterThanOrEqual(0);
    expect(o.x).toBeLessThanOrEqual(simulator['cw']);
    expect(o.y).toBeGreaterThanOrEqual(0);
    expect(o.y).toBeLessThanOrEqual(simulator['ch']);
  });

  it('フレームの描画がエラーなく実行されること', () => {
    simulator.init(5, 5);
    expect(() => simulator.renderFrame()).not.toThrow();
  });

  it('フレーム描画時に H と O が正しく移動すること', () => {
    simulator.init(1, 1);

    const initialHX = simulator['h'][0].x;
    const initialHY = simulator['h'][0].y;
    const initialOX = simulator['o'][0].x;
    const initialOY = simulator['o'][0].y;

    simulator.renderFrame();

    expect(simulator['h'][0].x).not.toBe(initialHX);
    expect(simulator['h'][0].y).not.toBe(initialHY);
    expect(simulator['o'][0].x).not.toBe(initialOX);
    expect(simulator['o'][0].y).not.toBe(initialOY);
  });

  it('H 同士が衝突時に正しく結合されること', () => {
    simulator.init(2, 0);
    simulator['h'][0].initializeDrawingProperties(new Coordinate(100, 100));
    simulator['h'][1].initializeDrawingProperties(new Coordinate(105, 105));

    simulator.renderFrame();

    expect(simulator['h'][0].isMergedH()).toBe(true);
  });
});
