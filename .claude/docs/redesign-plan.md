# Mizu-ts 再設計 実装プラン

.claude/docs/redesign.md を元にした実装プランです。**このドキュメントを元に実装モデルが実装を行い、プラン作成者(Claude)がレビューを行います。**

- 対象コミット: `dd38938` 時点の `main`
- 実装ルール: 本プランの各フェーズを順番に、フェーズごとに独立したブランチ/PRで実装すること
- 禁止事項: 世界観(見た目・挙動)を変える変更、新しいランタイム依存の追加

---

## 0. 現状分析

### 0.1 コード構成

```
src/
  main.ts                     … エントリポイント。URLパラメータ(m/h/o)処理とrAFループ
  simulator/MizuSimulator.ts  … 描画・衝突判定・反応(H+H→H2, O+H2→H2o)を全て内包
  atoms/H.ts, H2.ts, O.ts     … ほぼ同一コードの重複(座標・速度・描画・ランダムウォーク)
  atoms/H2o.ts                … 落下する水滴。画面下端で削除フラグ
  atoms/Coordinate.ts         … 座標値オブジェクト
  util/Measurement.ts         … ?m=1 で表示される計測オーバーレイ(シングルトン)
```

### 0.2 現状の問題点(redesign.md の分析 + コードリーディングによる補足)

| # | 問題 | 場所 |
|---|---|---|
| P1 | H/H2/O がコピペ実装。`updatePosition` / `isHit` / `getColor` / `getScale` が3重に重複 | `src/atoms/*.ts` |
| P2 | 反応ルール(H+H→H2、O+H2→H2o)が `MizuSimulator` にハードコード。新分子(O3, CO2等)追加時にシミュレータ本体の改修が必須 | `MizuSimulator.ts:114-174` |
| P3 | `render()` の中で `updatePosition()` を呼んでおり、更新と描画が密結合。テストで「1フレーム進める」には描画コンテキストが必要 | `H.ts:36` ほか |
| P4 | H-H 総当たり `O(n^2)`、O-H2 総当たり `O(p*m)`。加えて衝突時の `indexOf`/`splice` で最悪 `O(m^2)` | `MizuSimulator.ts:119,148,154,161` |
| P5 | 原子1体の生成ごとに `document.createElement('canvas')` + `measureText` を実行。衝突のたびに新規生成が走るため毎フレーム canvas 生成が起こりうる | `H.ts:61` ほか |
| P6 | 毎フレーム全原子に `shadowBlur` 付き `fillText`。Canvas の影描画は高コスト | `H.ts:41-48` ほか |
| P7 | `Math.random()` 直呼びのため挙動が非決定的で、テストが「動いたこと」しか検証できない | 全クラス |
| P8 | `H2.isHit()` が常に `false` を返すデッドコード | `H2.ts:57` |
| P9 | ループ中の配列 `splice` による添字ずれリスク(現状は動くが壊れやすい) | `MizuSimulator.ts:133,164,182` |

### 0.3 保存すべき「世界観」(挙動の不変条件)

リファクタリング前後で以下を変えないこと。**実装時はこの表を受け入れ条件として扱う。**

| 不変条件 | 現状の実装 |
|---|---|
| H は画面内をランダムウォーク(速度上限 1.05、加速度 0.075、画面端でラップアラウンド) | `H.updatePosition()` |
| H 同士が接触(距離 < 半径の和)すると: 片方はその座標で H2 になり、もう片方はランダムな新座標の H に再生成される(H は正味 -1) | `MizuSimulator.renderH()` |
| O と H2 が接触すると: O はランダムな新座標に再生成、H2 は削除、新しい H が1つ追加、O の座標に H2o が生成される | `MizuSimulator.renderO()` |
| H2o は揺れながら落下し、画面下端で消える | `H2o.updatePosition()` |
| 各原子の色は生成時にランダム、テキスト描画(H2 は下付き文字)、影付き | 各クラスの `render()` |
| 画面幅によるスケール(<768: 1.0, <1280: 1.2, それ以上: 1.5 ※原子側は 1.0/1.2 の2段階) | `getScale()` |
| 初期数は URL パラメータ `?h=&o=`(デフォルト H:30, O:50、スケール倍) | `main.ts` |
| `?m=1` で計測オーバーレイ表示 | `main.ts` + `Measurement` |

