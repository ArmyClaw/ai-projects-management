# Nginx反向代理配置

为ArmyYorozuya项目提供HTTP/HTTPS反向代理服务，将外部请求代理到React开发服务器。

## 功能特性

- ✅ HTTP (端口80) 自动重定向到 HTTPS (端口443)
- ✅ HTTPS支持（使用自签名证书）
- ✅ 反向代理到React开发服务器（端口5173）
- ✅ WebSocket支持（用于热重载）
- ✅ 静态文件缓存优化
- ✅ Docker容器化部署

## 项目结构

```
nginx/
├── Dockerfile          # Docker构建文件
├── docker-compose.yml  # Docker Compose配置
├── nginx.conf         # Nginx主配置文件
└── README.md          # 说明文档
```

## 快速开始

### 1. 构建并启动容器

```bash
# 使用docker-compose启动
docker-compose up -d --build

# 或者直接使用docker
docker build -t army-yorozuya-nginx .
docker run -d -p 80:80 -p 443:443 --name army-yorozuya-nginx army-yorozuya-nginx
```

### 2. 访问应用

- **HTTPS**: https://localhost
- **HTTP**: http://localhost (自动重定向到HTTPS)

> ⚠️ 注意：由于使用自签名证书，浏览器会显示安全警告。在开发环境中可以安全地点击"继续访问"或"高级"→"继续前往localhost"。

### 3. 停止容器

```bash
# 使用docker-compose
docker-compose down

# 或者直接使用docker
docker stop army-yorozuya-nginx
docker rm army-yorozuya-nginx
```

## 配置说明

### 端口映射
- `80:80` - HTTP端口
- `443:443` - HTTPS端口

### 代理目标
默认代理到 `http://host.docker.internal:5173`，这是React开发服务器的地址。

### SSL证书
使用自签名证书，位于容器内的 `/etc/nginx/ssl/` 目录：
- `localhost.crt` - SSL证书
- `localhost.key` - 私钥

### 自定义配置

#### 使用自定义SSL证书
1. 将你的证书文件放入 `ssl/` 目录：
   - `ssl/localhost.crt`
   - `ssl/localhost.key`
2. 取消docker-compose.yml中的注释：
   ```yaml
   volumes:
     - ./ssl:/etc/nginx/ssl
   ```

#### 使用自定义nginx配置
1. 修改 `nginx.conf` 文件
2. 取消docker-compose.yml中的注释：
   ```yaml
   volumes:
     - ./nginx.conf:/etc/nginx/nginx.conf:ro
   ```

## 开发工作流

1. **启动React开发服务器**：
   ```bash
   cd ../army-yorozuya
   npm run dev
   ```

2. **启动Nginx代理**：
   ```bash
   cd ../nginx
   docker-compose up -d
   ```

3. **访问应用**：
   - 打开浏览器访问 https://localhost
   - 所有修改都会实时热重载

## 故障排除

### 1. 端口被占用
如果80或443端口已被占用：
```bash
# 查看占用端口的进程
sudo lsof -i :80
sudo lsof -i :443

# 或者修改docker-compose.yml中的端口映射
ports:
  - "8080:80"
  - "8443:443"
```

### 2. 无法连接到React服务器
确保React开发服务器正在运行：
```bash
cd ../army-yorozuya
npm run dev
```

### 3. SSL证书警告
这是正常的，因为使用的是自签名证书。在开发环境中可以安全忽略。

### 4. Docker网络问题
如果 `host.docker.internal` 无法解析，可以尝试：
```bash
# 查看容器IP
docker inspect army-yorozuya-nginx | grep IPAddress

# 或者使用宿主机IP
# 修改nginx.conf中的proxy_pass：
# proxy_pass http://172.17.0.1:5173;
```

## 生产环境建议

对于生产环境，建议：

1. **使用真实SSL证书**（如Let's Encrypt）
2. **配置域名**（修改server_name）
3. **启用安全头**（如HSTS、CSP）
4. **配置日志轮转**
5. **设置监控和告警**

## 相关项目

- [ArmyYorozuya React前端](../army-yorozuya/) - React应用项目
- [Nginx官方文档](https://nginx.org/en/docs/) - Nginx详细文档