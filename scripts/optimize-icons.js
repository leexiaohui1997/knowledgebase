#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 图标优化脚本
 * 用于生成标准尺寸的应用图标，减少文件大小
 */

console.log('🎨 开始优化应用图标...');

// 标准图标尺寸配置
const iconSizes = {
  // macOS 应用图标标准尺寸
  macos: [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' }
  ],
  
  // Windows 应用图标标准尺寸
  windows: [
    { size: 16, name: 'icon_16x16.png' },
    { size: 24, name: 'icon_24x24.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 48, name: 'icon_48x48.png' },
    { size: 64, name: 'icon_64x64.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_256x256.png' }
  ],
  
  // Linux 应用图标标准尺寸
  linux: [
    { size: 16, name: 'icon_16x16.png' },
    { size: 24, name: 'icon_24x24.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 48, name: 'icon_48x48.png' },
    { size: 64, name: 'icon_64x64.png' },
    { size: 96, name: 'icon_96x96.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_512x512.png' }
  ]
};

// 创建优化的图标目录
function createOptimizedIconDir() {
  const optimizedDir = path.join(__dirname, '../build-optimized');
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  return optimizedDir;
}

// 生成图标尺寸说明文件
function generateIconSpecs() {
  const specs = `
# 优化后的图标规格

## 目标文件大小
- **macOS .icns**: < 50KB (当前: 344KB)
- **Windows .ico**: < 10KB (当前: 6.8KB ✓)
- **Linux .png**: < 20KB (当前: 110KB)

## 推荐图标尺寸
- **应用图标**: 256x256px (足够清晰，文件小)
- **启动器图标**: 128x128px
- **系统托盘**: 32x32px 或 48x48px

## 优化建议
1. 使用 256x256px 作为主要图标尺寸
2. 移除不必要的超高分辨率版本
3. 优化 PNG 压缩率
4. 确保图标在不同尺寸下都清晰可见

## 生成命令 (需要 ImageMagick)
\`\`\`bash
# 安装 ImageMagick
brew install imagemagick

# 生成优化的 PNG 图标
convert build/icon.png -resize 256x256 build-optimized/icon-256.png
convert build/icon.png -resize 128x128 build-optimized/icon-128.png
convert build/icon.png -resize 64x64 build-optimized/icon-64.png
convert build/icon.png -resize 32x32 build-optimized/icon-32.png

# 生成优化的 macOS .icns (需要 iconutil)
# 创建 iconset 目录
mkdir build-optimized/icon.iconset

# 复制各种尺寸的图标到 iconset
cp build-optimized/icon-16.png build-optimized/icon.iconset/icon_16x16.png
cp build-optimized/icon-32.png build-optimized/icon.iconset/icon_16x16@2x.png
cp build-optimized/icon-32.png build-optimized/icon.iconset/icon_32x32.png
cp build-optimized/icon-64.png build-optimized/icon.iconset/icon_32x32@2x.png
cp build-optimized/icon-128.png build-optimized/icon.iconset/icon_128x128.png
cp build-optimized/icon-256.png build-optimized/icon.iconset/icon_128x128@2x.png
cp build-optimized/icon-256.png build-optimized/icon.iconset/icon_256x256.png
cp build-optimized/icon-512.png build-optimized/icon.iconset/icon_256x256@2x.png
cp build-optimized/icon-512.png build-optimized/icon.iconset/icon_512x512.png
cp build-optimized/icon-1024.png build-optimized/icon.iconset/icon_512x512@2x.png

# 生成 .icns 文件
iconutil -c icns build-optimized/icon.iconset -o build-optimized/icon.icns

# 清理临时文件
rm -rf build-optimized/icon.iconset
\`\`\`
`;

  const optimizedDir = createOptimizedIconDir();
  fs.writeFileSync(path.join(optimizedDir, 'ICON_OPTIMIZATION_GUIDE.md'), specs);
  console.log('📋 已生成图标优化指南: build-optimized/ICON_OPTIMIZATION_GUIDE.md');
}

// 检查当前图标文件大小
function analyzeCurrentIcons() {
  const buildDir = path.join(__dirname, '../build');
  const files = ['icon.icns', 'icon.ico', 'icon.png'];
  
  console.log('\n📊 当前图标文件分析:');
  console.log('─'.repeat(50));
  
  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const status = getSizeStatus(file, stats.size);
      console.log(`${file.padEnd(12)} ${sizeKB.padStart(8)}KB ${status}`);
    }
  });
  
  console.log('─'.repeat(50));
}

function getSizeStatus(filename, sizeBytes) {
  const sizeKB = sizeBytes / 1024;
  
  if (filename === 'icon.icns') {
    if (sizeKB > 100) return '🔴 过大 (>100KB)';
    if (sizeKB > 50) return '🟡 偏大 (>50KB)';
    return '🟢 正常';
  }
  
  if (filename === 'icon.png') {
    if (sizeKB > 50) return '🔴 过大 (>50KB)';
    if (sizeKB > 20) return '🟡 偏大 (>20KB)';
    return '🟢 正常';
  }
  
  if (filename === 'icon.ico') {
    if (sizeKB > 20) return '🔴 过大 (>20KB)';
    if (sizeKB > 10) return '🟡 偏大 (>10KB)';
    return '🟢 正常';
  }
  
  return '✅';
}

// 主函数
function main() {
  console.log('🔍 分析当前图标文件...');
  analyzeCurrentIcons();
  
  console.log('\n📝 生成优化指南...');
  generateIconSpecs();
  
  console.log('\n✨ 图标优化分析完成！');
  console.log('\n📋 下一步操作:');
  console.log('1. 查看 build-optimized/ICON_OPTIMIZATION_GUIDE.md 获取详细指南');
  console.log('2. 安装 ImageMagick: brew install imagemagick');
  console.log('3. 运行优化命令生成新图标');
  console.log('4. 替换 build/ 目录中的图标文件');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { iconSizes, analyzeCurrentIcons, generateIconSpecs };
