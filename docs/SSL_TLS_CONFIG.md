# SSL/TLS 配置说明

## 概述
本项目已配置 SSL/TLS 支持，支持自签名证书（开发环境）和 Let's Encrypt（生产环境）。

## 快速开始

### 1. 开发环境 (自签名证书)
```bash
# 证书已自动生成在 docker/ssl/ 目录
# 启动服务
docker-compose up -d
```

### 2. 生产环境 (Let's Encrypt)

#### 方式一: 使用 Certbot
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书 (替换 yourdomain.com)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 复制证书到项目
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./docker/ssl/key.pem
```

#### 方式二: 使用 Docker Let's Encrypt
```bash
# 使用 letsencrypt/nginx-proxy-companion
# 参考: https://github.com/nginx-proxy/docker-letsencrypt-nginx-proxy-companion
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| NGINX_HTTP_PORT | 80 | HTTP端口 |
| NGINX_HTTPS_PORT | 443 | HTTPS端口 |

## 证书位置
- 证书: `docker/ssl/cert.pem`
- 私钥: `docker/ssl/key.pem`

## 安全配置

### 已启用
- TLS 1.2 / 1.3
- 安全Cipher Suites
- HSTS (HTTP Strict Transport Security)
- 安全响应头 (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

### 生产环境建议
1. 定期更新证书 (Let's Encrypt 90天)
2. 使用 OCSP Stapling
3. 配置 Certificate Transparency
4. 启用 HTTP/2

## 测试
```bash
# 测试 HTTPS 连接
curl -k https://localhost

# 检查 SSL 等级
# 访问: https://www.ssllabs.com/ssltest/
```
