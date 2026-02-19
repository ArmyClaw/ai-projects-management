# AI Project Management Platform - 部署指南

## 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [部署模式](#部署模式)
- [详细配置](#详细配置)
- [环境变量](#环境变量)
- [管理命令](#管理命令)
- [监控与日志](#监控与日志)
- [故障排查](#故障排查)
- [生产环境配置](#生产环境配置)

---

## 简介

AI Project Management Platform 是一个基于 Docker 的一键部署解决方案，支持多种部署模式，满足从试用到生产环境的不同需求。

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.20+
- Docker 内存 ≥ 4GB (推荐 8GB+)
- 磁盘空间 ≥ 50GB (推荐 100GB+)

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/ArmyClaw/ai-projects-management.git
cd ai-projects-management/deploy

# 2. 选择部署模式
# 最小化部署 (推荐试用)
./deploy.sh demo

# 或标准部署 (推荐中小型市场)
./deploy.sh standard

# 或完整部署 (推荐生产环境)
./deploy.sh full
```

### 访问平台

部署完成后，访问：

| 服务 | 地址 | 默认账号 |
|------|------|---------|
| **Web** | http://localhost | - |
| **API** | http://localhost:3000 | - |
| **Grafana** | http://localhost:3001 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **MinIO** | http://localhost:9001 | minioadmin / minioadmin |

---

## 部署模式

### 1. Demo 模式 (最小化)

适合试用体验，仅包含核心服务。

```bash
./deploy.sh demo
```

**包含服务**:
- ✅ API (1 副本)
- ✅ Web (1 副本)
- ✅ PostgreSQL
- ✅ Redis
- ❌ Elasticsearch
- ❌ Kafka
- ❌ 监控组件

**资源要求**:
- CPU: 1 核
- 内存: 1GB
- 磁盘: 10GB

### 2. Standard 模式 (标准)

适合中小型市场，包含完整功能。

```bash
./deploy.sh standard
```

**包含服务**:
- ✅ API (2 副本)
- ✅ Web (1 副本)
- ✅ PostgreSQL
- ✅ Redis
- ✅ Elasticsearch
- ✅ Kafka
- ✅ MinIO
- ✅ Prometheus
- ✅ Grafana

**资源要求**:
- CPU: 2 核
- 内存: 4GB
- 磁盘: 50GB

### 3. Full 模式 (完整)

适合大型市场或生产环境。

```bash
./deploy.sh full
```

**包含服务**:
- ✅ API (3 副本)
- ✅ Web (2 副本)
- ✅ PostgreSQL
- ✅ Redis
- ✅ Elasticsearch
- ✅ Kafka
- ✅ MinIO
- ✅ Prometheus
- ✅ Grafana
- ✅ Loki
- ✅ Fluentd

**资源要求**:
- CPU: 4 核
- 内存: 8GB
- 磁盘: 100GB

### 4. AI 模式 (包含本地 AI)

包含本地 AI 模型 (需要 GPU)。

```bash
./deploy.sh ai
```

**包含额外服务**:
- ✅ Ollama (本地 LLM)
- ✅ Open WebUI

**资源要求**:
- CPU: 4 核
- 内存: 8GB
- GPU: NVIDIA (至少 8GB 显存)
- 磁盘: 200GB

---

## 详细配置

### SSL 证书配置

```bash
# 启用 HTTPS
./deploy.sh full --ssl

# 生产环境建议使用 Let's Encrypt
certbot certonly --standalone -d your-domain.com
# 复制证书到 config/ssl/
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem config/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem config/ssl/key.pem
```

### 域名配置

修改 `config/nginx/nginx.conf`:

```nginx
server_name your-domain.com;  # 替换为你的域名
```

### 端口配置

如果需要修改默认端口，编辑 `docker-compose.yml`:

```yaml
services:
  api:
    ports:
      - "your_port:3000"  # 修改 API 端口
  web:
    ports:
      - "your_port:80"    # 修改 Web 端口
```

---

## 环境变量

创建 `.env` 文件配置环境变量：

```bash
# 数据库
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ai_market

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# API
API_HOST=0.0.0.0
API_PORT=3000

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# 监控
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_password

# 时区
TZ=Asia/Shanghai
```

---

## 管理命令

### 服务管理

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f api      # API 日志
docker-compose logs -f web      # Web 日志
docker-compose logs -f db       # 数据库日志

# 重启服务
docker-compose restart api
docker-compose restart web
docker-compose restart

# 停止服务
docker-compose down

# 停止并删除数据 (危险!)
docker-compose down -v
```

### 备份与恢复

```bash
# 备份数据库
docker exec ai-market-db pg_dump -U user ai_market > backup.sql

# 恢复数据库
docker exec -i ai-market-db psql -U user ai_market < backup.sql

# 备份所有数据
tar -czvf backup-$(date +%Y%m%d).tar.gz data/

# 恢复数据
tar -xzvf backup-20240101.tar.gz
```

### 扩容

```bash
# 扩容 API 服务
docker-compose up -d --scale api=5

# 扩容 Worker
docker-compose up -d --scale celery-worker=5
```

---

## 监控与日志

### Prometheus 指标

访问 http://localhost:9090 查看监控指标。

**常用查询**:

```promql
# API 请求率
rate(api_requests_total[5m])

# API 响应时间
histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))

# 错误率
rate(api_requests_total{status=~"5.."}[5m])

# 活跃用户数
count(api_users{active=true})
```

### Grafana 仪表盘

访问 http://localhost:3001 查看预置仪表盘:

- **Overview**: 系统整体状态
- **API Performance**: API 性能监控
- **Business Metrics**: 业务指标
- **Infrastructure**: 基础设施监控

### 日志查询

```bash
# 查看 API 错误日志
docker-compose logs -f api | grep ERROR

# 查看实时日志 (Fluentd + Loki)
# 访问 http://localhost:3100 使用 Loki 查询日志

# 导出最近 1 小时的日志
docker-compose logs --since 1h api > api-logs.txt
```

---

## 故障排查

### 常见问题

#### 1. 端口被占用

```bash
# 检查占用端口的进程
lsof -i :80

# 终止进程
kill <PID>
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker exec ai-market-db pg_isready -U user -d ai_market

# 查看数据库日志
docker-compose logs db
```

#### 3. 服务无法启动

```bash
# 查看详细错误
docker-compose up api

# 检查资源使用
docker stats
```

#### 4. 内存不足

```bash
# 查看内存使用
free -h

# 清理 Docker 资源
docker system prune -af
```

### 健康检查

```bash
# API 健康检查
curl http://localhost:3000/health

# Web 健康检查
curl http://localhost/health

# 数据库健康检查
docker exec ai-market-db pg_isready -U user
```

### 获取诊断信息

```bash
# 收集诊断信息
./diagnose.sh

# 输出包括:
# - Docker Compose 配置
# - 服务状态
# - 资源使用情况
# - 最近的错误日志
```

---

## 生产环境配置

### 1. 高可用配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.role == worker
    
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### 2. 外部数据库

生产环境建议使用托管数据库服务:

```yaml
# 使用外部 PostgreSQL
api:
  environment:
    - DATABASE_URL=postgresql://host:5432/ai_market
```

### 3. 外部 Redis

```yaml
# 使用外部 Redis
api:
  environment:
    - REDIS_URL=redis://your-redis-host:6379
```

### 4. SSL 生产配置

使用 Let's Encrypt 获取免费证书:

```bash
# 安装 Certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 配置续期
sudo crontab -e
0 0 * * * certbot renew --quiet
```

### 5. 备份策略

```bash
# 每天凌晨 2 点自动备份
0 2 * * * cd /path/to/deploy && \
  docker exec ai-market-db pg_dump -U user ai_market | \
  gzip > /backup/ai_market_$(date +\%Y\%m\%d).sql.gz
```

### 6. 监控告警

配置 Grafana 告警:

```yaml
# grafana/provisioning/notifications/alertmanager.yml
apiVersion: 1

notifiers:
  - name: Slack
    type: slack
    settings:
      url: https://hooks.slack.com/services/xxx/xxx/xxx
```

---

## 技术栈

### 核心组件

| 组件 | 版本 | 用途 |
|------|------|------|
| **Python/FastAPI** | 3.11 | 后端 API |
| **React/Next.js** | 14 | 前端 Web |
| **PostgreSQL** | 15 | 主数据库 |
| **Redis** | 7 | 缓存 |
| **Elasticsearch** | 8.11 | 搜索 |
| **Qdrant** | 1.7 | 向量数据库 |
| **Kafka** | 7.5 | 消息队列 |
| **MinIO** | RELEASE | 对象存储 |

### 监控组件

| 组件 | 版本 | 用途 |
|------|------|------|
| **Prometheus** | 2.48 | 指标监控 |
| **Grafana** | 10.2 | 可视化 |
| **Loki** | 2.9 | 日志聚合 |
| **Fluentd** | 1.16 | 日志收集 |

---

## 目录结构

```
deploy/
├── docker-compose.yml          # 主配置文件
├── deploy.sh                   # 一键部署脚本
├── .env                        # 环境变量 (自动生成)
├── config/
│   ├── nginx/
│   │   └── nginx.conf         # Nginx 配置
│   ├── ssl/                    # SSL 证书
│   └── monitoring/
│       ├── prometheus/
│       │   └── prometheus.yml  # Prometheus 配置
│       └── grafana/
│           └── provisioning/   # Grafana 配置
├── data/                       # 数据目录 (自动创建)
└── diagnose.sh                # 诊断脚本
```

---

## 更新升级

### 1. 小版本更新

```bash
git pull
./deploy.sh full  # 使用相同部署模式
```

### 2. 大版本升级

```bash
# 备份数据
./deploy.sh backup

# 停止服务
docker-compose down

# 克隆新版本
git checkout <new-version>

# 重新部署
./deploy.sh <mode>
```

### 3. 回滚

```bash
# 回滚到上一版本
git checkout <previous-version>
docker-compose down
./deploy.sh <mode>
```

---

## 支持

### 文档

- [API 文档](http://localhost:3000/docs)
- [用户手册](./docs/user-guide.md)
- [开发者指南](./docs/developer-guide.md)

### 社区

- GitHub Issues: https://github.com/ArmyClaw/ai-projects-management/issues
- 讨论: https://github.com/ArmyClaw/ai-projects-management/discussions

---

## 许可证

本项目采用 MIT 许可证。
