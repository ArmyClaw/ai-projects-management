#!/bin/bash

# ============================================
# AI Project Management Platform - 一键部署脚本
# ============================================
#
# 支持的部署模式:
#   - demo:    最小化部署 (适合试用)
#   - standard: 标准部署 (适合中小型市场)
#   - full:    完整部署 (适合大型市场)
#   - ai:      包含本地 AI 模型
#
# 使用方法:
#   ./deploy.sh demo              # 最小化部署
#   ./deploy.sh standard          # 标准部署
#   ./deploy.sh full             # 完整部署
#   ./deploy.sh ai               # 包含 AI 模型
#   ./deploy.sh full --ssl       # 完整部署 + SSL
#
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
DEPLOY_MODE="demo"
WITH_SSL=false
WITH_AI=false
PROJECT_NAME="ai-market"
DATA_DIR="./data"
CONFIG_DIR="./config"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        demo|standard|full|ai)
            DEPLOY_MODE=$1
            shift
            ;;
        --ssl)
            WITH_SSL=true
            shift
            ;;
        --help|-h)
            echo "使用方法: $0 [模式] [选项]"
            echo ""
            echo "模式:"
            echo "  demo      最小化部署 (适合试用)"
            echo "  standard  标准部署 (适合中小型市场)"
            echo "  full      完整部署 (适合大型市场)"
            echo "  ai        包含本地 AI 模型"
            echo ""
            echo "选项:"
            echo "  --ssl     启用 SSL 证书 (需要域名)"
            echo "  --help    显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0 demo"
            echo "  $0 full --ssl"
            echo "  $0 ai"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 打印横幅
print_banner() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║     AI Project Management Platform - 一键部署脚本                   ║
    ║                                                                   ║
    ║     Deploy Mode: $DEPLOY_MODE                                       ║
    ║     With SSL: $WITH_SSL                                             ║
    ║     With AI: $WITH_AI                                               ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# 检查环境
check_environment() {
    echo -e "${YELLOW}📋 检查部署环境...${NC}"
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        echo "请先安装 Docker:"
        echo "  curl -fsSL https://get.docker.com | sh"
        echo "  sudo usermod -aG docker \$USER"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker 已安装${NC}"
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        echo "请先安装 Docker Compose:"
        echo "  sudo curl -L https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-\$(uname -s)-\$(uname -m) -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
    
    # 检查端口占用
    check_ports
    
    echo -e "${GREEN}✅ 环境检查通过${NC}"
}

# 检查端口
check_ports() {
    echo -e "${YELLOW}🔌 检查端口占用...${NC}"
    
    PORTS_TO_CHECK=("80" "443" "3000" "5432" "6379" "9200" "6333" "9090" "3001")
    
    for PORT in "${PORTS_TO_CHECK[@]}"; do
        if lsof -i :$PORT &> /dev/null; then
            echo -e "${YELLOW}⚠️  端口 $PORT 已被占用${NC}"
        fi
    done
}

# 准备目录
prepare_directories() {
    echo -e "${YELLOW}📁 准备目录...${NC}"
    
    mkdir -p $DATA_DIR/{postgres,redis,elasticsearch,qdrant,kafka,zookeeper,minio,prometheus,grafana,loki,api,web,worker}
    mkdir -p $CONFIG_DIR/{nginx,ssl,monitoring}
    
    echo -e "${GREEN}✅ 目录准备完成${NC}"
}

# 生成配置
generate_config() {
    echo -e "${YELLOW}⚙️  生成配置文件...${NC}"
    
    # 生成 .env 文件
    cat > .env << EOF
# ============================================
# AI Project Management Platform - 环境配置
# ============================================

# 部署模式
DEPLOY_MODE=$DEPLOY_MODE
WITH_SSL=$WITH_SSL

# 项目配置
PROJECT_NAME=$PROJECT_NAME
DATA_DIR=$DATA_DIR
CONFIG_DIR=$CONFIG_DIR

# 数据库配置
POSTGRES_USER=user
POSTGRES_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)
POSTGRES_DB=ai_market

# Redis 配置
REDIS_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)

# JWT 配置
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# API 配置
API_HOST=0.0.0.0
API_PORT=3000
WEB_PORT=80

# MinIO 配置
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# AI 配置 (可选)
OLLAMA_BASE_URL=http://ollama:11434
OPENWEBUI_URL=http://openwebui:7860

# 监控配置
PROMETHEUS_RETENTION=15d
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 12)

# 时区配置
TZ=Asia/Shanghai
EOF
    
    echo -e "${GREEN}✅ 配置文件生成完成${NC}"
}

