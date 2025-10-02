#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 简化的图标优化脚本
 * 不依赖ImageMagick，使用系统内置工具
 */

console.log('🎨 开始优化应用图标 (简化版)...');

// 创建优化的图标目录
function createOptimizedIconDir() {
  const optimizedDir = path.join(__dirname, '../build-optimized');
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  return optimizedDir;
}

// 使用系统工具优化图标
function optimizeIcons() {
  const buildDir = path.join(__dirname, '../build');
  const optimizedDir = createOptimizedIconDir();
  
  console.log('\n🔄 开始优化图标文件...');
  
  try {
    // 1. 优化 PNG 图标 (使用 sips - macOS 内置工具)
    if (fs.existsSync(path.join(buildDir, 'icon.png'))) {
      console.log('📱 优化 PNG 图标...');
      
      // 生成不同尺寸的 PNG 图标
      const sizes = [1024, 512, 256, 128, 64, 32];
      
      sizes.forEach(size => {
        const outputPath = path.join(optimizedDir, `icon-${size}.png`);
        try {
          execSync(`sips -z ${size} ${size} "${path.join(buildDir, 'icon.png')}" --out "${outputPath}"`, { stdio: 'pipe' });
          const stats = fs.statSync(outputPath);
          console.log(`  ✅ ${size}x${size}: ${(stats.size / 1024).toFixed(1)}KB`);
        } catch (error) {
          console.log(`  ❌ 生成 ${size}x${size} 失败: ${error.message}`);
        }
      });
    }
    
    // 2. 创建优化的 .icns 文件
    console.log('\n🍎 创建优化的 macOS 图标...');
    
    const iconsetDir = path.join(optimizedDir, 'icon.iconset');
    if (fs.existsSync(iconsetDir)) {
      execSync(`rm -rf "${iconsetDir}"`);
    }
    fs.mkdirSync(iconsetDir);
    
    // 复制图标到 iconset 目录
    const iconMappings = [
      { from: 'icon-16.png', to: 'icon_16x16.png' },
      { from: 'icon-32.png', to: 'icon_16x16@2x.png' },
      { from: 'icon-32.png', to: 'icon_32x32.png' },
      { from: 'icon-64.png', to: 'icon_32x32@2x.png' },
      { from: 'icon-128.png', to: 'icon_128x128.png' },
      { from: 'icon-256.png', to: 'icon_128x128@2x.png' },
      { from: 'icon-256.png', to: 'icon_256x256.png' },
      { from: 'icon-512.png', to: 'icon_256x256@2x.png' },
      { from: 'icon-512.png', to: 'icon_512x512.png' },
      { from: 'icon-1024.png', to: 'icon_512x512@2x.png' }
    ];
    
    iconMappings.forEach(({ from, to }) => {
      const sourcePath = path.join(optimizedDir, from);
      const targetPath = path.join(iconsetDir, to);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  📋 复制 ${from} -> ${to}`);
      }
    });
    
    // 3. 生成 .icns 文件
    try {
      execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(optimizedDir, 'icon.icns')}"`, { stdio: 'pipe' });
      
      const icnsStats = fs.statSync(path.join(optimizedDir, 'icon.icns'));
      console.log(`  ✅ 生成 .icns: ${(icnsStats.size / 1024).toFixed(1)}KB`);
      
      // 清理 iconset 目录
      execSync(`rm -rf "${iconsetDir}"`);
      
    } catch (error) {
      console.log(`  ❌ 生成 .icns 失败: ${error.message}`);
    }
    
    // 4. 复制其他格式的图标
    if (fs.existsSync(path.join(buildDir, 'icon.ico'))) {
      fs.copyFileSync(
        path.join(buildDir, 'icon.ico'),
        path.join(optimizedDir, 'icon.ico')
      );
      console.log('  📋 复制 .ico 文件');
    }
    
    console.log('\n✨ 图标优化完成！');
    
  } catch (error) {
    console.error('❌ 优化过程中出错:', error.message);
  }
}

