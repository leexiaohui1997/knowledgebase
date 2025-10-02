
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
```bash
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
```
