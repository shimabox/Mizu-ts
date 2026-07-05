import { afterEach, describe, expect, it, vi } from 'vitest';
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

type DrawMethod = 'fillText' | 'fill' | 'arc' | 'createRadialGradient';

/**
 * node-canvas では fillText / fill / arc 等は prototype メソッドとして
 * 共有されるため、呼び出しの観測は prototype 側を spy する。
 */
const spyOnProto = (obj: CanvasRenderingContext2D, method: DrawMethod) =>
  vi.spyOn(Object.getPrototypeOf(obj) as CanvasRenderingContext2D, method);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TextRenderer のテスト', () => {
  it('描画処理がエラーなく実行されること', () => {
    const renderer = new TextRenderer('H', '#ff0000', 24);
    expect(() => renderer.render(createCtx(), 100, 100)).not.toThrow();
  });

  it('指定した色とフォントと影で描画されること', () => {
    const ctx = createCtx();
    const renderer = new TextRenderer('O', '#00ff00', 28.8);
    renderer.render(ctx, 100, 100);

    expect(ctx.fillStyle).toBe('#00ff00');
    expect(ctx.font).toBe('28.8px sans-serif');
    expect(ctx.shadowColor).toBe('#888888');
    expect(ctx.shadowOffsetX).toBe(1);
    expect(ctx.shadowOffsetY).toBe(1);
    expect(ctx.shadowBlur).toBe(1);
  });

  it('指定した座標にテキストが描画されること', () => {
    const ctx = createCtx();
    const fillTextSpy = spyOnProto(ctx, 'fillText');
    const renderer = new TextRenderer('H', '#ff0000', 24);

    renderer.render(ctx, 100, 200);

    expect(fillTextSpy).toHaveBeenCalledTimes(1);
    expect(fillTextSpy).toHaveBeenCalledWith('H', 100, 200);
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

  it('本体と下付き文字が旧実装どおりのオフセットで描画されること', () => {
    const ctx = createCtx();
    const fillTextSpy = spyOnProto(ctx, 'fillText');
    const bodyWidth = 30;
    const renderer = new SubscriptTextRenderer(
      'H',
      '2',
      '#0000ff',
      24,
      18,
      bodyWidth,
    );

    renderer.render(ctx, 100, 200);

    expect(fillTextSpy).toHaveBeenCalledTimes(2);
    // 本体: x - bodyWidth / 6
    expect(fillTextSpy).toHaveBeenNthCalledWith(
      1,
      'H',
      100 - bodyWidth / 6,
      200,
    );
    // 下付き文字: x + 12, y + 3
    expect(fillTextSpy).toHaveBeenNthCalledWith(2, '2', 112, 203);
  });
});

describe('DropletRenderer のテスト', () => {
  it('描画処理がエラーなく実行されること', () => {
    const renderer = new DropletRenderer(20);
    expect(() => renderer.render(createCtx(), 100, 100)).not.toThrow();
  });

  it('影の色・オフセット・実効 shadowBlur=1 が fill 時に設定されていること', () => {
    const ctx = createCtx();
    const proto = Object.getPrototypeOf(ctx) as CanvasRenderingContext2D;
    const originalFill = proto.fill;
    const captured: Array<{
      shadowColor: string;
      shadowBlur: number;
      shadowOffsetX: number;
      shadowOffsetY: number;
    }> = [];
    const fillSpy = vi
      .spyOn(proto, 'fill')
      .mockImplementation(function (
        this: CanvasRenderingContext2D,
        ...args: Parameters<CanvasRenderingContext2D['fill']>
      ) {
        captured.push({
          shadowColor: this.shadowColor as string,
          shadowBlur: this.shadowBlur,
          shadowOffsetX: this.shadowOffsetX,
          shadowOffsetY: this.shadowOffsetY,
        });
        return originalFill.apply(this, args);
      });

    const renderer = new DropletRenderer(21);
    renderer.render(ctx, 100, 100);

    expect(captured).toHaveLength(1);
    expect(captured[0].shadowColor).toBe('#007fff');
    expect(captured[0].shadowOffsetX).toBe(1);
    expect(captured[0].shadowOffsetY).toBe(1);
    // 旧実装では共有 bufferCtx にテキスト粒子の shadowBlur=1 が持ち越されて描画されて
    // いた(実効値 1)。暗黙の持ち越しに依存せず DropletRenderer が明示的に 1 を
    // 設定する(見た目の維持)
    expect(captured[0].shadowBlur).toBe(1);

    fillSpy.mockRestore();
  });

  it('グラデーションが粒子位置からの相対オフセットで生成されること', () => {
    const ctx = createCtx();
    const gradientSpy = spyOnProto(ctx, 'createRadialGradient');
    const size = 20;
    const renderer = new DropletRenderer(size);

    renderer.render(ctx, 100, 100);

    // gx = x - size*0.4, gy = y - size*0.4, 半径 0 → size/2 + size*0.4
    const offset = size * 0.4;
    expect(gradientSpy).toHaveBeenCalledWith(
      100 - offset,
      100 - offset,
      0,
      100 - offset,
      100 - offset,
      size / 2 + offset,
    );
  });

  it('円弧(arc)が粒子位置を中心に半径 size/2 で描かれること', () => {
    const ctx = createCtx();
    const arcSpy = spyOnProto(ctx, 'arc');
    const renderer = new DropletRenderer(24);

    renderer.render(ctx, 50, 60);

    expect(arcSpy).toHaveBeenCalledWith(50, 60, 12, 0, Math.PI * 2, true);
  });

  it('直描き方式のため render でオフスクリーン canvas を生成しないこと', () => {
    // スプライトキャッシュ方式は実ブラウザのラスタライズで退行したため
    // 不採用(DropletRenderer のクラスコメント参照)
    const ctx = createCtx();
    const createElementSpy = vi.spyOn(document, 'createElement');

    new DropletRenderer(25).render(ctx, 10, 10);
    new DropletRenderer(30).render(ctx, 20, 20);

    expect(createElementSpy).not.toHaveBeenCalledWith('canvas');
  });
});
