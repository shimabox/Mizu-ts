/**
 * ベンチツール用の純粋な統計・整形関数群。
 *
 * このモジュールの関数はすべて純粋関数(I/O・ブラウザ操作・プロセスアクセスなし)。
 * そのため vitest で直接ユニットテストできる(tests/bench/stats.test.ts 参照)。
 */

/** 算術平均。空配列の場合は 0 を返す。 */
export function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** 中央値。空配列の場合は 0 を返す。 */
export function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * nearest-rank 法によるパーセンタイル計算(単純で決定的)。
 * `p` は 0〜100。空配列の場合は 0 を返す。
 */
export function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

/** p95 のショートハンド。 */
export function p95(values) {
  return percentile(values, 95);
}

/** 平均フレーム時間(ms)から概算 FPS を求める。 */
export function estimateFps(meanMs) {
  return meanMs > 0 ? 1000 / meanMs : 0;
}

/** リフレッシュレート律速とみなす (p95 - 中央値) ジッタ上限(ms)。 */
const REFRESH_BOUND_JITTER_MS = 2;

/**
 * フレーム時間の統計からシナリオの性能を判定する。
 * - 平均 17.5ms 以下: 「60fps維持」(✅)。さらに (p95 - 中央値) が
 *   REFRESH_BOUND_JITTER_MS 未満(= フレーム時間が一定値に張り付いている)なら
 *   ディスプレイのリフレッシュレートに律速されている可能性が高いため、
 *   「表示リフレッシュレート律速の可能性」の注記と vsyncBound フラグを付ける。
 *   60Hz(16.7ms)前提の閾値判定はしない(75Hz なら 13.3ms 等で張り付くため)。
 * - 平均 33.4ms 以下: 「30〜60fps」(⚠️)
 * - それ以外: 「30fps未満」(❌)
 *
 * medianMs / p95Ms を省略した場合はジッタ 0 とみなす(張り付き扱い)。
 */
export function judgePerformance(meanMs, medianMs = meanMs, p95Ms = meanMs) {
  if (meanMs <= 17.5) {
    const vsyncBound = p95Ms - medianMs < REFRESH_BOUND_JITTER_MS;
    return {
      emoji: '✅',
      label: vsyncBound
        ? '60fps維持(表示リフレッシュレート律速の可能性)'
        : '60fps維持',
      vsyncBound,
    };
  }
  if (meanMs <= 33.4) {
    return { emoji: '⚠️', label: '30〜60fps', vsyncBound: false };
  }
  return { emoji: '❌', label: '30fps未満', vsyncBound: false };
}

/** 「≒同等」とみなす差分の上限(±%)。 */
const EQUIVALENCE_BAND_PCT = 5;

/**
 * 比較対象(--compare ref)の平均フレーム時間と現在の平均フレーム時間を比べ、
 * 人が読みやすい倍率ラベルを生成する。
 *
 * - bothVsyncBound が true(両者ともディスプレイ同期律速と判定)の場合、
 *   フレーム時間はどちらもリフレッシュレートの上限に張り付いているだけで
 *   倍率に意味がないため「➖ 比較不能」を返す。
 * - 差が ±5% 以内なら「➖ ≒同等(符号付き差分%)」。差分% は
 *   (currentMs - compareMs) / compareMs で、正 = 現在の方が遅い。
 * - ±5% を超えた場合のみ ratio = compareMs / currentMs で
 *   ratio >= 1 -> ✅ "Nx faster" / ratio < 1 -> ❌ "Nx slower"
 */
export function judgeRatio(
  compareMs,
  currentMs,
  { bothVsyncBound = false } = {},
) {
  if (currentMs <= 0 || compareMs <= 0) {
    return { ratio: 0, emoji: '❌', label: 'N/A' };
  }
  if (bothVsyncBound) {
    return {
      ratio: null,
      emoji: '➖',
      label: '比較不能(双方ディスプレイ同期律速)',
    };
  }
  const diffPct = ((currentMs - compareMs) / compareMs) * 100;
  const ratio = compareMs / currentMs;
  if (Math.abs(diffPct) <= EQUIVALENCE_BAND_PCT) {
    const sign = diffPct >= 0 ? '+' : '';
    return {
      ratio,
      emoji: '➖',
      label: `≒同等(${sign}${diffPct.toFixed(1)}%)`,
    };
  }
  if (ratio >= 1) {
    return { ratio, emoji: '✅', label: `${ratio.toFixed(1)}x faster` };
  }
  return { ratio, emoji: '❌', label: `${(1 / ratio).toFixed(1)}x slower` };
}

/** ヘッダ配列と行セル配列から GitHub Flavored Markdown のテーブルを生成する。 */
export function renderMarkdownTable(headers, rows) {
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyLines = rows.map((row) => `| ${row.join(' | ')} |`);
  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

/**
 * 「結果サマリ」表を生成する。
 * entries: [{ scenarioLabel, meanMs, fps, judge: { emoji, label } }]
 */
export function buildSummaryTable(entries) {
  const headers = ['シナリオ', '平均 (ms)', 'FPS', '判定'];
  const rows = entries.map((e) => [
    e.scenarioLabel,
    e.meanMs.toFixed(2),
    e.fps.toFixed(1),
    `${e.judge.emoji} ${e.judge.label}`,
  ]);
  return renderMarkdownTable(headers, rows);
}

/**
 * 「--compare」比較表を生成する。
 * entries: [{ scenarioLabel, compareMs, currentMs, ratio: { emoji, label } }]
 */
export function buildComparisonTable(entries) {
  const headers = ['シナリオ', '比較対象 (ms)', '現在 (ms)', '倍率'];
  const rows = entries.map((e) => [
    e.scenarioLabel,
    e.compareMs.toFixed(2),
    e.currentMs.toFixed(2),
    `${e.ratio.emoji} ${e.ratio.label}`,
  ]);
  return renderMarkdownTable(headers, rows);
}

/**
 * 詳細表を生成する。
 * entries: [{ scenarioLabel, medianMs, p95Ms, updateMs, particleCount, frames }]
 */
export function buildDetailTable(entries) {
  const headers = [
    'シナリオ',
    '中央値 (ms)',
    'p95 (ms)',
    'Update (ms)',
    '終了時粒子数',
    '計測フレーム数',
  ];
  const rows = entries.map((e) => [
    e.scenarioLabel,
    e.medianMs.toFixed(2),
    e.p95Ms.toFixed(2),
    e.updateMs != null ? e.updateMs.toFixed(2) : 'N/A',
    e.particleCount != null ? String(e.particleCount) : 'N/A',
    String(e.frames),
  ]);
  return renderMarkdownTable(headers, rows);
}
