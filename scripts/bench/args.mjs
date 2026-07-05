/** scripts/bench/bench.mjs 用の CLI 引数パーサ。入力配列に対して純粋。 */

const DEFAULT_SCENARIOS = ['default', '500', '1000'];
const DEFAULT_WARMUP_MS = 3000;

function splitFlag(arg) {
  const withoutDashes = arg.slice(2);
  const eqIndex = withoutDashes.indexOf('=');
  if (eqIndex === -1) return [withoutDashes, undefined];
  return [withoutDashes.slice(0, eqIndex), withoutDashes.slice(eqIndex + 1)];
}

function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function parseArgs(argv) {
  const options = {
    compare: null,
    scenarios: [...DEFAULT_SCENARIOS],
    framesOverride: null,
    warmup: DEFAULT_WARMUP_MS,
    out: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [flag, inlineValue] = splitFlag(arg);
    const takeValue = () =>
      inlineValue !== undefined ? inlineValue : argv[++i];

    switch (flag) {
      case 'compare':
        options.compare = takeValue();
        break;
      case 'scenarios':
        options.scenarios = takeValue()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case 'frames':
        options.framesOverride = Number.parseInt(takeValue(), 10);
        break;
      case 'warmup':
        options.warmup = Number.parseInt(takeValue(), 10);
        break;
      case 'out':
        options.out = takeValue();
        break;
      case 'help':
        options.help = true;
        break;
      default:
        console.warn(`[bench] Unknown option --${flag}`);
        break;
    }
  }

  if (!options.out) {
    options.out = `bench-reports/report-${timestamp()}.md`;
  }

  return options;
}

export const HELP_TEXT = `Usage: npm run bench -- [options]

Options:
  --compare <git-ref>        指定した git ref を worktree に展開し、現在の作業ツリーと A/B 比較する
  --scenarios <a,b,c>        計測するシナリオ(既定: default,500,1000。選択肢: default,500,1000,3000)
  --frames <N>               シナリオごとに収集する rAF フレーム数(既定: 300。3000 シナリオのみ既定 60)
  --warmup <ms>               計測前のウォームアップ時間 ms(既定: 3000)
  --out <path>                レポート出力先(既定: bench-reports/report-<YYYYMMDD-HHmmss>.md)
`;
