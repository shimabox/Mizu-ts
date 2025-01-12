import { describe, it, expect } from 'vitest';
import { render } from './main';

describe('render', () => {
  it('document bodyに文字列が描画できる', () => {
    document.body.innerHTML = '';

    const html = '<h1>Hello Test!</h1>';
    render(html);

    expect(document.body.innerHTML).toBe(html);
  });
});
