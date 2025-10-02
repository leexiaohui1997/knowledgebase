#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Electron应用调试脚本
 * 用于排查打包后应用显示空白的问题
 */

console.log('🔍 开始排查Electron应用空白问题...');

// 检查构建文件
function checkBuildFiles() {
  console.log('\n📁 检查构建文件结构:');
  console.log('─'.repeat(50));
  
  const distPath = path.join(__dirname, '../dist');
  const distElectronPath = path.join(__dirname, '../dist-electron');
  
  // 检查dist目录
  if (fs.existsSync(distPath)) {
    console.log('✅ dist/ 目录存在');
    const distFiles = fs.readdirSync(distPath);
    console.log('  📄 dist/ 内容:', distFiles.join(', '));
    
    // 检查关键文件
    const criticalFiles = ['index.html', 'assets'];
    criticalFiles.forEach(file => {
      const filePath = path.join(distPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} 存在`);
      } else {
        console.log(`  ❌ ${file} 缺失`);
      }
    });
  } else {
    console.log('❌ dist/ 目录不存在');
  }
  
  // 检查dist-electron目录
  if (fs.existsSync(distElectronPath)) {
    console.log('✅ dist-electron/ 目录存在');
    const electronFiles = fs.readdirSync(distElectronPath);
    console.log('  📄 dist-electron/ 内容:', electronFiles.join(', '));
  } else {
    console.log('❌ dist-electron/ 目录不存在');
  }
}

// 检查HTML文件内容
function checkHtmlContent() {
  console.log('\n📄 检查HTML文件内容:');
  console.log('─'.repeat(50));
  
  const htmlPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(htmlPath)) {
    const content = fs.readFileSync(htmlPath, 'utf-8');
    console.log('✅ index.html 存在');
    console.log('📝 HTML内容预览:');
    console.log(content.substring(0, 500) + '...');
    
    // 检查资源文件引用
    const assetMatches = content.match(/src="([^"]+)"/g);
    if (assetMatches) {
      console.log('\n🔗 引用的资源文件:');
      assetMatches.forEach(match => {
        const src = match.match(/src="([^"]+)"/)[1];
        console.log(`  - ${src}`);
        
        // 检查文件是否存在
        const assetPath = path.join(__dirname, '../dist', src);
        if (fs.existsSync(assetPath)) {
          console.log(`    ✅ 存在`);
        } else {
          console.log(`    ❌ 缺失`);
        }
      });
    }
  } else {
    console.log('❌ index.html 不存在');
  }
}

// 检查Electron主进程代码
function checkElectronMain() {
  console.log('\n⚡ 检查Electron主进程:');
  console.log('─'.repeat(50));
  
  const mainPath = path.join(__dirname, '../dist-electron/main.js');
  if (fs.existsSync(mainPath)) {
    const content = fs.readFileSync(mainPath, 'utf-8');
    console.log('✅ main.js 存在');
    
    // 检查关键路径
    const pathMatches = content.match(/loadFile\([^)]+\)/g);
    if (pathMatches) {
      console.log('🔗 文件加载路径:');
      pathMatches.forEach(match => {
        console.log(`  - ${match}`);
      });
    }
  } else {
    console.log('❌ main.js 不存在');
  }
}

// 生成调试版本的主进程文件
function generateDebugMain() {
  console.log('\n🛠️ 生成调试版本主进程:');
  console.log('─'.repeat(50));
  
  const debugMainContent = `const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

// 开发环境标识
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: '知识库管理',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 临时禁用web安全以调试
    }
  })

  // 添加错误处理和调试信息
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('页面加载失败:', {
      errorCode,
      errorDescription,
      validatedURL
    })
  })

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM已准备就绪')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成')
  })

  // 加载应用
  if (isDev) {
    console.log('开发模式：加载 http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式：尝试多个可能的路径
    const possiblePaths = [
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, './dist/index.html'),
      path.join(__dirname, 'index.html'),
      path.join(process.resourcesPath, 'app/dist/index.html'),
      path.join(app.getAppPath(), 'dist/index.html')
    ]
    
    console.log('生产模式：尝试加载文件')
    console.log('可能的路径:', possiblePaths)
    
    let loaded = false
    for (const filePath of possiblePaths) {
      if (require('fs').existsSync(filePath)) {
        console.log('找到文件，加载:', filePath)
        mainWindow.loadFile(filePath)
        loaded = true
        break
      }
    }
    
    if (!loaded) {
      console.error('所有路径都未找到文件')
      mainWindow.loadURL('data:text/html,<h1>文件未找到</h1><p>请检查构建配置</p>')
    }
    
    // 打开开发者工具用于调试
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  console.log('Electron应用启动')
  
  // 隐藏默认菜单栏（macOS 除外）
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
  } else {
    // macOS 设置简化的菜单
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about', label: '关于' },
          { type: 'separator' },
          { role: 'hide', label: '隐藏' },
          { role: 'hideOthers', label: '隐藏其他' },
          { role: 'unhide', label: '显示全部' },
          { type: 'separator' },
          { role: 'quit', label: '退出' }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { role: 'selectAll', label: '全选' }
        ]
      },
      {
        label: '窗口',
        submenu: [
          { role: 'minimize', label: '最小化' },
          { role: 'zoom', label: '缩放' },
          { role: 'close', label: '关闭' }
        ]
      }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
