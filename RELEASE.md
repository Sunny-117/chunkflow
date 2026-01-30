# ChunkFlow 发布指南

## 快速开始

### 正式版本发布

```bash
# 1. 确保已登录 npm
npm login

# 2. 运行发布脚本
pnpm release
```

### Alpha 版本发布

```bash
# 指定 alpha 版本号
./scripts/release-alpha.sh 0.0.1-alpha.1
```

---

## 详细说明

### 前置要求

- 已登录 npm：`npm login`
- 有 GitHub 推送权限
- （可选）安装 GitHub CLI：`brew install gh && gh auth login`

### 正式发布流程

运行 `pnpm release` 会自动：

1. 构建所有包
2. 运行测试
3. 类型检查
4. 更新版本号（基于 changesets）
5. 发布到 npm
6. 提交版本变更
7. 创建 git tag
8. 推送到 GitHub

最后按提示创建 GitHub Release。

### Alpha 发布流程

运行 `./scripts/release-alpha.sh 0.0.1-alpha.1` 会：

1. 更新所有包版本号为指定版本
2. 构建和测试
3. 发布到 npm 的 `alpha` tag
4. 提交、打 tag、推送到 GitHub

### 验证发布

```bash
# 查看 npm 包信息
npm view @chunkflow/core

# 查看 alpha 版本
npm view @chunkflow/core@alpha
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

```bash
gh release create v$VERSION --title "ChunkFlow v$VERSION" --notes-file CHANGELOG.md
```

---

## 常见问题

**Q: Alpha 版本如何安装？**

```bash
npm install @chunkflow/core@alpha
```

**Q: 如何回滚发布？**

```bash
# npm 撤回（24小时内）
npm unpublish @chunkflow/core@0.0.1

# 删除 GitHub Release
gh release delete v0.0.1
git tag -d v0.0.1
git push origin :refs/tags/v0.0.1
```

**Q: 发布失败怎么办？**

- 检查 npm 登录：`npm whoami`
- 检查包名是否可用
- 查看错误日志

## 相关链接

- [Changesets 文档](https://github.com/changesets/changesets)
- [npm 发布指南](https://docs.npmjs.com/cli/v8/commands/npm-publish)
