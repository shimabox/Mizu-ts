# Mizu-ts
Mizu-ts is a joke script that simulates water(H2o) generation in TypeScript.

![Mizu-ts](https://github.com/shimabox/Mizu-ts/blob/main/images/demo.gif)

> [!NOTE]
> A TypeScript port of [Mizu](https://github.com/shimabox/Mizu), originally written in JavaScript.

## Dependency Graph

![Dependency Graph](https://github.com/shimabox/Mizu-ts/blob/main/dependency-graph.svg)

## Demo

https://shimabox.github.io/Mizu-ts/

## Debug

### Performance Monitoring

Use the `?m=1` parameter to enable an on-screen statistics overlay showing:

- **FPS**: 60-frame moving average of frame rate
- **Frame**: Interval between animation frames in milliseconds (1 decimal precision)
- **Update**: Execution time of `renderFrame()` (JS time) in milliseconds
- **Particle counts**: Number of each particle kind (H, H2, O, H2o), shown even when 0
- **Total**: Total number of particles on screen

Example: https://shimabox.github.io/Mizu-ts/?m=1&h=60&o=100

### Load Testing

Use `?h=` and `?o=` parameters to control initial particle counts and test performance:

- `?h=500&o=500` — Medium load (watch FPS with overlay)
- `?h=1000&o=1000` — High load (expect frame time > 60ms on typical hardware)
- `?h=3000&o=3000` — Heavy load (for extreme stress testing)

Note: Frame time measurement uses high-precision timestamps (1ms decimal), allowing observation of sub-millisecond variations in rendering performance.

### URL Parameters

|key|default|type|description|
|:---|:---|:---|:---|
|m|0|number|Show performance overlay if set to 1|
|h|30|number|Number of H atoms to generate (scaled by screen width)|
|o|50|number|Number of O atoms to generate (scaled by screen width)|

### Benchmark Tool

`npm run bench` automates the manual measurement protocol above: it starts Vite, opens a real (headful) Chrome window, measures rAF frame times per scenario, and writes a Markdown report to `bench-reports/`. Pass `--compare <git-ref>` to A/B compare the current working tree against another ref (checked out into a temporary `git worktree`).

Requires Google Chrome and a GUI environment — see [Google Chrome (For Benchmark Tool)](#google-chrome-for-benchmark-tool).

```sh
npm run bench
npm run bench -- --compare main
npm run bench -- --scenarios default,500 --frames 60 --warmup 1000
```

|option|default|description|
|:---|:---|:---|
|`--compare <git-ref>`|(none)|A/B compare against the given ref, measured in the same session|
|`--scenarios <a,b,c>`|`default,500,1000`|Scenarios to run (choices: `default`, `500`, `1000`, `3000`)|
|`--frames <N>`|`300` (`60` for the `3000` scenario)|Number of rAF frames to sample per scenario|
|`--warmup <ms>`|`3000`|Warmup time before sampling starts|
|`--out <path>`|`bench-reports/report-<YYYYMMDD-HHmmss>.md`|Report output path|

## TODO

<details><summary>Fixed.</summary>

- [x] Hを描画
  - [#2](https://github.com/shimabox/Mizu-ts/pull/2)
  - <details><summary>v0.2.0</summary>

    ![#2](https://github.com/shimabox/Mizu-ts/blob/main/images/v0.2.0.gif)

    </details>
- [x] Hをたくさん描画
  - [#3](https://github.com/shimabox/Mizu-ts/pull/3)
  - <details><summary>v0.3.0</summary>

    ![#3](https://github.com/shimabox/Mizu-ts/blob/main/images/v0.3.0.gif)

    </details>
- [x] Hを動かす
  - [#4](https://github.com/shimabox/Mizu-ts/pull/4)
  - <details><summary>v0.4.0</summary>

    ![#4](https://github.com/shimabox/Mizu-ts/blob/main/images/v0.4.0.gif)

    </details>
- [x] HがぶつかったらH2にする
  - [#5](https://github.com/shimabox/Mizu-ts/pull/5)
  - <details><summary>v0.5.0</summary>

    ![#5](https://github.com/shimabox/Mizu-ts/blob/main/images/v0.5.0.gif)

    </details>
  - Fixed bug.
    - [#7](https://github.com/shimabox/Mizu-ts/pull/7)
- [x] Oを描画
  - [#6](https://github.com/shimabox/Mizu-ts/pull/6)
  - <details><summary>v0.6.0</summary>

    ![#6](https://github.com/shimabox/Mizu-ts/blob/main/images/v0.6.0.gif)

    </details>
- [x] H2とOがぶつかったらH2oにする
- [#8](https://github.com/shimabox/Mizu-ts/pull/8)
  - <details><summary>v0.8.0</summary>

    ![#8](https://github.com/shimabox/Mizu-ts/blob/main/images/v0.7.0.gif)

    </details>
- [x] GitHub Pages へのデプロイ
  - https://github.com/shimabox/Mizu-ts/releases/tag/v0.7.1
- [x] 計測処理実装
  - https://github.com/shimabox/Mizu-ts/pull/9
- [x] 改善(interfaceを利用した実装にする, リファクタなど)
  - [#21](https://github.com/shimabox/Mizu-ts/pull/21) 計測オーバーレイの刷新
  - [#22](https://github.com/shimabox/Mizu-ts/pull/22) ベンチマークツールの追加
  - [#23](https://github.com/shimabox/Mizu-ts/pull/23) シミュレーション本体の再設計(設計の詳細は [.claude/docs/architecture.md](./.claude/docs/architecture.md))

</details>

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

[mise](https://mise.jdx.dev/) is a convenient tool for managing Node.js versions. The project's Node.js version is pinned in `mise.toml`:

```sh
# Install mise
curl https://mise.run | sh

# Install the pinned Node.js version (reads mise.toml)
mise install
```

### Graphviz (For Dependency Visualization)

For dependency visualization, `dependency-cruiser` is used. To generate visual graphs, you need to install Graphviz.  
Follow the steps below to install it.

**macOS**
```sh
brew install graphviz
```

**linux**

```sh
# Ubuntu/Debian
sudo apt install graphviz

# Fedora
sudo dnf install graphviz
```

[Official Graphviz download page](https://www.graphviz.org/download/#linux).

**Windows**

Download the installer from the [official Graphviz download page](https://www.graphviz.org/download/#windows), and follow the setup instructions.

### Google Chrome (For Benchmark Tool)

The benchmark tool (`npm run bench`) launches your locally installed **Google Chrome** via `puppeteer-core` (no Chromium is bundled), so Chrome must be installed.

It runs the browser **headful** on purpose — headless rendering paths differ and can invert benchmark conclusions — so a GUI environment is required (it does not work over SSH or on displayless CI machines).

## Installation

```sh
# Clone the repository
git clone https://github.com/shimabox/Mizu-ts.git

# Navigate to the project directory
cd Mizu-ts

# Install dependencies
npm install
```

## Usage

### Start Development Server
```sh
npm run dev
```

### Production Build
```sh
npm run build
```

### Preview Production Build
```sh
npm run preview
```

### Lint Code
```sh
npm run lint
```

### Format Code
```sh
npm run format
```

### Run Tests
```sh
npm run test
```

### Check Test Coverage
```sh
npm run coverage
```

### Analyze Dependencies
```sh
npm run depcruise
```

### Generate Dependency Graph

This command generates `dependency-graph.svg` in the project root.

```sh
npm run dependency-graph
```
