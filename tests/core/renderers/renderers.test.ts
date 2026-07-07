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

type DrawMethod =
  | 'fillText'
  | 'fill'
  | 'arc'
  | 'createRadialGradient'
  | 'setTransform';

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

  it('指定した色とフォントで描画され、高価な shadow* プロパティを使わないこと', () => {
    const ctx = createCtx();
    const renderer = new TextRenderer('O', '#00ff00', 28.8);
    renderer.render(ctx, 100, 100);

    expect(ctx.fillStyle).toBe('#00ff00');
    expect(ctx.font).toBe('28.8px sans-serif');
    // 疑似シャドウ(1px ずらした2度描き)方式のため shadow* は既定値のまま
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowOffsetX).toBe(0);
    expect(ctx.shadowOffsetY).toBe(0);
  });

  it('疑似シャドウ(+1px の影色)→ 本体の順にテキストが描画されること', () => {
    const ctx = createCtx();
    const fillTextSpy = spyOnProto(ctx, 'fillText');
    const renderer = new TextRenderer('H', '#ff0000', 24);

    renderer.render(ctx, 100, 200);

    expect(fillTextSpy).toHaveBeenCalledTimes(2);
    expect(fillTextSpy).toHaveBeenNthCalledWith(1, 'H', 101, 201);
    expect(fillTextSpy).toHaveBeenNthCalledWith(2, 'H', 100, 200);
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

  it('本体・下付き文字とも疑似シャドウ→本体の順に、旧実装どおりのオフセットで描画されること', () => {
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

    expect(fillTextSpy).toHaveBeenCalledTimes(4);
    // 本体: x - bodyWidth / 6(疑似シャドウは +1px)
    expect(fillTextSpy).toHaveBeenNthCalledWith(
      1,
      'H',
      100 - bodyWidth / 6 + 1,
      201,
    );
    expect(fillTextSpy).toHaveBeenNthCalledWith(
      2,
      'H',
      100 - bodyWidth / 6,
      200,
    );
    // 下付き文字: x + 12, y + 3(疑似シャドウは +1px)
    expect(fillTextSpy).toHaveBeenNthCalledWith(3, '2', 113, 204);
    expect(fillTextSpy).toHaveBeenNthCalledWith(4, '2', 112, 203);
  });
});

describe('DropletRenderer のテスト', () => {
  it('描画処理がエラーなく実行されること', () => {
    const renderer = new DropletRenderer(20);
    expect(() => renderer.render(createCtx(), 100, 100)).not.toThrow();
  });

  it('疑似シャドウ(影色の単色円)→ 本体の 2 回 fill され、shadow* プロパティを使わないこと', () => {
    const ctx = createCtx();
    const proto = Object.getPrototypeOf(ctx) as CanvasRenderingContext2D;
    const originalFill = proto.fill;
    const capturedFillStyles: Array<string | CanvasGradient | CanvasPattern> =
      [];
    const fillSpy = vi
      .spyOn(proto, 'fill')
      .mockImplementation(function (
        this: CanvasRenderingContext2D,
        ...args: Parameters<CanvasRenderingContext2D['fill']>
      ) {
        capturedFillStyles.push(this.fillStyle);
        return originalFill.apply(this, args);
      });

    const renderer = new DropletRenderer(21);
    renderer.render(ctx, 100, 100);

    expect(capturedFillStyles).toHaveLength(2);
    // 1 回目: 疑似シャドウの単色、2 回目: 本体のグラデーション
    expect(capturedFillStyles[0]).toBe('#007fff');
    expect(typeof capturedFillStyles[1]).toBe('object');
    // 疑似シャドウ方式のため shadow* は既定値のまま
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowOffsetX).toBe(0);
    expect(ctx.shadowOffsetY).toBe(0);

    fillSpy.mockRestore();
  });

  it('グラデーションが原点基準で生成され、setTransform で粒子位置へ移動されること', () => {
    const ctx = createCtx();
    const gradientSpy = spyOnProto(ctx, 'createRadialGradient');
    const transformSpy = spyOnProto(ctx, 'setTransform');
    const size = 20;
    const renderer = new DropletRenderer(size);

    renderer.render(ctx, 100, 100);

    // 原点基準: 中心 (-offset, -offset)、半径 0 → size/2 + offset
    const offset = size * 0.4;
    expect(gradientSpy).toHaveBeenCalledWith(
      -offset,
      -offset,
      0,
      -offset,
      -offset,
      size / 2 + offset,
    );
    // 粒子位置へ平行移動し、描画後に単位行列へ戻す
    expect(transformSpy).toHaveBeenNthCalledWith(1, 1, 0, 0, 1, 100, 100);
    expect(transformSpy).toHaveBeenNthCalledWith(2, 1, 0, 0, 1, 0, 0);
  });

  it('グラデーションはインスタンスごとに 1 回だけ生成されキャッシュされること', () => {
    const ctx = createCtx();
    const gradientSpy = spyOnProto(ctx, 'createRadialGradient');
    const renderer = new DropletRenderer(24);

    renderer.render(ctx, 10, 10);
    renderer.render(ctx, 20, 20);
    renderer.render(ctx, 30, 30);

    expect(gradientSpy).toHaveBeenCalledTimes(1);
  });

  it('疑似シャドウは +1px、本体は移動後の原点を中心に半径 size/2 で描かれること', () => {
    const ctx = createCtx();
    const arcSpy = spyOnProto(ctx, 'arc');
    const renderer = new DropletRenderer(24);

    renderer.render(ctx, 50, 60);

    expect(arcSpy).toHaveBeenCalledTimes(2);
    // 疑似シャドウ: (x+1, y+1)
    expect(arcSpy).toHaveBeenNthCalledWith(1, 51, 61, 12, 0, Math.PI * 2, true);
    // 本体: setTransform(…, x, y) 後の原点
    expect(arcSpy).toHaveBeenNthCalledWith(2, 0, 0, 12, 0, Math.PI * 2, true);
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
