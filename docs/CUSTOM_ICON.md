# 自定义应用图标指南

## 📁 图标文件位置

### 目录结构

```
demo/
├── build/                    # 创建这个目录
│   ├── icon.icns            # macOS 图标（必需）
│   ├── icon.ico             # Windows 图标（可选）
│   └── icon.png             # Linux 图标（可选）
├── electron/
├── src/
└── package.json
```

---

## 🎨 准备图标文件

### macOS 图标（.icns）

#### 方式 1：使用在线工具

1. 准备一张 **1024x1024** 的 PNG 图片
2. 访问在线转换工具：
   - https://cloudconvert.com/png-to-icns
   - https://iconverticons.com/online/
3. 上传 PNG，转换为 .icns
4. 下载 icon.icns 文件

#### 方式 2：使用命令行（macOS）

```bash
# 1. 准备一张 1024x1024 的 PNG 图片（命名为 icon.png）

# 2. 创建 iconset 目录
mkdir icon.iconset

# 3. 生成各种尺寸（需要 sips 命令）
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# 4. 转换为 icns
iconutil -c icns icon.iconset

# 5. 移动到 build 目录
mkdir -p build
mv icon.icns build/

# 6. 清理临时文件
rm -rf icon.iconset
```

### Windows 图标（.ico）

如果需要支持 Windows：

1. 准备 256x256 的 PNG 图片
2. 使用在线工具转换为 .ico：
   - https://convertio.co/png-ico/
   - https://icoconvert.com/
3. 保存为 `build/icon.ico`

### Linux 图标（.png）

直接使用 512x512 或 1024x1024 的 PNG 图片：
```bash
cp your-icon.png build/icon.png
```

---

## 📝 更新配置

### 当前配置（package.json）

```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns"  // ← 已配置
    }
  }
}
```

### 添加其他平台（可选）

```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico"
    },
    "linux": {
      "icon": "build/icon.png"
    }
  }
}
```

---

## 🚀 快速开始

### 步骤 1：创建 build 目录

```bash
cd /Users/masterpiano/Desktop/demo
mkdir build
```

### 步骤 2：准备图标

- 设计一个 1024x1024 的图标
- 或使用现有的图标
- 推荐：书本 📚、文件夹 📁 相关的图标

### 步骤 3：转换并放置

```bash
# 假设您有 my-icon.png
# 使用在线工具转换为 icon.icns
# 下载后放到 build 目录

mv ~/Downloads/icon.icns build/
```

### 步骤 4：重新打包

```bash
npm run build:mac
```

---

## 🎯 图标设计建议

### 尺寸要求

| 平台 | 格式 | 推荐尺寸 |
|------|------|---------|
| macOS | .icns | 1024x1024 |
| Windows | .ico | 256x256 |
| Linux | .png | 512x512 |

### 设计原则

1. **简洁明了**
   - 避免复杂细节
   - 在小尺寸下也要清晰

2. **符合主题**
   - 知识库/文档管理相关
   - 例如：书本、笔记本、文件夹

3. **颜色搭配**
   - 使用应用主题色（#42b883）
   - 或选择对比鲜明的颜色

4. **圆角处理**
   - macOS 推荐圆角
   - 系统会自动应用遮罩

---

## 📚 推荐资源

### 免费图标网站

- **IconFinder**: https://www.iconfinder.com/
- **Flaticon**: https://www.flaticon.com/
- **Icons8**: https://icons8.com/
- **Iconfont**: https://www.iconfont.cn/

### 在线转换工具

- **CloudConvert**: https://cloudconvert.com/png-to-icns
- **iConvert Icons**: https://iconverticons.com/online/

### 图标生成工具

- **Figma**: 设计图标
- **Sketch**: 设计图标
- **Canva**: 在线设计

---

## 🎨 示例图标创建

### 使用 Figma/Sketch

```
1. 创建 1024x1024 画布
2. 绘制图标：
   - 主体：书本或文件夹
   - 颜色：#42b883（主题绿）
   - 背景：白色或渐变
3. 导出为 PNG
4. 使用工具转换为 .icns
5. 放到 build/ 目录
```

### 简单方案

如果暂时没有设计能力：
```
1. 下载一个免费的书本图标
2. 使用 Canva 添加背景色
3. 导出 1024x1024 PNG
4. 转换为 .icns
5. 放到 build/ 目录
```

---

## ✅ 验证

### 打包后检查

```bash
# 打包
npm run build:mac

# 检查生成的应用
open release/mac-arm64/ViteVue3ElectronDemo.app

# 应该看到自定义图标
```

### 开发模式

开发模式下看到的图标是 Electron 默认图标，只有打包后才会使用自定义图标。

---

## 🐛 常见问题

### 问题 1：打包后图标没变

**原因**：
- 图标文件路径错误
- 图标格式不正确
- 缓存问题

**解决**：
```bash
# 清理缓存
rm -rf release/
rm -rf dist/
rm -rf dist-electron/

# 重新打包
npm run build:mac
```

### 问题 2：图标显示模糊

**原因**：图标尺寸太小

**解决**：使用至少 1024x1024 的源图片

### 问题 3：图标边缘锯齿

**原因**：图片质量问题

**解决**：使用矢量图或高质量 PNG

---

## 📝 快速命令

```bash
# 创建 build 目录
mkdir -p /Users/masterpiano/Desktop/demo/build

# 将您的图标文件复制进去
# cp your-icon.icns /Users/masterpiano/Desktop/demo/build/icon.icns

# 打包应用
cd /Users/masterpiano/Desktop/demo
npm run build:mac
```

---

## 💡 推荐图标

对于知识库管理应用，推荐的图标主题：

- 📚 书架/书本
- 📖 打开的书
- 📝 笔记本
- 🗂️ 文件柜
- 💡 灯泡（知识）
- 🎓 学士帽（学习）

---

**准备好图标后，放到 build/icon.icns，然后重新打包即可！** 🎨✨

