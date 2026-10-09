import { beforeEach, describe, expect, it, vi } from 'vitest';
import { launchBrowser } from '../../scripts/bench/measure.mjs';

const mocks = vi.hoisted(() => ({ launch: vi.fn(), version: vi.fn(), close: vi.fn() }));
vi.mock('puppeteer-core', () => ({ default: { launch: mocks.launch } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.launch.mockResolvedValue({ version: mocks.version, close: mocks.close });
  mocks.close.mockResolvedValue(undefined);
});

describe('計測用ブラウザの起動', () => {
  it('古い Chrome を閉じて計測を中止する', async () => {
    mocks.version.mockResolvedValue('Chrome/154.0.8037.99');
    await expect(launchBrowser()).rejects.toThrow('155.0.8059.39');
    expect(mocks.close).toHaveBeenCalledOnce();
  });
  it('版の取得に失敗した場合もブラウザを閉じる', async () => {
    mocks.version.mockRejectedValue(new Error('version failed'));
    await expect(launchBrowser()).rejects.toThrow('version failed');
    expect(mocks.close).toHaveBeenCalledOnce();
  });
  it('更新済み Chrome はヘッドフルで起動して返す', async () => {
    mocks.version.mockResolvedValue('Chrome/155.0.8059.39');
    const browser = await launchBrowser();
    expect(browser.version).toBe(mocks.version);
    expect(mocks.launch).toHaveBeenCalledWith(expect.objectContaining({ channel: 'chrome', headless: false }));
    expect(mocks.close).not.toHaveBeenCalled();
  });
});
