#!/bin/bash

# 简化部署脚本
set -e

echo "🚀 开始简化部署..."

# 1. 检查React打包文件
if [ ! -f "../army-yorozuya/dist/index.html" ]; then
    echo "❌ 打包文件不存在，请先运行 npm run build"
    exit 1
fi

echo "✅ React打包文件验证通过"

# 2. 停止现有容器
echo "🛑 停止现有容器..."
sudo docker stop army-yorozuya-nginx-prod 2>/dev/null || true
sudo docker rm army-yorozuya-nginx-prod 2>/dev/null || true

# 3. 使用现有镜像或快速构建
echo "🔨 准备Docker镜像..."

# 创建临时目录
TEMP_DIR=$(mktemp -d)
cp nginx-http.conf $TEMP_DIR/
cp -r ../army-yorozuya/dist $TEMP_DIR/dist

# 创建简化的Dockerfile
cat > $TEMP_DIR/Dockerfile << 'EOF'
FROM nginx:alpine

# 复制配置文件
COPY nginx-http.conf /etc/nginx/nginx.conf

# 复制打包文件
COPY dist /usr/share/nginx/html/army-yorozuya

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# 4. 构建镜像
cd $TEMP_DIR
sudo docker build -t army-yorozuya-nginx:simple .

# 5. 运行容器
echo "🚢 启动容器..."
sudo docker run -d \
    --name army-yorozuya-nginx-prod \
    -p 80:80 \
    army-yorozuya-nginx:simple

# 6. 清理临时目录
cd -
rm -rf $TEMP_DIR

# 7. 快速验证
echo "🔍 快速验证..."
sleep 2

# 检查容器
if sudo docker ps | grep -q "army-yorozuya-nginx-prod"; then
    echo "✅ 容器运行状态: 正常"
else
    echo "❌ 容器启动失败"
    exit 1
fi

echo ""
echo "🎉 简化部署完成！"
echo ""
echo "⚠️ 注意: 此部署使用HTTP-only，无SSL证书"
echo "🌐 访问地址: http://localhost"
echo ""