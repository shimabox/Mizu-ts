import { createServer } from 'vite';

/**
 * `root` を起点に Vite の開発サーバーを(JS API で)起動する。ポートは
 * OS 割り当て(port: 0)にすることで、複数サーバー(現在の作業ツリー +
 * --compare の worktree)を衝突なく同時起動できるようにする。
 *
 * `cacheDir` を指定した場合、その場所を Vite の依存最適化キャッシュ
 * (既定では `node_modules/.vite`)として使う。--compare の worktree は
 * メインリポジトリの node_modules をシンボリックリンクして共有するため、
 * キャッシュディレクトリも既定のままだと物理的に同じ場所を指してしまう。
 * 2つの Vite サーバー間でキャッシュの取り合いにならないよう、worktree 側
 * には隔離された一時ディレクトリを渡す。
 *
 * `resolve.preserveSymlinks: true` も必須: これがないと、シンボリック
 * リンクされた node_modules 経由で解決されるファイルの実パスと
 * Vite の内部モジュールグラフ上のパスが食い違い、TypeScript の変換
 * (型注釈の除去)が行われないまま生の .ts ソースがそのまま配信されてしまう
 * (ブラウザ側で `Unexpected token ':'` の SyntaxError になる)。
 */
export async function startViteServer(root, { cacheDir } = {}) {
  const server = await createServer({
    root,
    cacheDir,
    resolve: { preserveSymlinks: true },
    server: { port: 0, strictPort: false, host: '127.0.0.1' },
    logLevel: 'error',
  });
  await server.listen();

  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : null;
  if (!port) {
    throw new Error(
      `Failed to determine the Vite server port for root: ${root}`,
    );
  }

  return { server, url: `http://127.0.0.1:${port}`, root };
}

export async function stopViteServer(server) {
  if (server) {
    await server.close();
  }
}
