import { execFileSync } from 'node:child_process';

/** 指定した cwd(リポジトリ or worktree)のブランチ名と短縮コミットハッシュを取得する。 */
export function getGitInfo(cwd) {
  const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd,
  })
    .toString()
    .trim();
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd })
    .toString()
    .trim();
  return { branch, commit };
}