---

## 1. 目標アーキテクチャ

### 1.1 設計原則

- **インターフェースと会話する**: `MizuSimulator` は具象クラス(H, O, …)を知らない。`Particle` インターフェースと反応ルールの登録だけで動く。
- **汎化より委譲**: 基底クラス継承ではなく、移動(`MovementBehavior`)・描画(`ParticleRenderer`)を委譲で合成する。H/H2/O の重複は「共通部品を持つ」ことで解消し、「共通親を継承する」ことでは解消しない。
- **更新と描画の分離**: 1フレーム = `update → 衝突検出 → 反応適用 → 死亡回収 → render` のパイプラインにする。
- **決定可能性**: 乱数は `Random` インターフェースとして注入し、テストではシード付き実装に差し替える。

### 1.2 目標ディレクトリ構成

```
src/
  core/
    Particle.ts          # Particle インターフェースと ParticleKind
    Random.ts            # Random インターフェース + MathRandom / SeededRandom
    Coordinate.ts        # 既存を移動(または atoms/ に残置でも可)
    behaviors/
      MovementBehavior.ts    # インターフェース
      RandomWalk.ts          # H/H2/O 共通のランダムウォーク(委譲先)
      FallAndSway.ts         # H2o の落下(委譲先)
    renderers/
      ParticleRenderer.ts    # インターフェース
      TextRenderer.ts        # 文字描画(H, O)。スプライトキャッシュ内蔵
      SubscriptTextRenderer.ts # H2 用(下付き文字)
      DropletRenderer.ts     # H2o 用(グラデーション円)
  physics/
    SpatialGrid.ts       # 空間分割(一様グリッド)
    CollisionDetector.ts # グリッドを使った近傍ペア列挙
  reactions/
    ReactionRule.ts      # インターフェース
    ReactionRegistry.ts  # (kindA, kindB) → ルール の登録・検索
    rules/
      HHFusion.ts        # H + H → H2
      OxidationToWater.ts # O + H2 → H2o
  particles/
    H.ts, H2.ts, O.ts, H2o.ts  # behavior + renderer を合成した薄いクラス
    ParticleFactory.ts   # 生成(サイズ計測キャッシュもここに集約)
  simulator/
    World.ts             # 粒子の追加/削除/kind別カウントを管理
    MizuSimulator.ts     # フレームパイプラインの指揮のみ
  debug/
    StatsOverlay.ts      # FPS/粒子数オーバーレイ(Measurement を置換)
  main.ts
```

### 1.3 中核インターフェース(実装例)

```ts
// core/Particle.ts
export type ParticleKind = string; // 'H' | 'H2' | 'O' | 'H2o' | 将来 'O3' | 'CO2' ...

export interface Particle {
  readonly kind: ParticleKind;
  getX(): number;
  getY(): number;
  getRadius(): number;
  /** 位置・状態の更新。描画とは分離する */
  update(): void;
  /** 描画のみ。状態を変更してはならない */
  render(ctx: CanvasRenderingContext2D): void;
  /** World の回収対象か */
  isDead(): boolean;
  markDead(): void;
}
```

```ts
// core/behaviors/MovementBehavior.ts
export interface MovementBehavior {
  /** 現在位置を受け取り、次の位置を返す(内部に速度状態を持ってよい) */
  next(x: number, y: number): { x: number; y: number };
}

// core/behaviors/RandomWalk.ts — H/H2/O の updatePosition() をそのまま移植
export class RandomWalk implements MovementBehavior {
  private vx = 0;
  private vy = 0;
  constructor(
    private readonly sw: number,
    private readonly sh: number,
    private readonly bodySize: number, // ラップアラウンド判定に使う w/h 相当
    private readonly random: Random,
    private readonly speedFactor = 0.075,
    private readonly maxSpeed = 1.05,
  ) {}
  next(x: number, y: number): { x: number; y: number } { /* 既存ロジックを移植 */ }
}
```

