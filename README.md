# 文档管理应用

一个基于 Vite + Vue3 + TypeScript + Electron 开发的本地文档管理系统，支持 Markdown 编辑和多层级文档组织。

## ✨ 功能特性

### 📚 知识库管理
- ✅ 创建知识库（自定义名称、头像表情、简介）
- ✅ 编辑知识库（右键菜单快速编辑）
- ✅ 知识库列表展示（卡片式布局）
- ✅ 搜索知识库（支持名称和简介搜索）
- ✅ 删除知识库（级联删除所有文档）
- ✅ 右键菜单（快捷操作）

### 📁 文档管理
- ✅ 创建文件和文件夹
- ✅ 重命名文件和文件夹（右键菜单）
- ✅ 拖拽移动和排序（鼠标拖拽）✨
- ✅ 无限层级的文件目录结构
- ✅ 树形目录展示（支持展开/折叠）
- ✅ 删除文件/文件夹（级联删除子项）
- ✅ 文件夹内快速创建子项（右键菜单）
- ✅ 右键菜单（丰富的上下文操作）

### ✏️ Markdown 编辑器
- ✅ Cherry Markdown 专业编辑器
- ✅ 所见即所得单栏模式
- ✅ 丰富的工具栏（格式化、插入等）
- ✅ 图片管理（粘贴/拖拽自动保存到本地）
- ✅ 快捷键保存（Cmd/Ctrl + S）
- ✅ 代码块语法高亮
- ✅ 类 Word 编辑体验

### 💾 数据持久化
- ✅ 本地 JSON 文件存储
- ✅ 自动保存到 Electron userData 目录
- ✅ 数据安全可靠

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

#### Electron 桌面版（默认）

```bash
npm run electron:dev
```

这将启动 Vite 开发服务器和 Electron 应用，支持热重载。

#### Web 浏览器版

```bash
npm run dev:web
```

访问 `http://localhost:5173` 即可在浏览器中使用。

### 构建应用

#### Electron 桌面版

```bash
# 为 macOS M1 构建
npm run build:mac

# 通用构建（包含类型检查）
npm run build:mac:check
```

构建完成后，应用程序将在 `release` 目录中生成。

#### Web 浏览器版

```bash
# 构建 Web 版
npm run build:web

# 预览构建结果
npm run preview:web
```

构建完成后，静态文件将在 `dist-web` 目录中生成，可部署到任何静态网站托管服务。

**部署到 GitHub Pages**：
```bash
# 自动部署（推荐）：推送代码到 main 分支即可自动部署
git push origin main

# 手动部署：运行部署脚本
./deploy.sh
```

详见：[GitHub Pages 部署指南](./docs/GITHUB_PAGES_DEPLOYMENT.md)

## 🌐 双版本支持

本项目支持两种运行方式：

1. **Electron 桌面版** - 使用本地文件系统存储，完整的桌面应用体验
2. **Web 浏览器版** - 使用 IndexedDB 存储，无需安装即可使用

通过**存储抽象层**设计，两个版本共享相同的代码库，根据运行环境自动选择合适的存储方案。

详见：[双版本构建指南](./docs/DUAL_BUILD.md)

## 📚 完整文档

查看 **[docs/](./docs/)** 目录获取所有详细文档：
- [双版本构建指南](./docs/DUAL_BUILD.md) - Electron 版 vs Web 版
- 功能实现文档
- 问题修复记录
- 测试与调试指南
- 使用技巧和最佳实践

## 📖 使用指南

### 1. 创建知识库

1. 点击右上角「➕ 创建知识库」按钮
2. 填写知识库名称（必填）
3. 选择一个表情作为头像
4. 填写简介（可选）
5. 点击「创建」

### 2. 管理知识库

- **进入知识库**：点击知识库卡片或右键选择「打开」
- **编辑知识库**：右键卡片选择「编辑」
- **搜索知识库**：在搜索框输入关键词
- **删除知识库**：右键选择「删除」或点击卡片右上角的 🗑️ 图标
- **快速创建**：在空白处右键选择「创建知识库」

### 3. 创建文档

在知识库详情页：

**方式一：使用按钮**
1. 点击右上角「➕ 新建」按钮
2. 选择类型（文件或文件夹）
3. 输入名称
4. 点击「创建」

**方式二：使用右键菜单（推荐）**
- 在空白处右键 → 选择「新建文件」或「新建文件夹」
- 在文件夹上右键 → 选择「新建文件」或「新建文件夹」在其内创建

### 4. 编辑文档

1. 在左侧文档树中点击文件
2. 在右侧 Cherry Markdown 编辑器中编写
   - 所见即所得的编辑体验
   - 工具栏：快速插入格式
   - 粘贴图片：自动保存到本地
3. 使用 `Cmd/Ctrl + S` 或点击「💾 保存」按钮保存

详见 [IMAGE_MANAGEMENT.md](./docs/IMAGE_MANAGEMENT.md) 了解图片管理功能

