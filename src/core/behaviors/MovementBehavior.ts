export interface MovementBehavior {
  /** 現在位置を受け取り、次の位置を返す(内部に速度状態を持ってよい) */
  next(x: number, y: number): { x: number; y: number };
}