# 生成 Nginx 配置
generate_nginx_config() {
    echo -e "${YELLOW}🌐 生成 Nginx 配置...${NC}"
    
    cat > $CONFIG_DIR/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # 日志格式
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    
    # 上传大小限制
    client_max_body_size 100M;
    
    # 代理超时
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    # API 服务
    upstream api {
        server api:3000;
        keepalive 64;
    }
    
    # Web 服务
    upstream web {
        server web:80;
        keepalive 32;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # 重定向到 HTTPS (如果启用 SSL)
        if ($WITH_SSL = "true") {
            return 301 https://\$host\$request_uri;
        }
        
        # 健康检查
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
        
        # API 代理
        location /api/ {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header Connection "";
            
            # WebSocket 支持
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Web 代理
        location / {
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
    
    # HTTPS 配置 (如果启用 SSL)
    if ($WITH_SSL = "true") {
        server {
            listen 443 ssl http2;
            server_name localhost;
            
            ssl_certificate /etc/nginx/ssl/cert.pem;
            ssl_certificate_key /etc/nginx/ssl/key.pem;
            ssl_session_timeout 1d;
            ssl_session_cache shared:SSL:50m;
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
            ssl_prefer_server_ciphers off;
            
            # 健康检查
            location /health {
                return 200 "OK";
                add_header Content-Type text/plain;
            }
            
            # API 代理
            location /api/ {
                proxy_pass http://api;
                proxy_http_version 1.1;
                proxy_set_header Host \$host;
                proxy_set_header X-Real-IP \$remote_addr;
                proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto \$scheme;
                proxy_set_header Connection "";
                
                proxy_set_header Upgrade \$http_upgrade;
                proxy_set_header Connection "upgrade";
            }
            
            # Web 代理
            location / {
                proxy_pass http://web;
                proxy_http_version 1.1;
                proxy_set_header Host \$host;
                proxy_set_header X-Real-IP \$remote_addr;
                proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto \$scheme;
            }
        }
    }
}
EOF
    
    echo -e "${GREEN}✅ Nginx 配置生成完成${NC}"
}

# 生成 SSL 证书 (自签名)
generate_ssl_cert() {
    if [ "$WITH_SSL" = "true" ]; then
        echo -e "${YELLOW}🔒 生成自签名 SSL 证书...${NC}"
        
        mkdir -p $CONFIG_DIR/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout $CONFIG_DIR/ssl/key.pem \
            -out $CONFIG_DIR/ssl/cert.pem \
            -subj "/C=CN/ST=Shanghai/L=Shanghai/O=AI Market/CN=localhost"
        
        echo -e "${GREEN}✅ SSL 证书生成完成${NC}"
    fi
}

# 生成 Prometheus 配置
generate_prometheus_config() {
    echo -e "${YELLOW}📊 生成 Prometheus 配置...${NC}"
    
    cat > $CONFIG_DIR/monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  # API 服务监控
  - job_name: 'ai-market-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: /metrics

  # PostgreSQL 监控
  - job_name: 'postgresql'
    static_configs:
      - targets: ['db:5432']

  # Redis 监控
  - job_name: 'redis'
    static_configs:
      - targets: ['cache:6379']

  # Nginx 监控
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']

  # Docker 监控
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
EOF
    
    echo -e "${GREEN}✅ Prometheus 配置生成完成${NC}"
}

# 生成 Grafana 配置
generate_grafana_config() {
    echo -e "${YELLOW}📈 生成 Grafana 配置...${NC}"
    
    mkdir -p $CONFIG_DIR/monitoring/grafana/provisioning/{datasources,dashboards}
    
    # Grafana 数据源配置
    cat > $CONFIG_DIR/monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF
    
    # Grafana 仪表盘配置
    cat > $CONFIG_DIR/monitoring/grafana/provisioning/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'AI Market'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
EOF
    
    echo -e "${GREEN}✅ Grafana 配置生成完成${NC}"
}

# 根据部署模式选择服务
select_services() {
    echo -e "${YELLOW}📦 选择部署服务...${NC}"
    
    case $DEPLOY_MODE in
        demo)
            # 最小化部署: 仅核心服务
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  api:
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  web:
    deploy:
      replicas: 1

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=ai_market

  cache:
    image: redis:7-alpine

  # 禁用以下服务
  elasticsearch:
    deploy:
      replicas: 0

  qdrant:
    deploy:
      replicas: 0

  kafka:
    deploy:
      replicas: 0

  zookeeper:
    deploy:
      replicas: 0

  minio:
    deploy:
      replicas: 0

  prometheus:
    deploy:
      replicas: 0

  grafana:
    deploy:
      replicas: 0

  loki:
    deploy:
      replicas: 0

  fluentd:
    deploy:
      replicas: 0

  celery-worker:
    deploy:
      replicas: 1

  celery-beat:
    deploy:
      replicas: 0
EOF
            ;;
        standard)
            # 标准部署: 核心 + 搜索
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  api:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G

  web:
    deploy:
      replicas: 1

  db:
    image: postgres:15-alpine

  cache:
    image: redis:7-alpine

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0

  qdrant:
    image: qdrant/qdrant:v1.7.0

  kafka:
    image: confluentinc/cp-kafka:7.5.0

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0

  minio:
    image: minio/minio:RELEASE.2024-01-01T00-00-00Z

  prometheus:
    deploy:
      replicas: 1

  grafana:
    deploy:
      replicas: 1

  loki:
    deploy:
      replicas: 0

  fluentd:
    deploy:
      replicas: 0

  celery-worker:
    deploy:
      replicas: 2

  celery-beat:
    deploy:
      replicas: 1
EOF
            ;;
        full)
            # 完整部署: 所有服务
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '4'
          memory: 4G

  web:
    deploy:
      replicas: 2

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"

  qdrant:
    image: qdrant/qdrant:v1.7.0

  kafka:
    image: confluentinc/cp-kafka:7.5.0

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0

  minio:
    image: minio/minio:RELEASE.2024-01-01T00-00-00Z

  nginx:
    image: nginx:alpine

  prometheus:
    image: prom/prometheus:v2.48.0

  grafana:
    image: grafana/grafana:10.2.0

  loki:
    image: grafana/loki:2.9.0

  fluentd:
    image: fluent/fluentd-kubernetes-daemonset:v1.16-debian-elasticsearch8-1

  celery-worker:
    deploy:
      replicas: 3

  celery-beat:
    deploy:
      replicas: 1
