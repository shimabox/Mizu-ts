import { describe, expect, it } from 'vitest';

describe('Main.ts のテスト', () => {
  it('キャンバスが用意されていること', () => {
    const event = new Event('DOMContentLoaded'); // DOMContentLoadedイベントをトリガー
    document.dispatchEvent(event);

    const canvas = document.querySelector('canvas');
    expect(canvas).not.toBeNull();

    const ctx = canvas?.getContext('2d');
    expect(ctx).not.toBeNull();
  });
});
