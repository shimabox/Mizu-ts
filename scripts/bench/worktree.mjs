import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * `ref` を新規の一時 `git worktree` にチェックアウトし、メインリポジトリの
 * node_modules をシンボリックリンクする(worktree 側の vite.config.js や
 * devDependencies の解決先が必要になるが、古い ref を動かすためだけに
 * 二重に `npm install` するのは避けたい)。
 */
export function createCompareWorktree(ref, repoRoot) {
  const uniqueSuffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const worktreePath = path.join(tmpdir(), `mizu-ts-bench-${uniqueSuffix}`);

  execFileSync('git', ['worktree', 'add', '--detach', worktreePath, ref], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  const nodeModulesTarget = path.join(repoRoot, 'node_modules');
  const nodeModulesLink = path.join(worktreePath, 'node_modules');
  if (existsSync(nodeModulesTarget)) {
    symlinkSync(nodeModulesTarget, nodeModulesLink, 'dir');
  }

  // node_modules をシンボリックリンクで共有しているため、Vite の依存最適化
  // キャッシュ(node_modules/.vite)は本体側と物理的に同じ場所になってしまう。
  // 本体の Vite サーバーと同時に動かすとキャッシュ破損の原因になるため、
  // worktree 専用の隔離されたキャッシュディレクトリを別途用意する。
  const cacheDir = path.join(
    tmpdir(),
    `mizu-ts-bench-vite-cache-${uniqueSuffix}`,
  );

  return { path: worktreePath, ref, cacheDir };
}

/**
 * createCompareWorktree で作成した worktree(と、その専用 Vite キャッシュ
 * ディレクトリ)を削除する。一部失敗しても続行する。
 */
export function removeCompareWorktree(worktreePath, repoRoot, cacheDir) {
  try {
    execFileSync('git', ['worktree', 'remove', worktreePath, '--force'], {
      cwd: repoRoot,
      stdio: 'pipe',
    });
  } catch (err) {
    console.warn(
      `[bench] git worktree remove に失敗したため手動クリーンアップにフォールバックします: ${err.message}`,
    );
    try {
      rmSync(worktreePath, { recursive: true, force: true });
    } catch {
      // ベストエフォート(失敗しても無視)
    }
    try {
      execFileSync('git', ['worktree', 'prune'], {
        cwd: repoRoot,
        stdio: 'pipe',
      });
    } catch {
      // ベストエフォート(失敗しても無視)
    }
  }

  if (cacheDir) {
    try {
      rmSync(cacheDir, { recursive: true, force: true });
    } catch {
      // ベストエフォート(失敗しても無視)
    }
  }
}