```ts
// reactions/ReactionRule.ts
export interface ReactionResult {
  /** 消滅する粒子 */
  consumed: Particle[];
  /** 新規生成する粒子 */
  produced: Particle[];
}

export interface ReactionRule {
  /** このルールが反応させる kind のペア(順不同でマッチさせる) */
  readonly pair: [ParticleKind, ParticleKind];
  react(a: Particle, b: Particle): ReactionResult;
}
```

```ts
// reactions/rules/HHFusion.ts — 「H+H → H2 + 新しいH」を宣言的に表現
export class HHFusion implements ReactionRule {
  readonly pair: [ParticleKind, ParticleKind] = ['H', 'H'];
  constructor(private readonly factory: ParticleFactory) {}
  react(a: Particle, b: Particle): ReactionResult {
    return {
      consumed: [a, b],
      produced: [
        this.factory.createH2(b.getX(), b.getY()), // 片方の座標で H2 化
        this.factory.createHAtRandom(),            // もう片方は再生成(不変条件)
      ],
    };
  }
}
```

```ts
// simulator/World.ts
export class World {
  private particles: Particle[] = [];
  add(p: Particle): void;
  count(kind: ParticleKind): number;
  all(): readonly Particle[];
  /** isDead() な粒子を1パスで除去(splice 多発を排除) */
  sweep(): void; // this.particles = this.particles.filter(p => !p.isDead()) 相当
}
```

```ts
// simulator/MizuSimulator.ts — フレームパイプラインの指揮のみ
public renderFrame(): void {
  for (const p of this.world.all()) p.update();          // 1. 更新

  const pairs = this.collisionDetector.findHitPairs(this.world.all()); // 2. 衝突検出
  for (const [a, b] of pairs) {                          // 3. 反応適用
    if (a.isDead() || b.isDead()) continue;              //    同一フレーム多重反応の防止
    const rule = this.registry.find(a.kind, b.kind);
    if (!rule) continue;
    const result = rule.react(a, b);
    for (const c of result.consumed) c.markDead();
    for (const p of result.produced) this.world.add(p);
  }

  this.world.sweep();                                    // 4. 死亡回収(1パス)

  this.bufferCtx.fillStyle = '#fff';                     // 5. 描画
  this.bufferCtx.fillRect(0, 0, this.cw, this.ch);
  for (const p of this.world.all()) p.render(this.bufferCtx);
  this.ctx.drawImage(this.bufferCanvas, 0, 0);
}
```

新分子(例: O3, CO2)の追加は「particles/ にクラス追加 + rules/ にルール追加 + 登録」だけで完結し、`MizuSimulator` / `World` / `SpatialGrid` は無変更で済む。これが redesign.md §1「理想」の受け入れ条件。

### 1.4 挙動差分に関する注意(実装モデルへ)

- 現行実装は「H の描画 → H-H 判定 → H2 描画 → O 描画 → O-H2 判定」をインターリーブしており、パイプライン化(全更新→全判定→全描画)すると**同一フレーム内の反応タイミングが最大1フレームずれる**。これは視覚上区別できないため許容する(受け入れ条件に含めない)。
- 現行の H-H 反応は「atoms[i] を新 H に置換、target を削除」。上記 `HHFusion` の「両方 consumed + 新 H を produced」は個数収支が同一であることを確認済み(H 正味 -1、H2 +1)。
- `H2.isHit()`(常に false)は移行時に削除してよい(P8)。

---

## 2. 高速化プラン

### 2.1 衝突判定: 一様グリッド(Uniform Grid)

**クワッドツリーではなく一様グリッドを採用する。** 理由:

- 粒子の半径がほぼ均一(フォントサイズ由来で ~14-22px)で、分布も一様ランダム。クワッドツリーの適応的分割が活きる条件(サイズ・密度の偏り)がない
- 毎フレーム全粒子が動くため、ツリーの再構築コストよりバケツへの再挿入 O(N) のほうが安い
- 実装が単純でテストしやすい

