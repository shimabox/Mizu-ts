import os from 'node:os';
import {
  buildComparisonTable,
  buildDetailTable,
  buildSummaryTable,
  judgeRatio,
} from './stats.mjs';

const READING_GUIDE = `## レポートの読み方

- **フレーム時間の一定値への張り付き**: ディスプレイのリフレッシュレート(60Hz なら 16.7ms、75Hz なら 13.3ms など)の上限で頭打ちになっている状態です。それ以上は速くなりません。
- **Frame と Update の乖離**: \`Frame\`(rAF 間隔)が \`Update\`(renderFrame の実行時間)より大きい場合、その差分は JS 以外(ラスタライズ・GC 等)のコストです。
- **粒子数列も見ること**: H2o の滞留数がフレーム時間を支配するため、詳細表の終了時粒子数は毎回確認してください。
- **絶対値の比較は不可**: 環境ノイズがあるため、別日に計測した絶対値同士を比較しないでください。比較する場合は必ず \`--compare\` で同一セッション・同一マシン状態で計測してください。`;

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatOs() {
  return `${os.type()} ${os.release()} (${os.arch()})`;
}

/**
 * Markdown レポート全文と、コンソール向けの短いサマリを組み立てる。
 *
 * `results.current` / `results.compare` はシナリオ結果オブジェクトの配列
 * (シナリオごとに同じ順序)。各要素の形は次のとおり:
 *   { name, label, meanMs, medianMs, p95Ms, fps, updateMs, particleCount,
 *     frames, judge }
 */
export function buildReport({
  generatedAt,
  current,
  compare,
  chromeVersion,
  viewport,
  protocol,
  results,
}) {
  const lines = [];

  lines.push('# Mizu-ts ベンチマークレポート');
  lines.push('');
  lines.push(`- 実行日時: ${formatDate(generatedAt)}`);
  lines.push(`- 現在: \`${current.git.branch}\` @ \`${current.git.commit}\``);
  if (compare) {
    lines.push(
      `- 比較対象: \`${compare.ref}\`(\`${compare.git.branch}\` @ \`${compare.git.commit}\`)`,
    );
  }
  lines.push(`- OS: ${formatOs()}`);
  lines.push(`- Chrome: ${chromeVersion}`);
  lines.push(`- ビューポート: ${viewport.width}x${viewport.height}`);
  lines.push(`- プロトコル: warmup ${protocol.warmupMs}ms`);
  lines.push('');

  lines.push('## 結果サマリ');
  lines.push('');
  const summaryEntries = results.current.map((r) => ({
    scenarioLabel: r.label,
    meanMs: r.meanMs,
    fps: r.fps,
    judge: r.judge,
  }));
  const summaryTable = buildSummaryTable(summaryEntries);
  lines.push(summaryTable);
  lines.push('');

  if (compare) {
    lines.push('## 比較(--compare)');
    lines.push('');
    const comparisonEntries = results.current.map((cur, i) => {
      const cmp = results.compare[i];
      // 双方がディスプレイ同期律速の場合、フレーム時間はリフレッシュレートの
      // 上限に張り付いているだけで倍率に意味がないため「比較不能」にする
      const bothVsyncBound = Boolean(
        cur.judge?.vsyncBound && cmp.judge?.vsyncBound,
      );
      return {
        scenarioLabel: cur.label,
        compareMs: cmp.meanMs,
        currentMs: cur.meanMs,
        ratio: judgeRatio(cmp.meanMs, cur.meanMs, { bothVsyncBound }),
      };
    });
    lines.push(buildComparisonTable(comparisonEntries));
    lines.push('');
  }

  lines.push('## 詳細');
  lines.push('');
  lines.push(
    buildDetailTable(
      results.current.map((r) => ({
        scenarioLabel: r.label,
        medianMs: r.medianMs,
        p95Ms: r.p95Ms,
        updateMs: r.updateMs,
        particleCount: r.particleCount,
        frames: r.frames,
      })),
    ),
  );
  lines.push('');

  if (compare) {
    lines.push('### 詳細(比較対象)');
    lines.push('');
    lines.push(
      buildDetailTable(
        results.compare.map((r) => ({
          scenarioLabel: r.label,
          medianMs: r.medianMs,
          p95Ms: r.p95Ms,
          updateMs: r.updateMs,
          particleCount: r.particleCount,
          frames: r.frames,
        })),
      ),
    );
    lines.push('');
  }

  lines.push(READING_GUIDE);
  lines.push('');

  const markdown = lines.join('\n');
  const consoleSummary = ['結果サマリ:', summaryTable].join('\n');

  return { markdown, consoleSummary };
}