EOF
            ;;
        ai)
            # 包含 AI 模型
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  api:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G

  web:
    deploy:
      replicas: 1

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    volumes:
      - openwebui_data:/app/backend/data
EOF
            ;;
    esac
    
    echo -e "${GREEN}✅ 部署模式: $DEPLOY_MODE${NC}"
}

# 拉取并启动服务
start_services() {
    echo -e "${YELLOW}🚀 启动服务...${NC}"
    
    # 拉取镜像
    echo -e "${BLUE}📥 拉取 Docker 镜像...${NC}"
    docker-compose pull
    
    # 启动服务
    echo -e "${BLUE}▶️  启动容器...${NC}"
    docker-compose up -d
    
    echo -e "${GREEN}✅ 服务启动完成${NC}"
}

# 等待服务就绪
wait_for_services() {
    echo -e "${YELLOW}⏳ 等待服务就绪...${NC}"
    
    # 等待数据库就绪
    echo -e "${BLUE}等待数据库...${NC}"
    sleep 10
    until docker exec ai-market-db pg_isready -U user -d ai_market &> /dev/null; do
        echo -n "."
        sleep 2
    done
    echo -e "${GREEN}✅ 数据库就绪${NC}"
    
    # 等待 API 就绪
    echo -e "${BLUE}等待 API 服务...${NC}"
    until curl -sf http://localhost:3000/health &> /dev/null; do
        echo -n "."
        sleep 5
    done
    echo -e "${GREEN}✅ API 服务就绪${NC}"
    
    # 等待 Web 就绪
    echo -e "${BLUE}等待 Web 服务...${NC}"
    until curl -sf http://localhost/health &> /dev/null; do
        echo -n "."
        sleep 2
    done
    echo -e "${GREEN}✅ Web 服务就绪${NC}"
    
    echo -e "${GREEN}✅ 所有服务就绪${NC}"
}

# 初始化数据库
init_database() {
    echo -e "${YELLOW}🗃️  初始化数据库...${NC}"
    
    # 运行数据库迁移
    docker exec ai-market-api python manage.py migrate --noinput
    
    # 导入初始数据
    docker exec ai-market-api python manage.py loaddata initial_data.json
    
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
}

# 打印部署信息
print_deployment_info() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}║                   部署完成！🎉                              ║${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ "$WITH_SSL" = "true" ]; then
        echo -e "${GREEN}🌐 访问地址:${NC}"
        echo "   https://localhost"
    else
        echo -e "${GREEN}🌐 访问地址:${NC}"
        echo "   http://localhost"
    fi
    
    echo ""
    echo -e "${GREEN}🔧 管理地址:${NC}"
    echo "   API:    http://localhost:3000"
    echo "   Grafana: http://localhost:3001 (admin/admin123)"
    echo "   Prometheus: http://localhost:9090"
    echo "   MinIO: http://localhost:9001 (minioadmin/minioadmin)"
    
    echo ""
    echo -e "${GREEN}📋 管理命令:${NC}"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   重启服务: docker-compose restart"
    echo "   停止服务: docker-compose down"
    echo "   完全清理: docker-compose down -v"
    
    echo ""
    echo -e "${YELLOW}⚠️  重要提醒:${NC}"
    echo "   1. 请及时修改默认密码"
    echo "   2. 生产环境请配置正式的 SSL 证书"
    echo "   3. 建议定期备份数据"
    echo ""
}

# 主函数
main() {
    print_banner
    check_environment
    prepare_directories
    generate_config
    generate_nginx_config
    generate_ssl_cert
    generate_prometheus_config
    generate_grafana_config
    select_services
    start_services
    wait_for_services
    init_database
    print_deployment_info
}

# 执行主函数
main
