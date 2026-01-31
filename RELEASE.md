# ChunkFlow 发布指南

## 快速开始

### 正式版本发布

```bash
# 1. 确保已登录 npm
npm login

# 2. 运行发布脚本（全自动，支持断点续传）
pnpm release
```

脚本会自动：
- ✅ 验证包配置（检查 workspace:* 依赖）
- ✅ 构建、测试、类型检查
- ✅ 更新版本号并发布到 npm
- ✅ 创建 git tag 并推送
- ✅ 创建 GitHub Release
- ✅ 更新 dist-tags（稳定版本自动设置为 latest）
- 🔄 **支持断点续传**：如果某一步失败，修复后重新运行脚本会从失败的步骤继续

### Alpha 版本发布

```bash
# 指定 alpha 版本号（全自动，支持断点续传）
./scripts/release-alpha.sh 0.0.1-alpha.4
```

脚本会自动：
- ✅ 更新所有包版本号
- ✅ 验证包配置
- ✅ 构建、测试、类型检查
- ✅ 发布到 npm 的 alpha tag
- ✅ 创建 git tag 并推送
- ✅ 创建 GitHub Prerelease
- ✅ 更新 alpha dist-tag
- ❓ 询问是否更新 latest tag（仅在没有稳定版本时）
- 🔄 **支持断点续传**：如果某一步失败，修复后重新运行脚本会从失败的步骤继续

### 断点续传功能

如果发布过程中某一步失败（如网络问题、npm 认证过期等）：

1. **修复问题**（如重新登录 npm、检查网络）
2. **重新运行相同的命令**
3. 脚本会检测到之前的进度，询问是否继续：
   ```
   ⚠️  Found previous release in progress!
   📊 Current release state:
   
     Version: 0.1.0
   
     Steps completed:
       ✅ Build
       ✅ Verify
       ✅ Test
       ✅ Typecheck
       ✅ Version update
       ✅ Rebuild
       ⏸️  Publish  ← 从这里继续
       ⏸️  Commit
       ...
   
   Resume from last checkpoint? (y/n)
   ```
4. 选择 `y` 继续，或 `n` 重新开始

**优势**：
- 🚀 节省时间：不需要重新构建和测试
- 🔒 安全：已完成的步骤会被跳过，避免重复操作
- 💪 健壮：网络问题、npm 认证过期等都可以恢复
- 📊 透明：清楚显示哪些步骤已完成

---

## 故障恢复

### 常见失败场景及解决方案

#### 1. npm 认证过期

**症状**：发布时提示 `npm ERR! code ENEEDAUTH`

**解决**：
```bash
# 重新登录
npm login

# 重新运行发布脚本（会从失败的步骤继续）
pnpm release
# 或
./scripts/release-alpha.sh 0.0.1-alpha.4
```

#### 2. 网络问题

**症状**：推送到 GitHub 失败或创建 Release 失败

**解决**：
```bash
# 检查网络连接
ping github.com

# 重新运行脚本（会从失败的步骤继续）
pnpm release
```

#### 3. 部分包发布失败

**症状**：某些包发布成功，某些失败

**解决**：
```bash
# 脚本会自动检测已发布的包并跳过
# 直接重新运行即可
pnpm release
```

#### 4. 测试失败

**症状**：测试步骤失败

**解决**：
```bash
# 修复测试问题
# 然后重新运行（会从测试步骤继续）
pnpm release
```

#### 5. 手动清理状态

如果需要完全重新开始（不使用断点续传）：

```bash
# 删除状态文件
rm -f .release-state

# 重新运行发布脚本
pnpm release
```

### 查看当前发布状态

```bash
# 查看发布进度
source scripts/release-state.sh
show_state
```

---

## 自动化脚本说明

### scripts/release-state.sh

发布状态管理脚本，提供断点续传功能。

**功能**：
- 记录每个步骤的完成状态
- 支持从失败的步骤恢复
- 显示当前发布进度

**状态文件**：`.release-state`（自动创建和清理）

### scripts/verify-publish.sh

发布前验证脚本，检查：
- 是否存在 `workspace:*` 依赖（会在发布时自动转换）
- 包配置是否正确

**使用**：在 `release.sh` 和 `release-alpha.sh` 中自动调用

### scripts/update-dist-tags.sh

批量更新 npm dist-tags 的脚本。

**使用**：
```bash
# 自动调用（在发布脚本中）
./scripts/update-dist-tags.sh 0.1.0 latest

# 手动调用
./scripts/update-dist-tags.sh <version> <tag>
```

**参数**：
- `version`: 要设置的版本号（如 `0.1.0`）
- `tag`: dist-tag 名称（如 `latest`, `alpha`, `beta`）

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

> **重要**：
> - `changeset publish` 会使用 pnpm 发布，自动将 `workspace:*` 依赖转换为具体版本号（如 `0.0.1-alpha.1`）
> - 正式版本会自动设置为 `latest` tag
> - 第一个正式版本发布后，`latest` 将指向稳定版本

### Alpha 发布流程

运行 `./scripts/release-alpha.sh 0.0.1-alpha.1` 会：

1. ✅ 更新所有包版本号为指定版本
2. ✅ 构建和测试
3. ✅ 发布到 npm 的 `alpha` tag
4. ✅ 提交、打 tag、推送到 GitHub
5. ✅ **自动创建 GitHub Prerelease**（如果安装了 GitHub CLI）

> **注意**：
> - Alpha 版本使用 `--tag alpha` 发布，不会影响 `latest` tag
> - 在第一个稳定版本发布之前，`latest` 会指向最新的 alpha 版本
> - 用户需要明确指定 `@alpha` 来安装 alpha 版本：`npm install @chunkflowjs/core@alpha`

### 验证发布

```bash
# 查看 npm 包信息
npm view @chunkflowjs/core

# 查看 alpha 版本
npm view @chunkflowjs/core@alpha

# 查看所有 dist-tags
npm view @chunkflowjs/core dist-tags
```

### 管理 dist-tags

```bash
# 查看当前 tags
npm dist-tag ls @chunkflowjs/core

# 添加或更新 tag
npm dist-tag add @chunkflowjs/core@0.1.0 latest

# 删除 tag（不推荐删除 latest）
npm dist-tag rm @chunkflowjs/core beta

# 批量更新所有包的 latest tag
for pkg in core protocol shared upload-client-react upload-client-vue upload-component-react upload-component-vue upload-server; do
  npm dist-tag add @chunkflowjs/$pkg@0.1.0 latest
done
```

> **当前状态**：在第一个稳定版本（如 `0.1.0`）发布之前，`latest` 指向最新的 alpha 版本。

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
