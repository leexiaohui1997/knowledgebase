# 双版本构建指南

本项目支持构建两个版本：

1. **Electron 桌面版** - 使用 Electron 文件系统存储
2. **Web 浏览器版** - 使用 IndexedDB 存储

---

## 🏗️ 架构设计

### 存储抽象层

项目使用**存储抽象层**实现跨平台支持：

```
┌─────────────────────────┐
│   Vue Components        │
│   (UI Layer)            │
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│   Pinia Store           │
│   (State Management)    │
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│   Storage Interface     │  ← 统一接口
│   (IStorage)            │
└─────┬────────────────┬──┘
      │                │
┌─────▼────────┐  ┌───▼──────────┐
│  Electron    │  │  IndexedDB   │
│  Storage     │  │  Storage     │
│  (File I/O)  │  │  (Browser)   │
└──────────────┘  └──────────────┘
```

### 自动环境检测

应用会自动检测运行环境并选择合适的存储实现：

```typescript
function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

function getStorage(): IStorage {
  if (isElectronEnvironment()) {
    return new ElectronStorage()  // 桌面版
  } else {
    return new WebStorage()       // Web 版
  }
}
```

---

## 📦 构建命令

### Electron 桌面版

#### 开发模式
```bash
# 启动 Electron 开发服务器（默认模式）
npm run electron:dev

# 或使用
npm run dev:clean  # 先清理进程再启动
```

#### 构建
```bash
# macOS M1
npm run build:mac

# 通用构建（所有平台，需配置）
npm run build

# 带类型检查的构建
npm run build:mac:check
```

#### 输出
- **源码构建**: `dist/` 和 `dist-electron/`
- **打包应用**: `release/`

---

### Web 浏览器版

#### 开发模式
```bash
# 启动 Web 开发服务器
npm run dev:web
```

访问: `http://localhost:5173`

#### 构建
```bash
# 构建 Web 版
npm run build:web
```

#### 预览
```bash
# 预览构建后的 Web 版
npm run preview:web
```

#### 输出
- **构建目录**: `dist-web/`
- **入口文件**: `dist-web/index.html`

#### 部署

Web 版构建完成后，可以部署到任何静态网站托管服务：

```bash
# 方式 1: 使用静态服务器
cd dist-web
python3 -m http.server 8080

# 方式 2: 使用 serve
npx serve dist-web

# 方式 3: 部署到云服务
# - Vercel: vercel dist-web
# - Netlify: netlify deploy --dir=dist-web
# - GitHub Pages: 上传 dist-web 内容
```

---

## 🗄️ 存储方案对比

| 特性 | Electron 版 | Web 版 |
|------|------------|--------|
| **存储方式** | 本地文件系统 | IndexedDB |
| **数据位置** | `~/Library/Application Support/vite-vue3-electron-demo/` | 浏览器缓存 |
| **容量限制** | 无限制（取决于磁盘） | ~50MB-250MB+ |
| **数据持久性** | 永久（手动删除） | 持久（浏览器不清理） |
| **跨设备同步** | 不支持 | 不支持（未来可扩展） |
| **离线访问** | 完全支持 | 完全支持 |
| **图片存储** | 文件系统 | IndexedDB Blob |
| **数据导出** | 访问文件系统 | 需实现导出功能 |

---

## 💾 IndexedDB 存储详情

### 数据结构

Web 版使用 IndexedDB 存储所有数据：

```
KnowledgeBaseDB
├── data (ObjectStore)
│   └── main
│       ├── knowledgeBases: KnowledgeBase[]
│       └── documents: Record<string, DocumentNode[]>
└── images (ObjectStore)
    ├── {knowledgeBaseId}-{timestamp}-{random}
    │   ├── id: string
    │   └── data: string (base64)
    └── ...
```

### 容量管理

IndexedDB 的存储配额：

- **Chrome/Edge**: ~60% 可用磁盘空间
- **Firefox**: ~50% 可用磁盘空间  
- **Safari**: ~1GB（可请求更多）

查看当前使用量：

```javascript
// 在浏览器控制台执行
navigator.storage.estimate().then(estimate => {
  console.log('使用:', estimate.usage / 1024 / 1024, 'MB')
  console.log('配额:', estimate.quota / 1024 / 1024, 'MB')
})
```

### 数据清除

Web 版数据存储在浏览器中，可通过以下方式清除：

1. **浏览器设置** → 清除浏览器数据 → 选择"IndexedDB"
2. **开发者工具** → Application → IndexedDB → 删除 `KnowledgeBaseDB`
3. **代码清除**（未来可实现）:
   ```javascript
   indexedDB.deleteDatabase('KnowledgeBaseDB')
   ```

