import { describe, expect, it } from 'vitest';
import {
  buildComparisonTable,
  buildDetailTable,
  buildSummaryTable,
  estimateFps,
  judgePerformance,
  judgeRatio,
  mean,
  median,
  p95,
  percentile,
  renderMarkdownTable,
} from '../../scripts/bench/stats.mjs';

describe('mean', () => {
  it('空配列は 0', () => {
    expect(mean([])).toBe(0);
  });

  it('平均値を計算する', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(mean([10])).toBe(10);
  });
});

describe('median', () => {
  it('空配列は 0', () => {
    expect(median([])).toBe(0);
  });

  it('奇数個は中央の値', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('偶数個は中央2値の平均', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('元の配列を破壊しない', () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe('percentile / p95', () => {
  it('空配列は 0', () => {
    expect(percentile([], 95)).toBe(0);
    expect(p95([])).toBe(0);
  });

  it('p95 は nearest-rank 法で上位に近い値を返す', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    expect(p95(values)).toBe(95);
  });

  it('要素数が少なくても範囲外にならない', () => {
    expect(percentile([5], 95)).toBe(5);
    expect(percentile([1, 2], 50)).toBe(1);
  });
});

describe('estimateFps', () => {
  it('16.67ms でおよそ 60fps', () => {
    expect(estimateFps(16.666)).toBeCloseTo(60, 0);
  });

  it('0 以下の場合は 0', () => {
    expect(estimateFps(0)).toBe(0);
    expect(estimateFps(-1)).toBe(0);
  });
});

describe('judgePerformance', () => {
  it('60Hz で張り付き(16.7ms・低ジッタ)はリフレッシュレート律速の注記付き', () => {
    const result = judgePerformance(16.7, 16.7, 17.5); // p95 - 中央値 = 0.8ms < 2ms
    expect(result.emoji).toBe('✅');
    expect(result.label).toBe('60fps維持(表示リフレッシュレート律速の可能性)');
    expect(result.vsyncBound).toBe(true);
  });

  it('75Hz で張り付き(13.3ms・低ジッタ)も律速と判定される(60Hz 前提にしない)', () => {
    const result = judgePerformance(13.34, 13.3, 14.3); // p95 - 中央値 = 1.0ms < 2ms
    expect(result.emoji).toBe('✅');
    expect(result.label).toContain('表示リフレッシュレート律速の可能性');
    expect(result.vsyncBound).toBe(true);
  });

  it('平均が速くてもジッタが大きい(p95 - 中央値 >= 2ms)場合は張り付きとみなさない', () => {
    const result = judgePerformance(10, 9, 15); // p95 - 中央値 = 6ms
    expect(result.emoji).toBe('✅');
    expect(result.label).toBe('60fps維持');
    expect(result.vsyncBound).toBe(false);
  });

  it('ジッタがちょうど 2ms は張り付きとみなさない(境界)', () => {
    const result = judgePerformance(13, 13, 15); // p95 - 中央値 = 2.0ms
    expect(result.vsyncBound).toBe(false);
    expect(result.label).toBe('60fps維持');
  });

  it('30〜60fps 相当は warning', () => {
    const result = judgePerformance(25, 25, 26);
    expect(result.emoji).toBe('⚠️');
    expect(result.vsyncBound).toBe(false);
  });

  it('30fps 未満は NG', () => {
    const result = judgePerformance(100, 100, 110);
    expect(result.emoji).toBe('❌');
    expect(result.vsyncBound).toBe(false);
  });
});

describe('judgeRatio', () => {
  it('現在の方が速い場合は faster 表記', () => {
    const result = judgeRatio(300, 100); // compare=300ms, current=100ms -> 3x faster
    expect(result.emoji).toBe('✅');
    expect(result.label).toBe('3.0x faster');
  });

  it('現在の方が遅い場合は slower 表記', () => {
    const result = judgeRatio(100, 200); // current is 2x slower
    expect(result.emoji).toBe('❌');
    expect(result.label).toBe('2.0x slower');
  });

  it('同値は ➖ ≒同等(+0.0%)', () => {
    const result = judgeRatio(13.34, 13.34);
    expect(result.emoji).toBe('➖');
    expect(result.label).toBe('≒同等(+0.0%)');
  });

  it('差が +5% ちょうどは ≒同等(境界は同等帯に含む)', () => {
    const result = judgeRatio(100, 105); // current が 5% 遅い
    expect(result.emoji).toBe('➖');
    expect(result.label).toBe('≒同等(+5.0%)');
  });

  it('差が -5% ちょうども ≒同等(符号付きで表示)', () => {
    const result = judgeRatio(100, 95); // current が 5% 速い
    expect(result.emoji).toBe('➖');
    expect(result.label).toBe('≒同等(-5.0%)');
  });

  it('差が +5% を超えたら slower 表記(境界のすぐ外)', () => {
    const result = judgeRatio(100, 105.2); // +5.2%
    expect(result.emoji).toBe('❌');
    expect(result.label).toContain('slower');
  });

  it('差が -5% を超えたら faster 表記(境界のすぐ外)', () => {
    const result = judgeRatio(100, 94.8); // -5.2%
    expect(result.emoji).toBe('✅');
    expect(result.label).toContain('faster');
  });

  it('双方ディスプレイ同期律速なら ➖ 比較不能', () => {
    const result = judgeRatio(13.34, 13.34, { bothVsyncBound: true });
    expect(result.emoji).toBe('➖');
    expect(result.label).toBe('比較不能(双方ディスプレイ同期律速)');
    expect(result.ratio).toBeNull();
  });

  it('bothVsyncBound でも 0 以下の値は N/A が優先', () => {
    expect(judgeRatio(0, 100, { bothVsyncBound: true }).label).toBe('N/A');
  });

  it('0 以下の値は N/A', () => {
    expect(judgeRatio(0, 100).label).toBe('N/A');
    expect(judgeRatio(100, 0).label).toBe('N/A');
  });
});

describe('renderMarkdownTable', () => {
  it('ヘッダ・セパレータ・行を持つ Markdown テーブルを生成する', () => {
    const table = renderMarkdownTable(['A', 'B'], [['1', '2']]);
    expect(table).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |');
  });
});

describe('buildSummaryTable', () => {
  it('サマリ表を生成する', () => {
    const table = buildSummaryTable([
      { scenarioLabel: 'default', meanMs: 16.67, fps: 60, judge: { emoji: '✅', label: '60fps維持' } },
    ]);
    expect(table).toContain('| シナリオ | 平均 (ms) | FPS | 判定 |');
    expect(table).toContain('| default | 16.67 | 60.0 | ✅ 60fps維持 |');
  });
});

describe('buildComparisonTable', () => {
  it('比較表を生成する', () => {
    const table = buildComparisonTable([
      {
        scenarioLabel: '500',
        compareMs: 250,
        currentMs: 100,
        ratio: { emoji: '✅', label: '2.5x faster' },
      },
    ]);
    expect(table).toContain('| シナリオ | 比較対象 (ms) | 現在 (ms) | 倍率 |');
    expect(table).toContain('| 500 | 250.00 | 100.00 | ✅ 2.5x faster |');
  });
});

describe('buildDetailTable', () => {
  it('詳細表を生成する', () => {
    const table = buildDetailTable([
      {
        scenarioLabel: 'default',
        medianMs: 16.7,
        p95Ms: 17.5,
        updateMs: 1.3,
        particleCount: 200,
        frames: 300,
      },
    ]);
    expect(table).toContain('| シナリオ | 中央値 (ms) | p95 (ms) | Update (ms) | 終了時粒子数 | 計測フレーム数 |');
    expect(table).toContain('| default | 16.70 | 17.50 | 1.30 | 200 | 300 |');
  });

  it('updateMs / particleCount が null の場合は N/A', () => {
    const table = buildDetailTable([
      { scenarioLabel: 'x', medianMs: 1, p95Ms: 1, updateMs: null, particleCount: null, frames: 10 },
    ]);
    expect(table).toContain('N/A | N/A |');
  });
});
