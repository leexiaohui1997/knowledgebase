#!/usr/bin/env sh

# 部署到 GitHub Pages 脚本

# 确保脚本在遇到错误时停止
set -e

# 构建 Web 版本
echo "🔨 正在构建 Web 版本..."
npm run build:web

# 进入构建输出目录
cd dist-web

# 如果你要部署到自定义域名
# echo 'www.example.com' > CNAME

# 初始化 git 仓库（如果还没有）
git init
git add -A
git commit -m 'deploy: 部署到 GitHub Pages'

# 部署到 GitHub Pages
# 格式：git push -f git@github.com:<USERNAME>/<REPO>.git main:gh-pages
echo "🚀 正在部署到 GitHub Pages..."
git push -f git@github.com:leexiaohui1997/knowledgebase.git main:gh-pages

cd -

echo "✅ 部署完成！"
echo "📝 访问地址：https://leexiaohui1997.github.io/knowledgebase/"

