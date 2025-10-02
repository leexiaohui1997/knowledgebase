const { app, BrowserWindow, Menu } = require('electron')
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
