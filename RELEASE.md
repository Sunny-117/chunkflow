# ChunkFlow Release Guide

本指南说明如何发布新版本到 npm 和 GitHub Release。

## 前置要求

1. 确保你已登录 npm：
```bash
npm login
```

2. 确保你有 GitHub 仓库的推送权限

3. （可选）安装 GitHub CLI 用于创建 Release：
```bash
brew install gh  # macOS
# 或访问 https://cli.github.com/
gh auth login
```

## 发布步骤

### 方式一：使用自动化脚本（推荐）

```bash
chmod +x scripts/release.sh
./scripts/release.sh
```

脚本会自动完成：
- ✅ 构建所有包
- ✅ 运行测试
- ✅ 类型检查
- ✅ 更新版本号
- ✅ 发布到 npm
- ✅ 提交版本变更
- ✅ 创建 git tag
- ✅ 推送到 GitHub

最后需要手动创建 GitHub Release（见下方）。

### 方式二：手动执行（完全控制）

#### 1. 构建和测试

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck
```

#### 2. 更新版本号

```bash
# 应用 changeset 并更新版本
pnpm changeset version
```

这会：
- 读取 `.changeset/*.md` 文件
- 更新所有包的版本号
- 生成 CHANGELOG.md
- 删除已应用的 changeset 文件

#### 3. 重新构建（使用新版本号）

```bash
pnpm build
```

#### 4. 发布到 npm

```bash
# 发布所有包到 npm
pnpm changeset publish
```

这会发布所有非 private 的包到 npm。

#### 5. 提交版本变更

```bash
git add .
git commit -m "chore: release packages"
```

#### 6. 创建 git tag

```bash
# 获取版本号（从任一包）
VERSION=$(node -p "require('./packages/core/package.json').version")

# 创建 tag
git tag -a "v$VERSION" -m "Release v$VERSION"
```

#### 7. 推送到 GitHub

```bash
git push origin main
git push origin "v$VERSION"
```

#### 8. 创建 GitHub Release

**方式 A：使用 GitHub CLI（推荐）**

```bash
# 自动从 CHANGELOG.md 提取内容
gh release create v$VERSION \
  --title "ChunkFlow v$VERSION" \
  --notes-file CHANGELOG.md

# 或手动编写说明
gh release create v$VERSION \
  --title "ChunkFlow v$VERSION" \
  --notes "Release notes here"
```

**方式 B：使用 GitHub Web UI**

1. 访问：`https://github.com/Sunny-117/chunkflow/releases/new`
2. 选择 tag：`v$VERSION`
3. 标题：`ChunkFlow v$VERSION`
4. 描述：从 CHANGELOG.md 复制相关内容
5. 点击 "Publish release"

## 发布 Alpha/Beta 版本

### 创建 alpha changeset

```bash
# 创建 changeset
pnpm changeset

# 选择要发布的包
# 选择版本类型（minor/patch）
# 输入变更说明
```

### 手动修改版本为 alpha

编辑生成的 `.changeset/*.md` 文件，或在 `changeset version` 后手动修改 package.json：

```json
{
  "version": "0.0.1-alpha.1"
}
```

### 发布 alpha 版本

```bash
# 构建
pnpm build

# 发布到 npm 的 alpha tag
pnpm changeset publish --tag alpha
```

## 验证发布

### 检查 npm

```bash
# 查看包信息
npm view @chunkflow/core

# 查看所有版本
npm view @chunkflow/core versions

# 查看 alpha 版本
npm view @chunkflow/core dist-tags
```

### 检查 GitHub

```bash
# 查看 tags
git tag -l

# 查看 releases
gh release list
```

## 回滚发布

### 从 npm 撤回（24小时内）

```bash
npm unpublish @chunkflow/core@0.0.1-alpha.1
```

⚠️ **注意**：npm 只允许在发布后 24 小时内撤回，且撤回后该版本号不能再次使用。

### 从 GitHub 删除 Release

```bash
# 使用 GitHub CLI
gh release delete v0.0.1-alpha.1

# 删除 tag
git tag -d v0.0.1-alpha.1
git push origin :refs/tags/v0.0.1-alpha.1
```

## 常见问题

### Q: 如何跳过某些包的发布？

A: 在包的 `package.json` 中添加 `"private": true`。

### Q: 如何发布到不同的 npm tag？

A: 使用 `--tag` 参数：
```bash
pnpm changeset publish --tag beta
```

### Q: 如何查看将要发布的内容？

A: 使用 dry-run：
```bash
pnpm changeset publish --dry-run
```

### Q: 发布失败了怎么办？

A: 
1. 检查 npm 登录状态：`npm whoami`
2. 检查包名是否已被占用
3. 检查网络连接
4. 查看详细错误信息

## 相关链接

- [Changesets 文档](https://github.com/changesets/changesets)
- [npm 发布指南](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub CLI 文档](https://cli.github.com/manual/)