### 5. 管理文档

- **重命名**：右键文件或文件夹，选择「重命名」
- **移动**：按住并拖动文件/文件夹到目标位置 ✨
  - 拖到文件夹上部/下部：放在前面/后面
  - 拖到文件夹中部：放入文件夹内
  - 拖到空白区域：移到根目录末尾 🆕
- **排序**：在同一层级内拖动调整顺序 ✨
- **删除**：右键选择「删除」或悬停在文档上点击 🗑️ 图标
- **快速操作**：使用右键菜单获取更多选项

详见 [DRAG_DROP.md](./docs/DRAG_DROP.md) 和 [DRAG_TO_ROOT.md](./docs/DRAG_TO_ROOT.md) 了解完整的拖拽功能

### Cherry Markdown 编辑器

强大的所见即所得 Markdown 编辑器，详见 [CHERRY_MARKDOWN.md](./docs/CHERRY_MARKDOWN.md)

## 📁 项目结构

```
demo/
├── electron/                # Electron 主进程
│   ├── main.ts             # 主进程入口
│   ├── preload.ts          # 预加载脚本
│   ├── storage.ts          # 数据存储
│   ├── image-storage.ts    # 图片存储
│   └── ipc-handlers.ts     # IPC 通信处理
├── src/
│   ├── components/         # Vue 组件
│   │   ├── DocumentTree.vue      # 文档树组件
│   │   ├── MarkdownEditor.vue    # Markdown 编辑器
│   │   └── ContextMenu.vue       # 右键菜单
│   ├── views/              # 页面视图
│   │   ├── KnowledgeBaseList.vue     # 知识库列表
│   │   └── KnowledgeBaseDetail.vue   # 知识库详情
│   ├── stores/             # Pinia 状态管理
│   │   └── knowledge.ts    # 知识库状态
│   ├── router/             # Vue Router
│   │   └── index.ts        # 路由配置
│   ├── types/              # TypeScript 类型
│   │   └── index.ts        # 类型定义
│   ├── App.vue             # 根组件
│   ├── main.ts             # Vue 应用入口
│   └── style.css           # 全局样式
├── docs/                   # 📚 项目文档目录
│   ├── README.md           # 文档索引
│   ├── QUICK_START.md      # 快速开始
│   ├── FEATURES.md         # 功能特性
│   └── ...                 # 更多技术文档
├── build/                  # 🎨 构建资源
│   ├── README.md           # 图标说明
│   └── icon.icns          # 应用图标（需自行添加）
├── package.json            # 项目配置
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

## 🛠️ 技术栈

- **框架**：Vue 3（Composition API）
- **构建工具**：Vite 5.x
- **桌面框架**：Electron 28.x
- **语言**：TypeScript 5.x
- **路由**：Vue Router 4.x
- **状态管理**：Pinia 2.x
- **Markdown 编辑器**：Cherry Markdown 0.8.x
- **图标库**：Font Awesome 6.x

## 💾 数据存储位置

数据存储在 Electron 的 userData 目录：

- **macOS**: `~/Library/Application Support/vite-vue3-electron-demo/data.json`
- **Windows**: `%APPDATA%\vite-vue3-electron-demo\data.json`
- **Linux**: `~/.config/vite-vue3-electron-demo/data.json`

## 🔧 快捷操作

### 快捷键
- `Cmd/Ctrl + S`：保存当前文档

### 右键菜单
- **知识库列表**：空白处右键创建，卡片上右键打开/编辑/删除
- **文档目录**：空白处右键新建，节点上右键重命名/删除
- **文件夹**：右键可在其内快速创建文件或子文件夹

详见 [CONTEXT_MENU.md](./docs/CONTEXT_MENU.md) 了解完整的右键菜单功能

## 🎨 界面特色

- 🎯 简洁现代的 UI 设计
- 🎨 Font Awesome 专业图标系统
- 📱 响应式布局
- ⚡ 流畅的过渡动画
- 🖱️ 美观的滚动条样式
- 🎭 统一的视觉风格

## 🚧 已知限制

- 暂不支持多选拖动（一次只能拖一个）
- 暂不支持全局搜索文档内容
- 暂不支持跨知识库移动文档
- 暂不支持图片自动清理（需手动清理）

## 🔮 计划功能

- [x] 文档重命名 ✅
- [x] 右键菜单 ✅
- [x] 编辑知识库 ✅
- [x] 拖拽排序和移动 ✅
- [x] 图片上传和管理 ✅
- [x] Cherry Markdown 编辑器 ✅
- [x] Font Awesome 图标 ✅
- [ ] 多选拖动
- [ ] 全文搜索
- [ ] 图片自动清理
- [ ] 导出为 PDF/HTML
- [ ] 文档标签系统
- [ ] 云同步支持

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Electron](https://www.electronjs.org/)
- [CodeMirror](https://codemirror.net/)
- [markdown-it](https://github.com/markdown-it/markdown-it)
