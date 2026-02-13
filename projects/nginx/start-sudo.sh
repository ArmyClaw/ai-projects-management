#!/bin/bash

# Nginx启动脚本（使用sudo）
set -e

echo "🚀 启动ArmyYorozuya Nginx反向代理（使用sudo）..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查docker compose是否可用
if ! sudo docker compose version &> /dev/null; then
    echo "❌ docker compose未安装，请安装Docker Compose插件"
    exit 1
fi

# 构建并启动容器
echo "📦 构建Docker镜像..."
sudo docker compose build

echo "🚢 启动容器..."
sudo docker compose up -d

echo "✅ Nginx已启动！"
echo ""
echo "📊 服务状态："
sudo docker compose ps
echo ""
echo "🌐 访问地址："
echo "  HTTPS: https://localhost"
echo "  HTTP:  http://localhost (自动重定向到HTTPS)"
echo ""
echo "⚠️  注意：由于使用自签名证书，浏览器会显示安全警告。"
echo "     在开发环境中可以安全地点击'继续访问'或'高级'→'继续前往localhost'"
echo ""
echo "📝 查看日志："
echo "  sudo docker compose logs -f"
echo ""
echo "🛑 停止服务："
echo "  sudo docker compose down"
echo ""
echo "💡 提示：要避免使用sudo，请将用户添加到docker组："
echo "  sudo usermod -aG docker \$USER"
echo "  newgrp docker"