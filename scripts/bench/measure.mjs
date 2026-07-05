import puppeteer from 'puppeteer-core';

const VIEWPORT = { width: 1280, height: 800 };

/**
 * インストール済みの Chrome('chrome' channel)をヘッドフルで起動する。
 * ヘッドレスはあえて使わない: ヘッドレス Chrome や jsdom はラスタライズ
 * 経路が実ブラウザと異なり、過去の描画最適化の検証では、ヘッドレス相当の
 * マイクロベンチが実ページの rAF 計測と**逆の結論**(最適化のつもりが
 * 実際は退行)を出した事例がある。ベンチ計測は必ず実際に画面表示される
 * ブラウザウィンドウで行う。
 */
export async function launchBrowser() {
  return puppeteer
    .launch({
      channel: 'chrome',
      headless: false,
      defaultViewport: VIEWPORT,
      args: [
        `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
        '--window-position=0,0',
      ],
      // puppeteer は既定で SIGINT/SIGTERM/SIGHUP を自前でハンドリングしてブラウザを
      // 閉じようとする。bench.mjs 側にも Ctrl+C 用の後片付けハンドラ(vite サーバー・
      // worktree も含めて片付ける)があり、両方が同時にブラウザを閉じようとすると
      // 競合して browser.close() が正しく解決しなくなることがある。シグナル処理は
      // bench.mjs 側に一本化する。
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    })
    .catch((err) => {
      // Chrome が見つからない場合、puppeteer-core の生エラーは分かりにくいため
      // 前提条件を日本語で案内する
      throw new Error(
        [
          'Chrome の起動に失敗しました。以下を確認してください:',
          '  1. Google Chrome がインストールされていること',
          '     (このツールは Chromium を同梱せず、インストール済みの Chrome を使います)',
          '  2. GUI 環境で実行していること',
          '     (計測精度のためヘッドフル起動が必須。SSH 先やディスプレイのない環境では動きません)',
          `元のエラー: ${err.message}`,
        ].join('\n'),
      );
    });
}

/**
 * `url` を開き `warmupMs` だけ待機した後、requestAnimationFrame の間隔を
 * `frames` 回分(ms)収集し、最終フレームの StatsOverlay 表示テキストも
 * あわせて取得する。
 *
 * タイムアウトは無効化(0 = 無制限)している。重いシナリオ(h=3000 等)は
 * 1フレームが数秒かかることもあるため、完走できるようにするため。
 */
export async function measureScenario(browser, url, { warmupMs, frames }) {
  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  page.setDefaultNavigationTimeout(0);

  try {
    await page.goto(url, { waitUntil: 'load' });
    await new Promise((resolve) => setTimeout(resolve, warmupMs));

    const result = await page.evaluate((frameCount) => {
      return new Promise((resolve) => {
        const deltas = [];
        let last = null;

        function step(ts) {
          if (last !== null) {
            deltas.push(ts - last);
          }
          last = ts;
          if (deltas.length >= frameCount) {
            // StatsOverlay(src/debug/StatsOverlay.ts)は body 直下に div を
            // 追加するだけだが、開発サーバーの他のツール(例:
            // vite-plugin-checker の診断オーバーレイ)も同様に body 直下へ
            // div を挿入することがあるため、位置ではなく中身
            // (先頭が "FPS:" で始まる)で特定する。
            const overlay = Array.from(
              document.querySelectorAll('body > div'),
            ).find((el) => el.innerText.trimStart().startsWith('FPS:'));
            resolve({ deltas, overlayText: overlay ? overlay.innerText : '' });
          } else {
            requestAnimationFrame(step);
          }
        }
        requestAnimationFrame(step);
      });
    }, frames);

    return result;
  } finally {
    await page.close();
  }
}

/**
 * StatsOverlay(src/debug/StatsOverlay.ts)が描画したテキストを構造化データに
 * パースする: `Update: Nms` -> updateMs、`Total: N` -> total、それ以外の
 * "Kind: N" 行 -> counts[Kind]。
 */
export function parseOverlayText(text) {
  const stats = { updateMs: null, total: null, counts: {} };
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = Number.parseFloat(rawValue);
    if (Number.isNaN(value)) continue;

    if (key === 'Update') {
      stats.updateMs = value;
    } else if (key === 'Total') {
      stats.total = value;
    } else if (key === 'FPS' || key === 'Frame') {
      // FPS/フレーム間隔は自前の rAF サンプルから算出し直すため、
      // 二重管理を避ける目的でオーバーレイ側の値は使わない。
    } else {
      stats.counts[key] = value;
    }
  }

  return stats;
}
