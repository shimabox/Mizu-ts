import { describe, expect, it, beforeEach } from 'vitest';
import { MizuSimulator } from '../../src/simulator/MizuSimulator';
import { Coordinate } from '../../src/atoms/Coordinate';

describe('MizuSimulator クラスのテスト', () => {
  let simulator: MizuSimulator;

  beforeEach(() => {
    simulator = new MizuSimulator();
  });

  it('初期化時に指定された数の H が生成されること', () => {
    simulator.init(10);
    expect(simulator['h'].length).toBe(10);
  });

  it('H がランダムな座標で初期化されること', () => {
    simulator.init(1);
    const h = simulator['h'][0];
    expect(h.x).toBeGreaterThanOrEqual(0);
    expect(h.x).toBeLessThanOrEqual(simulator['cw']);
    expect(h.y).toBeGreaterThanOrEqual(0);
    expect(h.y).toBeLessThanOrEqual(simulator['ch']);
  });

  it('フレームの描画がエラーなく実行されること', () => {
    simulator.init(5);
    expect(() => simulator.renderFrame()).not.toThrow();
  });

  it('フレーム描画時に H が正しく移動すること', () => {
    simulator.init(1);
    const initialX = simulator['h'][0].x;
    const initialY = simulator['h'][0].y;

    simulator.renderFrame();

    expect(simulator['h'][0].x).not.toBe(initialX);
    expect(simulator['h'][0].y).not.toBe(initialY);
  });

  it('H同士の衝突時に結合が正しく行われること', () => {
    simulator.init(2);
    simulator['h'][0].initializeDrawingProperties(new Coordinate(100, 100));
    simulator['h'][1].initializeDrawingProperties(new Coordinate(105, 105)); // 衝突する位置

    simulator.renderFrame();

    expect(simulator['h'][0].isMergedH()).toBe(true);
  });
});
