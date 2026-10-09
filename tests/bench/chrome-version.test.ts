import { describe, expect, it } from 'vitest';
import { assertChromeVersion } from '../../scripts/bench/chrome-version.mjs';

describe('Chrome の最低バージョン', () => {
  it.each(['Chrome/154.0.8037.99', 'Chrome/155.0.8059.38', 'Chrome/155.0.8058.999'])('%s を拒否する', (version) => {
    expect(() => assertChromeVersion(version)).toThrow('155.0.8059.39');
  });
  it.each(['Chrome/155.0.8059.39', 'Chrome/155.0.8059.40', 'Chrome/156.0.0.0'])('%s を受け入れる', (version) => {
    expect(() => assertChromeVersion(version)).not.toThrow();
  });
  it.each(['', 'unknown', 'Chrome/155'])('不明な版 %s を拒否する', (version) => {
    expect(() => assertChromeVersion(version)).toThrow('検出');
  });
});
