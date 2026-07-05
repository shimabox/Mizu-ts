#!/usr/bin/env node
/**
 * Mizu-ts ベンチマーク CLI。
 *
 * これまで再設計・性能改善のたびに手動で行っていた計測プロトコルを自動化する:
 *   vite 起動 -> Chrome でシナリオ別に rAF 計測 -> Markdown レポート出力
 * `--compare <git-ref>` を指定すると、その ref を一時的な git worktree に
 * 展開し、現在の作業ツリーと同一セッション・同一マシン状態で交互に計測して
 * A/B 比較する。
 *
 * 使い方: npm run bench -- [options]
 *   詳細は args.mjs の HELP_TEXT を参照。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELP_TEXT, parseArgs } from './args.mjs';
import { getGitInfo } from './gitInfo.mjs';
import {
  launchBrowser,
  measureScenario,
  parseOverlayText,
} from './measure.mjs';
import { buildReport } from './report.mjs';
import { buildUrl, defaultFramesFor, resolveScenarios } from './scenarios.mjs';
import { estimateFps, judgePerformance, mean, median, p95 } from './stats.mjs';
import { startViteServer, stopViteServer } from './viteServer.mjs';
import { createCompareWorktree, removeCompareWorktree } from './worktree.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

/** rAF の間隔サンプル + StatsOverlay の生テキストを、レポート用の結果オブジェクトに変換する。 */
function toScenarioResult(scenario, raw) {
  const overlay = parseOverlayText(raw.overlayText);
  const meanMs = mean(raw.deltas);
  const medianMs = median(raw.deltas);
  const p95Ms = p95(raw.deltas);
  return {
    name: scenario.name,
    label: scenario.label,
    meanMs,
    medianMs,
    p95Ms,
    fps: estimateFps(meanMs),
    updateMs: overlay.updateMs,
    particleCount: overlay.total,
    counts: overlay.counts,
    frames: raw.deltas.length,
    // (p95 - 中央値) のジッタも渡し、リフレッシュレート律速の可能性を判定する
    judge: judgePerformance(meanMs, medianMs, p95Ms),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const scenarios = resolveScenarios(options.scenarios);

  // 後片付けタスク(登録順と逆順に実行する)。Ctrl+C(SIGINT)でも
  // worktree やブラウザ・サーバーが残らないよう、必ずここを通す。
  //
  // 注意: SIGINT 経由の cleanup と、main() 自身の finally 経由の cleanup は
  // 両方とも呼ばれうる(SIGINT 中に browser.close() すると、実行中の
  // page.evaluate() が reject し、main() 側の finally も走るため)。
  // 同じ配列に対して独立した while ループを2つ走らせると早取り競争になり、
  // 一方が「配列が空になった」と早合点して process.exit() してしまい、
  // もう一方がまだ実行中のタスク(worktree 削除など)を待たずに終了する
  // 危険がある。そのため cleanup の実行は1つの Promise に集約し、
  // 呼び出し側が何度呼んでも同じ実行を待つだけにする。
  const cleanupTasks = [];
  let cleanupPromise = null;
  const runCleanup = () => {
    if (!cleanupPromise) {
      cleanupPromise = (async () => {
        while (cleanupTasks.length > 0) {
          const task = cleanupTasks.pop();
          try {
            await task();
          } catch (err) {
            console.error('[bench] クリーンアップに失敗しました:', err);
          }
        }
      })();
    }
    return cleanupPromise;
  };

  let sigintReceived = false;
  const onSigint = async () => {
    if (sigintReceived) return;
    sigintReceived = true;
    console.log('\n[bench] 中断されました。クリーンアップ中...');
    await runCleanup();
    process.exit(130);
  };
  process.on('SIGINT', onSigint);

  try {
    console.log('[bench] 現在の作業ツリー用に Vite サーバーを起動します...');
    const currentServer = await startViteServer(repoRoot);
    cleanupTasks.push(() => stopViteServer(currentServer.server));
    const currentGit = getGitInfo(repoRoot);
    console.log(
      `[bench] 現在: ${currentGit.branch} @ ${currentGit.commit} (${currentServer.url})`,
    );

    let compareTarget = null;
    if (options.compare) {
      console.log(
        `[bench] 比較対象 "${options.compare}" 用の worktree を準備します...`,
      );
      const worktree = createCompareWorktree(options.compare, repoRoot);
      cleanupTasks.push(() =>
        removeCompareWorktree(worktree.path, repoRoot, worktree.cacheDir),
      );

      const compareServer = await startViteServer(worktree.path, {
        cacheDir: worktree.cacheDir,
      });
      cleanupTasks.push(() => stopViteServer(compareServer.server));

      const compareGit = getGitInfo(worktree.path);
      console.log(
        `[bench] 比較対象: ${compareGit.branch} @ ${compareGit.commit} (${compareServer.url})`,
      );
      compareTarget = {
        server: compareServer,
        git: compareGit,
        ref: options.compare,
      };
    }

    console.log('[bench] Chrome を起動します(ウィンドウが開くのは正常です)...');
    const browser = await launchBrowser();
    cleanupTasks.push(() => browser.close());
    const chromeVersion = await browser.version();

    const results = { current: [], compare: [] };

    for (const scenario of scenarios) {
      const frames = options.framesOverride ?? defaultFramesFor(scenario.name);
      console.log(
        `[bench] シナリオ "${scenario.name}"(frames=${frames}, warmup=${options.warmup}ms)`,
      );

      console.log('  現在の作業ツリーを計測中...');
      const currentUrl = buildUrl(currentServer.url, scenario);
      const currentRaw = await measureScenario(browser, currentUrl, {
        warmupMs: options.warmup,
        frames,
      });
      results.current.push(toScenarioResult(scenario, currentRaw));

      if (compareTarget) {
        console.log(`  比較対象(${options.compare})を計測中...`);
        const compareUrl = buildUrl(compareTarget.server.url, scenario);
        const compareRaw = await measureScenario(browser, compareUrl, {
          warmupMs: options.warmup,
          frames,
        });
        results.compare.push(toScenarioResult(scenario, compareRaw));
      }
    }

    const report = buildReport({
      generatedAt: new Date(),
      current: { git: currentGit },
      compare: compareTarget
        ? { git: compareTarget.git, ref: options.compare }
        : null,
      chromeVersion,
      viewport: { width: 1280, height: 800 },
      protocol: { warmupMs: options.warmup },
      results,
    });

    const outPath = path.isAbsolute(options.out)
      ? options.out
      : path.join(repoRoot, options.out);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${report.markdown}\n`, 'utf8');

    console.log(`\n${report.consoleSummary}`);
    console.log(`\n[bench] レポートを書き出しました: ${outPath}`);
  } finally {
    process.off('SIGINT', onSigint);
    await runCleanup();
  }
}

main().catch((err) => {
  console.error('[bench] 失敗しました:', err);
  process.exitCode = 1;
});
