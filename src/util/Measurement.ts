export class Measurement {
  private static instance: Measurement | null = null;

  private measurement: HTMLDivElement;
  private values: string[] = [];
  private frameCnt = 1;
  private elapsedTime = 0;
  private timeStr = '';

  private constructor() {
    this.measurement = document.createElement('div');
    this.measurement.style.position = 'absolute';
    this.measurement.style.top = '0px';
    this.measurement.style.color = 'aqua';
    this.measurement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.measurement.style.padding = '3px 5px';

    document.body.appendChild(this.measurement);
  }

  public static factory(): Measurement {
    if (!Measurement.instance) {
      Measurement.instance = new Measurement();
    }
    return Measurement.instance;
  }

  public measure(func: () => void, label = ''): this {
    const start = performance.now();
    func();
    const end = performance.now();

    this.elapsedTime += Math.floor(end) - Math.floor(start);
    if (this.frameCnt === 1 || this.frameCnt % 60 === 0) {
      this.timeStr = (this.elapsedTime / this.frameCnt).toPrecision(4);
      this.add(`${this.timeStr}ms`);
    } else {
      this.add(`${label}${this.timeStr}ms`);
    }
    this.frameCnt++;
    return this;
  }

  public add(val: string): this {
    this.values.push(val);
    return this;
  }

  public render(): void {
    this.measurement.innerText = this.values.join('\n');
    this.values.length = 0;
  }
}
