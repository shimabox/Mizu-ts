/**
 * ベンチツールのシナリオ定義。
 *
 * これまで性能検証で手動実施していた計測プロトコル(1280x800 の
 * ビューポートで ?m=1&h=&o= を開き、ウォームアップ後に rAF 差分を採取)を
 * 再現する: 「default」シナリオは main.ts 自身の既定値
 * (h=30, o=50。シミュレータ側でスケールされる)に依存し、負荷シナリオは
 * 明示的な ?h=&o= 値を渡す。
 */

export const SCENARIO_ORDER = ['default', '500', '1000', '3000'];

export const SCENARIO_DEFS = {
  default: { h: 30, o: 50, label: 'デフォルト (h=30, o=50)' },
  500: { h: 500, o: 500, label: 'h=500, o=500' },
  1000: { h: 1000, o: 1000, label: 'h=1000, o=1000' },
  3000: { h: 3000, o: 3000, label: 'h=3000, o=3000' },
};

/** 3000 シナリオのみ既定フレーム数を 60 にする(他は 300)。 */
export function defaultFramesFor(scenarioName) {
  return scenarioName === '3000' ? 60 : 300;
}

/** シナリオ名の配列 -> シナリオ定義オブジェクトの配列。未知の名前は例外。 */
export function resolveScenarios(names) {
  return names.map((name) => {
    const def = SCENARIO_DEFS[name];
    if (!def) {
      throw new Error(
        `Unknown scenario "${name}". Available: ${SCENARIO_ORDER.join(', ')}`,
      );
    }
    return { name, ...def };
  });
}

/** ベース URL + シナリオ定義 -> 計測対象 URL(?m=1&h=&o=)。 */
export function buildUrl(baseUrl, scenario) {
  return `${baseUrl}/?m=1&h=${scenario.h}&o=${scenario.o}`;
}
