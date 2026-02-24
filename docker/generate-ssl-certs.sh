#!/bin/bash
# SSL证书生成脚本
# 用法: ./generate-ssl-certs.sh [domain]
# 默认域名为 localhost

DOMAIN=${1:-localhost}
SSL_DIR="./docker/ssl"

# 创建SSL目录
mkdir -p "$SSL_DIR"

# 生成私钥
openssl genrsa -out "$SSL_DIR/key.pem" 2048

# 生成自签名证书
openssl req -new -x509 \
    -key "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -days 365 \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=AIProject/OU=Dev/CN=$DOMAIN"

echo "✅ SSL证书已生成:"
echo "   证书: $SSL_DIR/cert.pem"
echo "   私钥: $SSL_DIR/key.pem"
echo ""
echo "⚠️  注意: 这是自签名证书，仅用于开发/测试环境"
echo "   生产环境请使用 Let's Encrypt 或商业证书"
