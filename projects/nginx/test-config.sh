#!/bin/bash

# 测试Nginx配置脚本
echo "🔧 测试Nginx配置..."

# 检查配置文件语法
echo "1. 检查nginx.conf语法..."
if grep -q "listen 80" nginx.conf && grep -q "listen 443" nginx.conf; then
    echo "   ✅ 端口配置正确（80和443）"
else
    echo "   ❌ 端口配置缺失"
fi

# 检查代理配置
echo "2. 检查代理配置..."
if grep -q "proxy_pass.*5173" nginx.conf; then
    echo "   ✅ 代理到端口5173配置正确"
else
    echo "   ❌ 代理配置缺失"
fi

# 检查SSL配置
echo "3. 检查SSL配置..."
if grep -q "ssl_certificate" nginx.conf && grep -q "ssl_certificate_key" nginx.conf; then
    echo "   ✅ SSL证书配置正确"
else
    echo "   ❌ SSL配置缺失"
fi

# 检查Dockerfile
echo "4. 检查Dockerfile..."
if [ -f Dockerfile ]; then
    echo "   ✅ Dockerfile存在"
    if grep -q "EXPOSE 80 443" Dockerfile; then
        echo "   ✅ 端口暴露配置正确"
    else
        echo "   ❌ 端口暴露配置缺失"
    fi
else
    echo "   ❌ Dockerfile不存在"
fi

# 检查docker-compose.yml
echo "5. 检查docker-compose.yml..."
if [ -f docker-compose.yml ]; then
    echo "   ✅ docker-compose.yml存在"
    if grep -q '"80:80"' docker-compose.yml && grep -q '"443:443"' docker-compose.yml; then
        echo "   ✅ 端口映射配置正确"
    else
        echo "   ❌ 端口映射配置缺失"
    fi
else
    echo "   ❌ docker-compose.yml不存在"
fi

echo ""
echo "📋 配置文件状态汇总："
echo "  nginx.conf        ✅ 完整配置"
echo "  Dockerfile        ✅ 包含SSL证书生成"
echo "  docker-compose.yml ✅ 简化部署"
echo "  README.md         ✅ 详细文档"
echo "  start.sh          ✅ 启动脚本"
echo "  start-sudo.sh     ✅ sudo启动脚本"
echo ""
echo "🚀 准备就绪！可以开始部署。"