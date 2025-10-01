# 图标文件目录

## 📁 用途

此目录用于存放应用打包时使用的图标文件。

---

## 📝 需要的文件

### macOS（必需）
- **icon.icns** - macOS 应用图标
  - 格式：.icns
  - 推荐尺寸：1024x1024

### Windows（可选）
- **icon.ico** - Windows 应用图标
  - 格式：.ico
  - 推荐尺寸：256x256

### Linux（可选）
- **icon.png** - Linux 应用图标
  - 格式：.png
  - 推荐尺寸：512x512

---

## 🎨 如何创建图标

### 方式 1：在线转换（推荐）

1. 准备一张 1024x1024 的 PNG 图片
2. 访问：https://cloudconvert.com/png-to-icns
3. 上传并转换为 .icns
4. 下载并重命名为 `icon.icns`
5. 放到此目录

### 方式 2：使用命令行（macOS）

参见项目根目录的 `CUSTOM_ICON.md` 文档。

---

## 📦 打包应用

放置图标后，运行：

```bash
npm run build:mac
```

打包后的应用将使用您的自定义图标。

---

## ⚠️ 注意事项

1. **文件名必须准确**
   - macOS: `icon.icns`（不是 Icon.icns 或其他）
   - Windows: `icon.ico`
   - Linux: `icon.png`

2. **格式必须正确**
   - 不能用 PNG 重命名为 .icns
   - 必须是真正的 icns 格式文件

3. **开发模式不生效**
   - 开发模式（npm run electron:dev）显示默认图标
   - 只有打包后才会显示自定义图标

---

## 🎯 当前配置

在 `package.json` 中的配置：

```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns"  // ← 指向此文件
    }
  }
}
```

---

**将您的图标文件放到这里，然后重新打包即可！** 🎨


