# 图片管理功能

## 🎯 功能概述

实现了完整的图片管理机制，粘贴或上传的图片将保存为本地文件，而不是 base64 编码。

---

## ✨ 功能特性

### 图片存储
- ✅ 自动保存到本地文件系统
- ✅ 按知识库分类命名
- ✅ 唯一文件名（时间戳 + 随机字符）
- ✅ 支持多种图片格式（PNG, JPG, GIF 等）

### 图片引用
- ✅ 使用 `file://` 协议本地路径
- ✅ 不再使用 base64 编码
- ✅ 减小文档体积
- ✅ 提高加载速度

### 自动管理
- ✅ 粘贴图片自动上传
- ✅ 拖拽图片自动上传
- ✅ 工具栏插入图片
- ✅ 图片去重（基于时间戳和随机值）

---

## 📁 存储位置

### 图片目录

**macOS**:
```
~/Library/Application Support/vite-vue3-electron-demo/images/
```

**Windows**:
```
%APPDATA%\vite-vue3-electron-demo\images\
```

**Linux**:
```
~/.config/vite-vue3-electron-demo/images/
```

### 文件命名规则

```
{knowledgeBaseId}_{timestamp}_{random}.{ext}

示例：
1759300122184_1696147200000_a3b4c5.png
```

组成部分：
- `knowledgeBaseId` - 所属知识库 ID
- `timestamp` - 时间戳
- `random` - 6位随机字符
- `ext` - 图片扩展名（png/jpg/gif 等）

---

## 🎯 使用方法

### 方式 1：粘贴图片

```
1. 复制任意图片到剪贴板
2. 在编辑器中按 Cmd/Ctrl + V
3. 图片自动上传并插入
4. 显示为 ![](file://...)
```

### 方式 2：拖拽图片

```
1. 从文件管理器拖动图片
2. 放到编辑器中
3. 图片自动上传并插入
```

### 方式 3：工具栏插入

```
1. 点击工具栏的「图片」按钮
2. 选择本地图片文件
3. 图片自动上传并插入
```

---

## 💡 优势

### 相比 base64 的优势

| 特性 | base64 | 本地文件 |
|------|--------|---------|
| 文档大小 | ❌ 增大 33% | ✅ 小 |
| 加载速度 | ❌ 慢 | ✅ 快 |
| 可读性 | ❌ 难以阅读 | ✅ 清晰 |
| 可管理性 | ❌ 难以管理 | ✅ 易管理 |
| 可复用 | ❌ 不可复用 | ✅ 可复用 |
| 存储效率 | ❌ 低 | ✅ 高 |

### 实际例子

**使用 base64**:
```markdown
![图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)  
# 超长的 base64 字符串，难以阅读和管理
```

**使用本地文件**:
```markdown
![图片](file:///Users/.../images/1759300122184_1696147200000_a3b4c5.png)
# 清晰的文件路径，易于理解
```

---

## 🔧 技术实现

### 图片上传流程

```
1. 用户粘贴/拖拽图片
   ↓
2. Cherry Markdown 触发 fileUpload 回调
   ↓
3. 读取图片为 base64
   ↓
4. 通过 IPC 发送到主进程
   ↓
5. 主进程保存为本地文件
   ↓
6. 返回文件路径
   ↓
7. 编辑器插入 file:// 链接
```

### 核心代码

```typescript
// 自定义图片上传
fileUpload: async (file: File) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const base64Data = e.target?.result as string
    // 保存到本地
    const fileName = await window.electronAPI.saveImage(
      base64Data, 
      knowledgeBaseId
    )
    // 获取路径
    const imagePath = await window.electronAPI.getImagePath(fileName)
    // 返回 file:// 路径
    resolve(`file://${imagePath}`)
  }
  reader.readAsDataURL(file)
}
```

---

## 📊 图片管理

### 自动命名

图片文件名包含：
- 知识库 ID - 方便按知识库查找
- 时间戳 - 唯一性和排序
- 随机字符 - 避免冲突

### 示例文件列表

```
images/
├── 1759300122184_1696147200000_a3b4c5.png  ← 知识库A的图片
├── 1759300122184_1696147250000_b6c7d8.jpg  ← 知识库A的图片
├── 1759300133333_1696148000000_x9y8z7.png  ← 知识库B的图片
└── ...
```

---

## 🗑️ 图片清理

### 当前机制

- 图片保存后不会自动删除
- 即使删除文档，图片仍保留
- 可以手动清理不需要的图片

### 手动清理

```bash
# 查看所有图片
ls -lh ~/Library/Application\ Support/vite-vue3-electron-demo/images/

# 删除所有图片
rm ~/Library/Application\ Support/vite-vue3-electron-demo/images/*

# 删除特定知识库的图片
rm ~/Library/Application\ Support/vite-vue3-electron-demo/images/1759300122184_*
```

### 未来改进

计划添加：
- [ ] 自动清理未使用的图片
- [ ] 图片引用计数
- [ ] 删除文档时清理相关图片
- [ ] 图片管理界面

---

## 💡 使用建议

### 图片优化

1. **使用合适的格式**
   - 照片：JPG（文件小）
   - 截图：PNG（清晰）
   - 图标：SVG/PNG

2. **控制图片大小**
   - 避免上传超大图片
   - 建议单张不超过 5MB
   - 可以预先压缩

3. **合理命名**
   - 虽然自动命名，但文档中可以添加描述
   - `![产品架构图](file://...)`

### 图片组织

1. **按知识库存储**
   - 每个知识库的图片自动分类
   - 文件名包含知识库 ID

2. **定期整理**
   - 删除不需要的知识库时
   - 手动清理对应的图片文件夹

---

## 🎯 示例

### 粘贴图片

```
操作：
1. 截图（Cmd + Shift + 4）
2. 在编辑器中粘贴（Cmd + V）
3. 自动上传并插入

结果：
![](file:///Users/.../images/1759300122184_1696147200000_a3b4c5.png)

显示：
[图片正常显示]
```

### 拖拽图片

```
操作：
1. 从文件管理器拖动图片
2. 放到编辑器中
3. 自动上传并插入

结果：
图片保存到本地并正确显示
```

---

## 🔒 安全性

### 路径安全
- ✅ 图片存储在受保护的用户数据目录
- ✅ 使用 file:// 协议访问
- ✅ Electron 沙箱安全

### 文件安全
- ✅ 自动创建目录
- ✅ 权限控制
- ✅ 错误处理

---

## 📝 API 说明

### Electron API

```typescript
// 保存图片
window.electronAPI.saveImage(base64Data, knowledgeBaseId)
  → 返回: fileName (字符串)

// 获取图片路径
window.electronAPI.getImagePath(fileName)
  → 返回: 完整路径 (字符串)

// 读取图片
window.electronAPI.readImage(fileName)
  → 返回: base64 数据 (字符串)

// 删除图片
window.electronAPI.deleteImage(fileName)
  → 返回: 成功/失败 (布尔值)
```

---

## ✅ 完成清单

- [x] 创建图片存储服务
- [x] 添加 IPC 接口
- [x] 配置 Cherry Markdown 上传
- [x] 支持粘贴图片
- [x] 支持拖拽图片
- [x] 支持工具栏上传
- [x] 自动保存到本地
- [x] 使用 file:// 路径

---

**图片管理功能已完成！现在粘贴图片会自动保存到本地文件！** 📸✨

