#!/bin/bash

# Nginx停止脚本
set -e

echo "🛑 停止ArmyYorozuya Nginx反向代理..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

# 停止并移除容器
docker compose down

echo "✅ Nginx已停止！"
echo ""
echo "📊 当前运行容器："
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"