---

## 🔧 开发指南

### 添加新的存储方法

1. 在 `src/storage/types.ts` 中定义接口方法
2. 在 `ElectronStorage` 和 `WebStorage` 中实现
3. 在 Pinia store 中调用

示例：

```typescript
// 1. 定义接口
export interface IStorage {
  // ...现有方法
  exportData(): Promise<Blob>  // 新方法
}

// 2. Electron 实现
class ElectronStorage implements IStorage {
  async exportData(): Promise<Blob> {
    const data = await this.api.exportAllData()
    return new Blob([JSON.stringify(data)])
  }
}

// 3. Web 实现
class WebStorage implements IStorage {
  async exportData(): Promise<Blob> {
    const data = await this.readData()
    return new Blob([JSON.stringify(data)])
  }
}

// 4. Store 中使用
const storage = getStorage()
const blob = await storage.exportData()
```

### 调试存储

#### Electron 版

查看数据文件：
```bash
# macOS
open ~/Library/Application\ Support/vite-vue3-electron-demo/

# Linux
cd ~/.config/vite-vue3-electron-demo/

# Windows
explorer %APPDATA%\vite-vue3-electron-demo\
```

#### Web 版

1. 打开开发者工具
2. Application → IndexedDB → KnowledgeBaseDB
3. 查看 `data` 和 `images` ObjectStore

---

## 🎯 功能差异

### Electron 版专有

- 原生窗口控制
- 系统托盘图标
- 文件系统直接访问
- 系统通知
- 自动更新（可配置）

### Web 版特性

- 无需安装
- 跨平台（任何现代浏览器）
- 易于分享（URL）
- 移动端兼容（响应式）
- 云端托管

---

## 📱 移动端支持

Web 版默认支持移动端浏览器：

- iOS Safari
- Chrome Mobile
- Firefox Mobile
- Edge Mobile

建议为移动端添加 PWA 支持（未来功能）。

---

## 🚀 性能优化

### Web 版优化建议

1. **懒加载** - 大型知识库按需加载文档
2. **虚拟滚动** - 长列表使用虚拟滚动
3. **图片压缩** - 自动压缩大图片
4. **缓存策略** - Service Worker 缓存静态资源

### Electron 版优化

1. **预加载** - 使用 preload 脚本
2. **IPC 优化** - 批量操作减少 IPC 调用
3. **窗口优化** - 延迟加载非关键窗口

---

## 🐛 常见问题

### Q: Web 版数据会丢失吗？

A: 不会。IndexedDB 是持久化存储，除非用户主动清除浏览器数据或磁盘空间不足。

### Q: 能否在两个版本间迁移数据？

A: 目前不支持。未来可以通过导入/导出功能实现：
- Electron 版导出 JSON
- Web 版导入 JSON

### Q: Web 版能离线使用吗？

A: 可以。使用 PWA + Service Worker 可实现完全离线访问（未来功能）。

### Q: 为什么选择 IndexedDB 而不是 localStorage？

A: IndexedDB 优势：
- 更大的存储空间
- 支持复杂数据结构
- 异步操作不阻塞 UI
- 可以存储 Blob（图片）

### Q: 构建时如何确保不相互干扰？

A: 通过 Vite 的 `mode` 参数隔离：
- 默认模式：Electron 插件启用，输出到 `dist/`
- Web 模式：Electron 插件禁用，输出到 `dist-web/`

---

## 📝 构建脚本说明

| 命令 | 环境 | 用途 |
|------|-----|------|
| `npm run dev` | Electron | Vite 开发服务器（仅前端） |
| `npm run dev:web` | Web | Web 版开发服务器 |
| `npm run electron:dev` | Electron | 完整 Electron 开发环境 |
| `npm run build` | Electron | 完整构建（类型检查 + 打包） |
| `npm run build:web` | Web | Web 版生产构建 |
| `npm run build:mac` | Electron | macOS 快速构建 |
| `npm run preview` | Electron | 预览 Electron 构建 |
| `npm run preview:web` | Web | 预览 Web 构建 |

---

## 🎉 总结

通过存储抽象层，本项目实现了：

- ✅ **一套代码，两个平台**
- ✅ **自动环境检测和适配**
- ✅ **统一的开发体验**
- ✅ **独立的构建流程**
- ✅ **零运行时开销**（编译时优化）

无论是桌面应用还是 Web 应用，都能提供完整的功能体验！🚀

