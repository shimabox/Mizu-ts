import { JSDOM } from 'jsdom';

// JSDOM環境(モック)を構築
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="myCanvas"></canvas></body></html>', { url: 'http://localhost' });
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
