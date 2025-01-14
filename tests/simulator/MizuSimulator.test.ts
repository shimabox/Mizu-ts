import { describe, expect, it, beforeEach } from 'vitest';
import { MizuSimulator } from '../../src/simulator/MizuSimulator';
import { Coordinate } from '../../src/atoms/Coordinate';
import { H2o } from '../../src/atoms/H2o';

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
    expect(h.getX()).toBeGreaterThanOrEqual(0);
    expect(h.getX()).toBeLessThanOrEqual(simulator['cw']);
    expect(h.getY()).toBeGreaterThanOrEqual(0);
    expect(h.getY()).toBeLessThanOrEqual(simulator['ch']);

    const o = simulator['o'][0];
    expect(o.getX()).toBeGreaterThanOrEqual(0);
    expect(o.getX()).toBeLessThanOrEqual(simulator['cw']);
    expect(o.getY()).toBeGreaterThanOrEqual(0);
    expect(o.getY()).toBeLessThanOrEqual(simulator['ch']);
  });

  it('フレームの描画がエラーなく実行されること', () => {
    simulator.init(5, 5);
    expect(() => simulator.renderFrame()).not.toThrow();
  });

  it('フレーム描画時に H と O が正しく移動すること', () => {
    simulator.init(1, 1);

    const initialHX = simulator['h'][0].getX();
    const initialHY = simulator['h'][0].getY();
    const initialOX = simulator['o'][0].getX();
    const initialOY = simulator['o'][0].getY();

    simulator.renderFrame();

    expect(simulator['h'][0].getX()).not.toBe(initialHX);
    expect(simulator['h'][0].getY()).not.toBe(initialHY);
    expect(simulator['o'][0].getX()).not.toBe(initialOX);
    expect(simulator['o'][0].getY()).not.toBe(initialOY);
  });

  it('H 同士が衝突時に正しく結合されること', () => {
    simulator.init(2, 0);
    simulator['h'][0].initializeDrawingProperties(new Coordinate(100, 100));
    simulator['h'][1].initializeDrawingProperties(new Coordinate(105, 105));

    simulator.renderFrame();

    expect(simulator['h'][0].isMerged()).toBe(true);
  });

  it('H2とOの衝突時に H2o が生成されること', () => {
    simulator.init(1, 1);
    simulator['h'][0].initializeDrawingProperties(new Coordinate(100, 100));
    simulator['h'][0].mergeAndRender(simulator['bufferCtx'], new Coordinate(100, 100));

    simulator['o'][0].initializeDrawingProperties(new Coordinate(100, 100));

    simulator.renderFrame();

    expect(simulator['h2o'].length).toBe(1);
  });

  it('H2o は画面外に移動したら削除されていること', () => {
    const h2o = new H2o(800, 600);
    h2o.initializeDrawingProperties(new Coordinate(800, 600));
    simulator['h2o'][0] = h2o;

    simulator.renderFrame();

    expect(simulator['h2o'].length).toBe(0);
  });

  it('画面サイズによってscaleが正しい値を返すこと', () => {
    simulator['cw'] = 767;
    simulator['ch'] = 600;

    expect(simulator.getScale()).toBe(1.0);

    simulator['cw'] = 768;
    expect(simulator.getScale()).toBe(1.2);

    simulator['cw'] = 1280;
    expect(simulator.getScale()).toBe(1.5);
  });

});
