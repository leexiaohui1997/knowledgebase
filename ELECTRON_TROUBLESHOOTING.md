
# Electron应用空白问题排查指南

## 🔍 问题现象
- 开发模式 (npm run dev) 正常运行
- 打包后 (npm run build:mac) 应用显示空白
- 没有任何错误提示

## 🛠️ 排查步骤

### 1. 检查构建文件
```bash
# 检查dist目录
ls -la dist/

# 检查dist-electron目录  
ls -la dist-electron/

# 检查HTML文件
cat dist/index.html
```

### 2. 使用调试版本
```bash
# 使用调试版本的主进程文件
cp electron-main-debug.js dist-electron/main.js

# 重新构建
npm run build:mac

# 安装并运行，查看控制台输出
```

### 3. 检查常见问题

#### 问题1: 文件路径错误
- **现象**: 控制台显示 "Failed to load resource"
- **解决**: 检查electron-builder配置中的files字段

#### 问题2: 资源文件缺失
- **现象**: CSS/JS文件404错误
- **解决**: 确保所有资源文件都被正确复制

#### 问题3: 权限问题
- **现象**: 无法访问本地文件
- **解决**: 检查webPreferences配置

#### 问题4: 路径解析问题
- **现象**: __dirname路径不正确
- **解决**: 使用app.getAppPath()获取正确路径

### 4. 修复方案

#### 方案1: 更新package.json构建配置
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "build/**/*"
    ],
    "extraResources": [
      {
        "from": "dist",
        "to": "dist"
      }
    ]
  }
}
```

#### 方案2: 使用调试版本主进程
使用生成的 `electron-main-debug.js` 文件，它会：
- 显示详细的加载信息
- 尝试多个可能的文件路径
- 自动打开开发者工具
- 提供详细的错误信息

#### 方案3: 手动测试文件路径
```bash
# 在应用目录中检查文件
cd /Applications/知识库管理.app/Contents/Resources/app/
find . -name "index.html"
```

## 📋 下一步操作

1. 运行调试版本，查看控制台输出
2. 根据错误信息调整文件路径
3. 确保所有资源文件都被正确包含
4. 测试修复后的版本

## 🔧 快速修复命令

```bash
# 1. 使用调试版本
cp electron-main-debug.js dist-electron/main.js

# 2. 重新构建
npm run build:mac

# 3. 安装测试
open release/*.dmg
```
