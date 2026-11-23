import { configDefaults, defineConfig } from 'vitest/config'

// 저장소 안 .worktrees/ 에 다른 세션의 워크트리가 있으면 그 시험까지 두 번 돌므로 뺀다.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.worktrees/**']
  }
})
