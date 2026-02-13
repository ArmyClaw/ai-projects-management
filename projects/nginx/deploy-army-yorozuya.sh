#!/bin/bash

# Army Yorozuya 部署脚本
set -e

echo "🚀 开始部署 Army Yorozuya 网站..."

# 检查Docker权限
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker权限不足，请使用sudo运行此脚本"
    echo "    sudo $0"
    exit 1
fi

# 检查是否已有运行中的容器
echo "📦 检查现有容器..."
if docker ps -a --filter "name=army-yorozuya-nginx-prod" --format "{{.Names}}" | grep -q "army-yorozuya-nginx-prod"; then
    echo "🔄 停止并移除现有容器..."
    docker stop army-yorozuya-nginx-prod > /dev/null 2>&1 || true
    docker rm army-yorozuya-nginx-prod > /dev/null 2>&1 || true
fi

# 构建Docker镜像
echo "🔨 构建Docker镜像..."
cd "$(dirname "$0")"
docker build -f Dockerfile-army-yorozuya -t army-yorozuya-nginx:latest .

# 运行容器
echo "🚢 启动容器..."
docker run -d \
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
if docker ps --filter "name=army-yorozuya-nginx-prod" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ 部署成功！"
    echo ""
    echo "🌐 访问地址:"
    echo "   HTTP:  http://localhost (自动重定向到HTTPS)"
    echo "   HTTPS: https://localhost"
    echo ""
    echo "📊 容器状态:"
    docker ps --filter "name=army-yorozuya-nginx-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📝 查看日志: docker logs army-yorozuya-nginx-prod"
    echo "🛑 停止服务: docker stop army-yorozuya-nginx-prod"
    echo "▶️  启动服务: docker start army-yorozuya-nginx-prod"
    echo "🗑️  删除服务: docker rm -f army-yorozuya-nginx-prod"
else
    echo "❌ 部署失败，请检查日志:"
    docker logs army-yorozuya-nginx-prod
    exit 1
fi