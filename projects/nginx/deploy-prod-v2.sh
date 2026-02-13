#!/bin/bash

# 部署生产环境脚本 v2
set -e

echo "🚀 开始部署army-yorozuya生产环境..."

# 1. 检查React项目是否存在
if [ ! -d "../army-yorozuya" ]; then
    echo "❌ React项目目录不存在: ../army-yorozuya"
    exit 1
fi

# 2. 检查打包目录是否存在
if [ ! -d "../army-yorozuya/dist" ]; then
    echo "📦 React项目未打包，开始打包..."
    cd ../army-yorozuya
    npm run build
    cd ../nginx
fi

# 3. 检查打包文件
if [ ! -f "../army-yorozuya/dist/index.html" ]; then
    echo "❌ 打包文件不存在，请先运行 npm run build"
    exit 1
fi

echo "✅ React打包文件验证通过"

# 4. 复制打包文件到当前目录
echo "📁 复制打包文件..."
rm -rf dist-temp
mkdir -p dist-temp
cp -r ../army-yorozuya/dist/* dist-temp/

# 5. 创建临时Dockerfile
echo "📝 创建临时Dockerfile..."
cat > Dockerfile-temp << 'EOF'
# 使用官方nginx镜像
FROM nginx:alpine

# 复制自定义配置文件
COPY nginx-prod.conf /etc/nginx/nginx.conf

# 创建SSL证书目录
RUN mkdir -p /etc/nginx/ssl

# 生成自签名SSL证书（用于开发环境）
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/localhost.key \
    -out /etc/nginx/ssl/localhost.crt \
    -subj "/C=CN/ST=Jiangsu/L=Nanjing/O=ArmyYorozuya/CN=army-yorozuya.art"

# 复制打包后的React应用
COPY dist-temp /usr/share/nginx/html/army-yorozuya

# 暴露端口
EXPOSE 80 443

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# 6. 停止现有容器
echo "🛑 停止现有容器..."
docker stop army-yorozuya-nginx-prod 2>/dev/null || true
docker rm army-yorozuya-nginx-prod 2>/dev/null || true

# 7. 构建Docker镜像
echo "🔨 构建Docker镜像..."
docker build -t army-yorozuya-nginx:prod -f Dockerfile-temp .

# 8. 运行容器
echo "🚢 启动容器..."
docker run -d \
    --name army-yorozuya-nginx-prod \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    army-yorozuya-nginx:prod

# 9. 验证部署
echo "🔍 验证部署..."
sleep 3

# 检查容器状态
if docker ps | grep -q "army-yorozuya-nginx-prod"; then
    echo "✅ 容器运行状态: 正常"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 测试HTTP重定向
echo "🌐 测试HTTP重定向..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_STATUS" = "301" ]; then
    echo "✅ HTTP重定向: 正常 (301)"
else
    echo "❌ HTTP重定向异常: $HTTP_STATUS"
fi

# 测试HTTPS访问
echo "🔒 测试HTTPS访问..."
HTTPS_STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost)
if [ "$HTTPS_STATUS" = "200" ]; then
    echo "✅ HTTPS访问: 正常 (200)"
else
    echo "❌ HTTPS访问异常: $HTTPS_STATUS"
fi

# 测试页面内容
echo "📄 测试页面内容..."
PAGE_TITLE=$(curl -s -k https://localhost | grep -o "<title>[^<]*</title>" | sed 's/<title>//;s/<\/title>//')
if [[ "$PAGE_TITLE" == *"Army's Yorozuya"* ]]; then
    echo "✅ 页面标题: $PAGE_TITLE"
else
    echo "❌ 页面标题异常: $PAGE_TITLE"
fi

# 清理临时文件
echo "🧹 清理临时文件..."
rm -f Dockerfile-temp
rm -rf dist-temp

echo ""
echo "🎉 部署完成！"
echo ""
echo "📊 部署状态:"
echo "  容器名称: army-yorozuya-nginx-prod"
echo "  镜像标签: army-yorozuya-nginx:prod"
echo "  端口映射: 80:80, 443:443"
echo "  重启策略: unless-stopped"
echo ""
echo "🌐 访问方式:"
echo "  HTTPS: https://localhost"
echo "  HTTP: http://localhost (自动重定向到HTTPS)"
echo ""
echo "🔧 管理命令:"
echo "  查看状态: docker ps | grep army-yorozuya"
echo "  查看日志: docker logs army-yorozuya-nginx-prod"
echo "  停止服务: docker stop army-yorozuya-nginx-prod"
echo "  启动服务: docker start army-yorozuya-nginx-prod"
echo "  重启服务: docker restart army-yorozuya-nginx-prod"
echo "  删除容器: docker rm -f army-yorozuya-nginx-prod"
echo ""