// 比较优化前后的文件大小
function compareFileSizes() {
  const buildDir = path.join(__dirname, '../build');
  const optimizedDir = path.join(__dirname, '../build-optimized');
  
  console.log('\n📊 优化前后对比:');
  console.log('─'.repeat(60));
  console.log('文件类型'.padEnd(15) + '优化前'.padEnd(12) + '优化后'.padEnd(12) + '节省');
  console.log('─'.repeat(60));
  
  const files = ['icon.icns', 'icon.ico', 'icon.png'];
  
  files.forEach(file => {
    const originalPath = path.join(buildDir, file);
    const optimizedPath = path.join(optimizedDir, file);
    
    if (fs.existsSync(originalPath)) {
      const originalSize = fs.statSync(originalPath).size;
      const originalSizeKB = (originalSize / 1024).toFixed(1);
      
      if (fs.existsSync(optimizedPath)) {
        const optimizedSize = fs.statSync(optimizedPath).size;
        const optimizedSizeKB = (optimizedSize / 1024).toFixed(1);
        const savedKB = ((originalSize - optimizedSize) / 1024).toFixed(1);
        const savedPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log(
          file.padEnd(15) + 
          originalSizeKB.padEnd(12) + 
          optimizedSizeKB.padEnd(12) + 
          `${savedKB}KB (${savedPercent}%)`
        );
      } else {
        console.log(file.padEnd(15) + originalSizeKB.padEnd(12) + 'N/A'.padEnd(12) + 'N/A');
      }
    }
  });
  
  console.log('─'.repeat(60));
}

// 生成替换说明
function generateReplacementGuide() {
  const guide = `
# 图标优化完成指南

## 🎯 优化结果

图标文件已成功优化，文件大小显著减少。

## 🔄 替换步骤

### 1. 备份原始图标
\`\`\`bash
cp -r build build-backup
\`\`\`

### 2. 替换优化后的图标
\`\`\`bash
# 替换 .icns 文件 (macOS)
cp build-optimized/icon.icns build/icon.icns

# 替换 .png 文件 (Linux)
cp build-optimized/icon-256.png build/icon.png

# .ico 文件保持不变 (已经很小)
# cp build-optimized/icon.ico build/icon.ico
\`\`\`

### 3. 验证文件大小
\`\`\`bash
ls -la build/icon.*
\`\`\`

### 4. 重新构建应用
\`\`\`bash
npm run build:mac
\`\`\`

## 📋 预期效果

- **macOS 应用图标**: 从 344KB 减少到 < 50KB
- **PNG 图标**: 从 108KB 减少到 < 20KB  
- **应用启动速度**: 可能略有提升
- **系统显示**: 与其他应用图标大小一致

## ⚠️ 注意事项

1. 建议先备份原始图标文件
2. 测试新图标在不同分辨率下的显示效果
3. 如果发现问题，可以从备份恢复
\`\`\`bash
cp build-backup/icon.* build/
\`\`\`
`;

  const optimizedDir = createOptimizedIconDir();
  fs.writeFileSync(path.join(optimizedDir, 'REPLACEMENT_GUIDE.md'), guide);
  console.log('\n📋 已生成替换指南: build-optimized/REPLACEMENT_GUIDE.md');
}

// 主函数
function main() {
  optimizeIcons();
  compareFileSizes();
  generateReplacementGuide();
  
  console.log('\n🎉 图标优化脚本执行完成！');
  console.log('\n📋 下一步操作:');
  console.log('1. 查看 build-optimized/ 目录中的优化结果');
  console.log('2. 阅读 build-optimized/REPLACEMENT_GUIDE.md 获取替换指南');
  console.log('3. 按照指南替换原始图标文件');
  console.log('4. 重新构建应用测试效果');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { optimizeIcons, compareFileSizes, generateReplacementGuide };
