# ChunkFlow 发布指南

## 快速开始

### 正式版本发布

```bash
# 1. 确保已登录 npm
npm login

# 2. 运行发布脚本（会自动创建 GitHub Release）
pnpm release
```

### Alpha 版本发布

```bash
# 指定 alpha 版本号（会自动创建 GitHub Prerelease）
./scripts/release-alpha.sh 0.0.1-alpha.1
```

---

## 详细说明

### 前置要求

- ✅ 已登录 npm：`npm login`
- ✅ 有 GitHub 推送权限
- ✅ 安装 GitHub CLI：`brew install gh && gh auth login`（推荐，用于自动创建 Release）
- ✅ 确保 `packageManager` 字段在 package.json 中设置为 `pnpm@9.0.0`

### 正式发布流程

运行 `pnpm release` 会自动执行：

1. ✅ 构建所有包
2. ✅ 运行测试
3. ✅ 类型检查
4. ✅ 更新版本号（基于 changesets）
5. ✅ 发布到 npm（**pnpm 会自动将 `workspace:*` 转换为具体版本号**）
6. ✅ 提交版本变更
7. ✅ 创建 git tag
8. ✅ 推送到 GitHub
9. ✅ **自动创建 GitHub Release**（如果安装了 GitHub CLI）

> **重要**：`changeset publish` 会使用 pnpm 发布，自动将 `workspace:*` 依赖转换为具体版本号（如 `0.0.1-alpha.1`）。

### Alpha 发布流程

运行 `./scripts/release-alpha.sh 0.0.1-alpha.1` 会：

1. ✅ 更新所有包版本号为指定版本
2. ✅ 构建和测试
3. ✅ 发布到 npm 的 `alpha` tag
4. ✅ 提交、打 tag、推送到 GitHub
5. ✅ **自动创建 GitHub Prerelease**（如果安装了 GitHub CLI）

### 验证发布

```bash
# 查看 npm 包信息
npm view @chunkflowjs/core

# 查看 alpha 版本
npm view @chunkflowjs/core@alpha

# 查看所有 dist-tags
npm view @chunkflowjs/core dist-tags
```

---

## 手动发布（完全控制）

如果需要手动控制每一步：

#### 1. 构建和测试

```bash
pnpm build && pnpm test && pnpm typecheck
```

#### 2. 更新版本号

```bash
pnpm changeset version
```

#### 3. 重新构建

```bash
pnpm build
```

#### 4. 发布到 npm

```bash
pnpm changeset publish
```

#### 5. 提交和推送

```bash
git add .
git commit -m "chore: release packages"
VERSION=$(node -p "require('./packages/core/package.json').version")
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin main
git push origin "v$VERSION"
```

#### 6. 创建 GitHub Release

使用 GitHub CLI（推荐）：

```bash
# 正式版本
gh release create v$VERSION --title "ChunkFlow v$VERSION" --notes-file CHANGELOG.md

# Alpha 版本（标记为 prerelease）
gh release create v$VERSION --title "ChunkFlow v$VERSION" --prerelease --notes "Alpha release"
```

或手动在 GitHub 网页创建：
- 访问：https://github.com/Sunny-117/chunkflow/releases/new
- 选择 tag，填写标题和说明
- Alpha 版本记得勾选 "This is a pre-release"

---

## 常见问题

**Q: 发布的包中包含 `workspace:*` 依赖怎么办？**

这是一个已知问题。解决方案：

1. 发布新版本时，`changeset publish` 应该自动转换 `workspace:*` 为具体版本
2. 如果没有自动转换，可以手动发布：

```bash
# 在每个包目录中
cd packages/core
pnpm publish --no-git-checks

# 或者使用 npm
npm publish
```

3. 确保 `.npmrc` 中有正确配置：
```
save-workspace-protocol=rolling
```

**Q: Alpha 版本如何安装？**

```bash
npm install @chunkflowjs/core@alpha
```

**Q: 如何回滚发布？**

```bash
# npm 撤回（24小时内）
npm unpublish @chunkflowjs/core@0.0.1

# 删除 GitHub Release 和 tag
gh release delete v0.0.1 --yes
git tag -d v0.0.1
git push origin :refs/tags/v0.0.1
```

**Q: 发布失败怎么办？**

- 检查 npm 登录：`npm whoami`
- 检查包名是否可用
- 查看错误日志
- 确保 GitHub CLI 已认证：`gh auth status`

**Q: 没有安装 GitHub CLI 怎么办？**

发布脚本会检测 GitHub CLI 是否安装：
- 如果已安装：自动创建 Release
- 如果未安装：显示手动创建的步骤

安装 GitHub CLI：
```bash
# macOS
brew install gh

# 其他系统
# 参考：https://cli.github.com/manual/installation

# 认证
gh auth login
```

---

## 发布检查清单

发布前确认：

- [ ] 所有测试通过：`pnpm test`
- [ ] 类型检查通过：`pnpm typecheck`
- [ ] 构建成功：`pnpm build`
- [ ] 已登录 npm：`npm whoami`
- [ ] 在 main 分支
- [ ] 没有未提交的更改
- [ ] 已安装 GitHub CLI（推荐）

---

## 相关链接

- [Changesets 文档](https://github.com/changesets/changesets)
- [npm 发布指南](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [项目 Releases](https://github.com/Sunny-117/chunkflow/releases)