```ts
// physics/SpatialGrid.ts
export class SpatialGrid {
  // cellSize は「最大の衝突距離(= 最大半径×2)」以上にする。
  // これにより隣接9セルの走査だけで全衝突候補を網羅できる。
  constructor(width: number, height: number, cellSize: number) {}
  clear(): void;
  insert(p: Particle): void;
  /** p と同セル+隣接8セルにいる粒子を返す */
  neighbors(p: Particle): Particle[];
}

// physics/CollisionDetector.ts
export class CollisionDetector {
  findHitPairs(particles: readonly Particle[]): Array<[Particle, Particle]> {
    this.grid.clear();
    for (const p of particles) this.grid.insert(p);
    const pairs: Array<[Particle, Particle]> = [];
    for (const p of particles) {
      for (const q of this.grid.neighbors(p)) {
        if (/* 重複ペア防止: p の id < q の id */ && isHit(p, q)) pairs.push([p, q]);
      }
    }
    return pairs;
  }
}
```

- 距離判定は `Math.sqrt` を避け **距離の2乗比較** にする: `dx*dx + dy*dy < (r1+r2)*(r1+r2)`
- グリッドのセル配列は毎フレーム new せず、使い回す(`clear()` は各バケツの `length = 0`)
- 期待計算量: 平均 `O(N)`(密度が極端でない限り)。redesign.md の目標 `O(N log N)` 以下を満たす

### 2.2 配列操作: mark-and-sweep

- `indexOf` / ループ中 `splice` を全廃(P4, P9)。反応で消える粒子は `markDead()` でマークし、フレーム末尾の `World.sweep()`(filter 1パス、`O(N)`)で回収する。

### 2.3 描画: スプライトキャッシュ

- **生成時の canvas 生成を排除(P5)**: `measureText` の結果は「文字列×フォントサイズ」ごとに static な Map にキャッシュする(`ParticleFactory` に集約)。
- **毎フレームの shadowBlur 付き fillText を排除(P6)**: 各粒子は生成時に一度だけ、自分の色・影込みのテキストを小さなオフスクリーン canvas に描き、以後は `drawImage` 1回にする。
  - 色は粒子ごとにランダムなので、キャッシュは粒子インスタンス単位で持つ(`TextRenderer` が内部に保持)。
  - 見た目はピクセル単位で現行と同一になるため世界観を損なわない。
  - H2o はグラデーションが座標依存(`createRadialGradient` が毎フレーム必要)なので対象外とし、現行描画を維持する。
- 画面クリア(`fillRect` 全面)とバッファ転送は `O(A)` だが Canvas ネイティブ処理であり、ボトルネックが JS ループである以上、今回は変更しない(ダブルバッファリングは維持)。

### 2.4 計測(redesign.md「計測可能」への対応)

既存の `?m=1` + `Measurement` を `debug/StatsOverlay.ts` に発展させる:

- 表示項目: **FPS(直近60フレーム移動平均)**、フレーム時間(ms)、kind 別粒子数、総粒子数
- 有効化: 既存どおり `?m=1`(互換維持)
- 粒子数コントロール: 既存の `?h=&o=` を維持しつつ、上限チェックを外して負荷テスト可能にする(例: `?h=2000&o=2000`)
- `rAF` タイムスタンプベースで FPS を計測する(`performance.now()` の差分)。既存 `Measurement` の `Math.floor` による丸めバグ(小数ミリ秒が切り捨てられ 0ms 表示になりがち)はここで解消する

### 2.5 パフォーマンス目標(受け入れ条件)

計測環境: 実装者のローカル Chrome、ウィンドウ 1280×800 程度、`?m=1` で確認。

| シナリオ | 現状(想定) | 目標 |
|---|---|---|
| デフォルト(`h=30, o=50` × scale) | 60fps | 60fps 維持(劣化なし) |
| `?h=1000&o=1000` | フレーム時間が顕著に増大 | **60fps(フレーム時間 < 16.6ms)** |
| `?h=3000&o=3000` | 実用外 | 30fps 以上を目安(参考値として記録) |

Phase 0 で現状値を計測して .claude/docs/redesign-plan.md 末尾(または PR 説明)に記録し、改善後と比較すること。

