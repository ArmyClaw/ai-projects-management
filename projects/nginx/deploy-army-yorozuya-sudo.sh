#!/bin/bash

# Army Yorozuya 部署脚本 (sudo版本)
set -e

echo "🚀 开始部署 Army Yorozuya 网站 (sudo权限)..."

# 检查是否已有运行中的容器
echo "📦 检查现有容器..."
if sudo docker ps -a --filter "name=army-yorozuya-nginx-prod" --format "{{.Names}}" | grep -q "army-yorozuya-nginx-prod"; then
    echo "🔄 停止并移除现有容器..."
    sudo docker stop army-yorozuya-nginx-prod > /dev/null 2>&1 || true
    sudo docker rm army-yorozuya-nginx-prod > /dev/null 2>&1 || true
fi

# 构建Docker镜像
echo "🔨 构建Docker镜像..."
cd "$(dirname "$0")"
sudo docker build -f Dockerfile-army-yorozuya -t army-yorozuya-nginx:latest .

# 运行容器
echo "🚢 启动容器..."
sudo docker run -d \
    --name army-yorozuya-nginx-prod \
    -p 80:80 \
    -p 443:443 \
    --restart unless-stopped \
    army-yorozuya-nginx:latest

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 3

# 检查容器状态
echo "🔍 检查部署状态..."
if sudo docker ps --filter "name=army-yorozuya-nginx-prod" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ 部署成功！"
    echo ""
    echo "🌐 访问地址:"
    echo "   HTTP:  http://localhost (自动重定向到HTTPS)"
    echo "   HTTPS: https://localhost"
    echo ""
    echo "⚠️  注意: 由于使用自签名证书，浏览器会显示安全警告，这是正常现象。"
    echo "     在开发环境中可以安全地点击'继续访问'或'高级->继续访问'。"
    echo ""
    echo "📊 容器状态:"
    sudo docker ps --filter "name=army-yorozuya-nginx-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📝 查看日志: sudo docker logs army-yorozuya-nginx-prod"
    echo "🛑 停止服务: sudo docker stop army-yorozuya-nginx-prod"
    echo "▶️  启动服务: sudo docker start army-yorozuya-nginx-prod"
    echo "🗑️  删除服务: sudo docker rm -f army-yorozuya-nginx-prod"
else
    echo "❌ 部署失败，请检查日志:"
    sudo docker logs army-yorozuya-nginx-prod
    exit 1
fi