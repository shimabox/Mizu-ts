export class Coordinate {
  constructor(
    private x: number,
    private y: number,
  ) {}

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }
}