---

## 3. フェーズ分割と作業手順

**各フェーズは独立した PR とし、完了条件「`npm run lint` / `npm test` が green + 目視で世界観が不変」を満たしてから次に進むこと。**

### Phase 0: ベースライン確立(小)

1. 現状の `main` で `npm test`, `npm run lint` が通ることを確認
2. `?m=1&h=500&o=500` 等でフレーム時間を計測し、数値を記録(比較用ベースライン)
3. 変更なし。計測結果の記録のみ

### Phase 1: インターフェース抽出と委譲への分解(大・挙動変更なし)

**redesign.md §1 に対応。このフェーズでは性能改善をしない(総当たりのまま)。**

1. `core/Random.ts`(`Random` インターフェース、`MathRandom` 実装、テスト用 `SeededRandom` 実装)を追加
2. `core/Particle.ts` インターフェースを定義
3. `core/behaviors/RandomWalk.ts` を作成(H/H2/O の `updatePosition` を1箇所に統合)。`FallAndSway.ts` に H2o の落下を移植
4. `core/renderers/` に `TextRenderer` / `SubscriptTextRenderer` / `DropletRenderer` を作成(既存 `render` の描画部分を移植。この段階ではスプライトキャッシュはまだ入れない)
5. `particles/H.ts` 等を behavior + renderer の合成に書き換え。`update()` と `render()` を分離
6. `particles/ParticleFactory.ts` を作成(乱数・画面サイズ・スケールを注入して生成を一元化)
7. `reactions/`(`ReactionRule`, `ReactionRegistry`, `HHFusion`, `OxidationToWater`)を作成
8. `simulator/World.ts` を作成し、`MizuSimulator` を §1.3 のパイプラインに書き換え(衝突検出はこの時点では総当たりの `BruteForceCollisionDetector` として切り出す)
9. `main.ts` の組み立てコードを更新(DI: Factory・Registry・Detector を組んで Simulator に渡す)
10. 既存テストを新構成に追随させ、§0.3 の不変条件をテストとして明文化する(§4 参照)
11. 旧 `atoms/` を削除(`Coordinate` は移動)

**注意**: `MizuSimulator` の公開 API(`init`, `renderFrame`, `getScale`, `get*Length`)は `main.ts` と既存テストが使うため、互換を維持するか、テストと同時に更新する。

### Phase 2: 空間分割による高速化(中)

1. `physics/SpatialGrid.ts` を実装(+単体テスト)
2. `physics/CollisionDetector.ts` を Grid ベースに実装。Phase 1 の `BruteForceCollisionDetector` は**テスト用の参照実装として残す**
3. 距離2乗比較への変更、ペア重複排除
4. プロパティテスト(§4.3)で Brute Force と結果一致を検証
5. ベンチマーク再計測し、Phase 0 のベースラインと比較して PR に記録

### Phase 3: 描画・生成の最適化(中)

1. `measureText` キャッシュ(static Map)を `ParticleFactory` に実装
2. `TextRenderer` / `SubscriptTextRenderer` にインスタンス単位のスプライトキャッシュを実装
3. `World.sweep()` の確認(Phase 1 で導入済み。ここで splice が残っていないか点検)
4. 目視で見た目が変わらないことを確認(スクリーンショット比較を推奨)
5. ベンチマーク再計測・記録

### Phase 4: 計測オーバーレイ強化(小)

1. `debug/StatsOverlay.ts` を実装(FPS 移動平均、kind 別カウント、総数)
2. `main.ts` を StatsOverlay に切り替え、`util/Measurement.ts` を削除
3. `?h=&o=` の負荷テスト動作確認(README にデバッグ方法を追記)

### Phase 5(任意・拡張性の実証): 新分子の追加デモ

redesign.md「好きな分子の追加」の実証として、例えば O3(O + O2 → O3 など簡略ルール)を **`particles/` と `reactions/rules/` への追加のみ** で実装できることを確認する。デフォルトでは無効(URL パラメータ `?o3=1` 等でオプトイン)とし、世界観を守る。実装するかは任意だが、設計がこれを満たすことは Phase 1 のレビュー観点とする。

