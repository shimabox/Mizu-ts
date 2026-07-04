import { describe, expect, it } from 'vitest';
import { DropletRenderer } from '../../../src/core/renderers/DropletRenderer';
import { SubscriptTextRenderer } from '../../../src/core/renderers/SubscriptTextRenderer';
import { TextRenderer } from '../../../src/core/renderers/TextRenderer';

const createCtx = (): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  return ctx;
};

describe('TextRenderer のテスト', () => {
  it('描画処理がエラーなく実行されること', () => {
    const renderer = new TextRenderer('H', '#ff0000', 24);
    expect(() => renderer.render(createCtx(), 100, 100)).not.toThrow();
  });

  it('指定した色とフォントで描画されること', () => {
    const ctx = createCtx();
    const renderer = new TextRenderer('O', '#00ff00', 28.8);
    renderer.render(ctx, 100, 100);

    expect(ctx.fillStyle).toBe('#00ff00');
    expect(ctx.font).toBe('28.8px sans-serif');
    expect(ctx.shadowColor).toBe('#888888');
  });
});

describe('SubscriptTextRenderer のテスト', () => {
  it('描画処理がエラーなく実行されること', () => {
    const renderer = new SubscriptTextRenderer('H', '2', '#ff0000', 24, 18, 30);
    expect(() => renderer.render(createCtx(), 100, 100)).not.toThrow();
  });

  it('最後に下付き文字のフォントサイズが設定されていること', () => {
    const ctx = createCtx();
    const renderer = new SubscriptTextRenderer('H', '2', '#0000ff', 24, 18, 30);
    renderer.render(ctx, 100, 100);

    expect(ctx.fillStyle).toBe('#0000ff');
    expect(ctx.font).toBe('18px sans-serif');
  });
});

describe('DropletRenderer のテスト', () => {
  it('描画処理がエラーなく実行されること', () => {
    const renderer = new DropletRenderer(20);
    expect(() => renderer.render(createCtx(), 100, 100)).not.toThrow();
  });

  it('水滴の影の色が設定されること', () => {
    const ctx = createCtx();
    const renderer = new DropletRenderer(20);
    renderer.render(ctx, 100, 100);

    expect(ctx.shadowColor).toBe('#007fff');
  });
});
