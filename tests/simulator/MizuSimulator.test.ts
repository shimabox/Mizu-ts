import { describe, expect, it, beforeEach } from 'vitest';
import { MizuSimulator } from '../../src/simulator/MizuSimulator';

describe('MizuSimulator クラスのテスト', () => {
  let simulator: MizuSimulator;

  beforeEach(() => {
    simulator = new MizuSimulator();
  });

  it('初期化時に指定された数の H が生成されること', () => {
    simulator.init(10); // H を10個生成
    expect(simulator['h'].length).toBe(10); // プライベート変数を直接確認
  });

  it('H がランダムな座標で初期化されること', () => {
    simulator.init(1); // H を1個生成
    const h = simulator['h'][0];
    expect(h.x).toBeGreaterThanOrEqual(0);
    expect(h.x).toBeLessThanOrEqual(simulator['cw']);
    expect(h.y).toBeGreaterThanOrEqual(0);
    expect(h.y).toBeLessThanOrEqual(simulator['ch']);
  });

  it('フレームの描画がエラーなく実行されること', () => {
    simulator.init(5); // H を5個生成
    expect(() => simulator.renderFrame()).not.toThrow(); // 描画がエラーをスローしない
  });

  it('スケール係数が正しく計算されること', () => {
    // 環境によって異なるスケール値の確認
    Object.defineProperty(simulator, 'cw', { value: 500 }); // 横幅500でテスト
    expect(simulator.getScale()).toBe(1.0);

    Object.defineProperty(simulator, 'cw', { value: 800 }); // 横幅800でテスト
    expect(simulator.getScale()).toBe(1.2);

    Object.defineProperty(simulator, 'cw', { value: 1300 }); // 横幅1300でテスト
    expect(simulator.getScale()).toBe(1.5);
  });
});