`;

  const debugMainPath = path.join(__dirname, '../electron-main-debug.js');
  fs.writeFileSync(debugMainPath, debugMainContent);
  console.log('✅ 已生成调试版本主进程文件: electron-main-debug.js');
}

// 生成问题排查指南
function generateTroubleshootingGuide() {
  const guide = `
# Electron应用空白问题排查指南

## 🔍 问题现象
- 开发模式 (npm run dev) 正常运行
- 打包后 (npm run build:mac) 应用显示空白
- 没有任何错误提示

## 🛠️ 排查步骤

### 1. 检查构建文件
\`\`\`bash
# 检查dist目录
ls -la dist/

# 检查dist-electron目录  
ls -la dist-electron/

# 检查HTML文件
cat dist/index.html
\`\`\`

### 2. 使用调试版本
\`\`\`bash
# 使用调试版本的主进程文件
cp electron-main-debug.js dist-electron/main.js

# 重新构建
npm run build:mac

# 安装并运行，查看控制台输出
\`\`\`

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
\`\`\`json
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
\`\`\`

#### 方案2: 使用调试版本主进程
使用生成的 \`electron-main-debug.js\` 文件，它会：
- 显示详细的加载信息
- 尝试多个可能的文件路径
- 自动打开开发者工具
- 提供详细的错误信息

#### 方案3: 手动测试文件路径
\`\`\`bash
# 在应用目录中检查文件
cd /Applications/知识库管理.app/Contents/Resources/app/
find . -name "index.html"
\`\`\`

## 📋 下一步操作

1. 运行调试版本，查看控制台输出
2. 根据错误信息调整文件路径
3. 确保所有资源文件都被正确包含
4. 测试修复后的版本

## 🔧 快速修复命令

\`\`\`bash
# 1. 使用调试版本
cp electron-main-debug.js dist-electron/main.js

# 2. 重新构建
npm run build:mac

# 3. 安装测试
open release/*.dmg
\`\`\`
`;

  const guidePath = path.join(__dirname, '../ELECTRON_TROUBLESHOOTING.md');
  fs.writeFileSync(guidePath, guide);
  console.log('✅ 已生成问题排查指南: ELECTRON_TROUBLESHOOTING.md');
}

// 主函数
function main() {
  checkBuildFiles();
  checkHtmlContent();
  checkElectronMain();
  generateDebugMain();
  generateTroubleshootingGuide();
  
  console.log('\n🎉 问题排查完成！');
  console.log('\n📋 下一步操作:');
  console.log('1. 查看 ELECTRON_TROUBLESHOOTING.md 获取详细指南');
  console.log('2. 使用 electron-main-debug.js 替换主进程文件');
  console.log('3. 重新构建应用并查看调试信息');
  console.log('4. 根据控制台输出调整配置');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { checkBuildFiles, checkHtmlContent, generateDebugMain };