---

## 4. テスト戦略

現状のテスト資産(vitest + jsdom + canvas パッケージ、`tests/` 配下)を維持・発展させる。

### 4.1 方針

- **乱数注入で決定的にする**: `SeededRandom`(単純な LCG や mulberry32 で可)を使い、「位置が変わったこと」ではなく「期待した位置になったこと」まで検証可能にする
- **private プロパティ覗き見(`simulator['h']`)からの脱却**: `World.count(kind)` / `World.all()` を公開 API として検証する
- **カバレッジ**: 既存の `npm run coverage` を維持。新規モジュール(core/physics/reactions)は line 90% 以上を目安

### 4.2 ユニットテスト(新規)

| 対象 | 検証内容 |
|---|---|
| `RandomWalk` | シード固定で軌道が決定的/速度上限 1.05 を超えない/画面端ラップアラウンドの境界値(ちょうど端、端±1) |
| `FallAndSway` | 落下すること/`sh` 到達で dead になること |
| `SpatialGrid` | セル割り当ての境界値(セル境界ちょうど、画面端、負座標)/`neighbors` が隣接9セルを返す/`clear` 後は空 |
| `CollisionDetector` | 接触ペアを漏れなく検出/自分自身・重複ペア(a,b)(b,a)を返さない/セル境界をまたぐ2粒子の衝突を検出 |
| `ReactionRegistry` | (A,B) と (B,A) の両順でルールが引ける/未登録ペアは undefined |
| `HHFusion` | consumed 2・produced に H2(衝突座標)+ H(新規)/個数収支 H:-1, H2:+1 |
| `OxidationToWater` | 個数収支 O:±0, H2:-1, H:+1, H2o:+1/H2o が O の座標に生成される |
| `World` | add/count/sweep。sweep 後に dead 粒子が残らない・生存粒子の順序が保たれる |
| `ParticleFactory` | measureText キャッシュがヒットすること(2体目以降で canvas 生成が呼ばれない — spy で検証) |
| `StatsOverlay` | FPS 計算(タイムスタンプ列を与えて期待値)/表示文字列 |

### 4.3 プロパティ(比較)テスト — Phase 2 の要

```ts
it('SpatialGrid は総当たりと同じ衝突ペアを検出する', () => {
  const random = new SeededRandom(42);
  const particles = createRandomParticles(500, random);
  const expected = normalize(new BruteForceCollisionDetector().findHitPairs(particles));
  const actual = normalize(new GridCollisionDetector(grid).findHitPairs(particles));
  expect(actual).toEqual(expected);
});
```

- シードを変えて複数ケース(最低5シード)実行
- `normalize` はペアを id 順にソートして比較可能にするヘルパ

### 4.4 統合テスト(既存テストの引き継ぎ)

`tests/simulator/MizuSimulator.test.ts` の既存シナリオを新 API で書き直す:

- init で指定数の H/O が生成される
- H 同士を至近距離に配置 → 1フレーム後に H:-1, H2:+1
- O と H2 を至近距離に配置 → 1フレーム後に H2o:+1, H2:-1, H:+1, O:±0
- H2o が画面下端に達したフレームの後、World から消えている
- 多数フレーム実行してもエラーが出ない(スモーク)

### 4.5 性能の回帰チェック(軽量)

CI で厳密なベンチは行わない(環境ノイズが大きいため)。代わりに:

- 「粒子1000体で `renderFrame` 100回が jsdom 上で N 秒以内」程度の粗い上限テストを1本だけ置く(閾値は余裕を持たせ、桁劣化の検知だけを目的とする)
- 本計測は §2.5 の手動プロトコルで行い、PR 説明に記録する

---

## 5. レビュー観点(レビュアー = プラン作成者用チェックリスト)

各 PR で以下を確認する:

**全フェーズ共通**
- [ ] `npm run lint` / `npm test` / `npm run build` が green
- [ ] §0.3 の不変条件(個数収支・見た目・URL パラメータ互換)が保たれている
- [ ] 新しいランタイム依存が増えていない(devDependencies の追加は要相談)
- [ ] `npm run dependency-graph` を再生成し、循環依存がないこと(simulator → core/physics/reactions → core の一方向)

