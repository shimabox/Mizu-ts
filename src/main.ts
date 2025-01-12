import { Coordinate } from './atoms/Coordinate';
import { H } from './atoms/H';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#myCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas not found.');
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context is not available.');
  }

  const hAtom = new H(canvas.width);
  hAtom.initializeDrawingProperties(
    new Coordinate(canvas.width * Math.random(), canvas.height * Math.random()),
  );
  hAtom.render(ctx);
});
