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

https://shimabox.github.io/Mizu-ts/?m=1&h=60&o=100

|key|default|type|description|
|:---|:---|:---|:---|
|m|0|number|Show measurement if set to 1|
|h|30|number|Number of H to generate|
|o|50|number|Number of O to generate|

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

</details>

- [ ] 改善(interfaceを利用した実装にする, リファクタなど)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

[Volta](https://volta.sh/) is a convenient tool for managing Node.js and npm versions:

```sh
# Install Volta
curl https://get.volta.sh | bash

# Install Node.js and npm
volta install node@18
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