**Phase 1**
- [ ] `MizuSimulator` が具象粒子クラス(H, O, …)を import していない(ParticleFactory/Registry 経由のみ)
- [ ] 「新分子追加時に particles/ と rules/ 以外を触らなくてよい」構造になっている(Phase 5 の思考実験で確認)
- [ ] `update()` と `render()` が分離され、`render()` が状態を変更していない
- [ ] 継承による共通化(abstract Atom 等)に流れていないか — 委譲になっているか

**Phase 2**
- [ ] プロパティテストで BruteForce と一致
- [ ] `cellSize >= 最大衝突距離` の根拠がコード上明確(定数の出所)
- [ ] グリッドが毎フレーム再アロケートされていない
- [ ] ベンチ結果が記録され、`h=1000&o=1000` で 60fps 目標を達成

**Phase 3**
- [ ] 見た目がピクセルレベルで維持されている(スクリーンショット添付)
- [ ] 粒子生成パスに `document.createElement('canvas')` が毎回入っていない
- [ ] スプライトキャッシュのメモリが粒子削除とともに解放される(参照が World から切れる)

**Phase 4**
- [ ] `?m=1` の互換動作/FPS 表示の妥当性

---

## 6. リスクと対応

| リスク | 対応 |
|---|---|
| Phase 1 が大きく、途中で挙動が変わる | §0.3 不変条件のテストを**先に**書いてからリファクタする(characterization test) |
| パイプライン化による反応タイミングの1フレームずれ | §1.4 に明記のとおり許容。レビューでは個数収支のみ確認 |
| スプライト化で影・アンチエイリアスの見え方が微妙に変わる | スプライト canvas に余白(shadow のオフセット+ blur ぶん)を確保して描画。スクリーンショット比較で確認 |
| jsdom + canvas パッケージでの `drawImage`(canvas→canvas)挙動差 | レンダラーのテストは「例外なく描画できる」レベルに留め、ロジック(キャッシュヒット等)は spy で検証 |
| グリッドのセルサイズ設定ミスによる検出漏れ | プロパティテスト(§4.3)が防波堤。境界またぎのユニットテストも必須 |

---

## 付録: Phase 0 計測結果(実装モデルが記入)

| シナリオ | フレーム時間 (ms) | 備考 |
|---|---|---|
| デフォルト | 16.67 | 約 60fps(vsync 律速)。中央値 16.7 / p95 17.5。300 フレーム計測 |
| h=500, o=500 | 113.22 | 約 8.8fps。中央値 100.0 / p95 183.4。300 フレーム計測 |
| h=1000, o=1000 | 657.74 | 約 1.5fps。中央値 617.6 / p95 1000.8。150 フレーム計測 |
| h=3000, o=3000 | 1081.6 | 約 0.9fps。中央値 1083.2 / 最大 1466.6。ページがほぼ応答不能(CDP の evaluate / screenshot がタイムアウト)のため fetch ビーコン方式で 10 フレームのみ計測。反応の進行で粒子数が急減した後の値の可能性あり |

計測メモ(Phase 0, 2026-07-04):

- 計測環境: ローカル Chrome(chrome-devtools MCP 経由)、ビューポート 1280×800、macOS。`npm run dev`(Vite)で配信
- 計測方法: `requestAnimationFrame` のタイムスタンプ差分(ページ読み込み後 2〜3 秒ウォームアップしてから採取)。画面上の Measurement オーバーレイは `Math.floor` 丸めのため使用していない
- URL パラメータの `h` / `o` は画面幅スケールで乗算されて生成される(ビューポート幅 1280px ではシミュレータ側スケール 1.5 倍。例: h=1000 → H 1500 体)
- デフォルトシナリオのみ 60fps を維持(平均 16.67ms はディスプレイのリフレッシュレートに律速された値)。h=500 以上では JS 処理(O(n^2) 衝突判定・shadowBlur 付き fillText 等)が支配的
