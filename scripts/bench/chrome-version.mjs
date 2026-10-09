export const MIN_CHROME_VERSION = '155.0.8059.39';

export function assertChromeVersion(version) {
  const match = version.match(/\b(\d+\.\d+\.\d+\.\d+)\b/);
  if (match) {
    const actual = match[1].split('.').map(Number);
    const minimum = MIN_CHROME_VERSION.split('.').map(Number);
    for (let i = 0; i < minimum.length; i++) {
      if (actual[i] > minimum[i]) return;
      if (actual[i] < minimum[i]) break;
      if (i === minimum.length - 1) return;
    }
  }
  throw new Error(
    `Chrome ${MIN_CHROME_VERSION} 以降が必要です (検出: ${version})。Chrome を更新してください。`,
  );
}
