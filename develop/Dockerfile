# 多阶段构建优化版 Dockerfile
# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制并安装依赖（利用 Docker 缓存）
COPY frontend/package*.json ./
RUN npm ci && npm cache clean --force

# 复制源代码并构建
COPY frontend/ .
ARG VITE_API_BASE_URL
ARG VITE_GITHUB_CLIENT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_GITHUB_CLIENT_ID=${VITE_GITHUB_CLIENT_ID}

RUN npm run build

# 阶段2: 构建后端
FROM node:20-alpine AS backend-builder

WORKDIR /app

# 复制并安装依赖（利用 Docker 缓存）
COPY backend/package*.json ./
RUN npm ci && npm cache clean --force

# 复制源代码并构建
COPY backend/ .
RUN npm run build

# 阶段3: 生产镜像
FROM node:20-alpine AS production

# 安装 dumb-init 和 curl（用于健康检查）
RUN apk add --no-cache dumb-init curl

# 创建非 root 用户和组
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/nginx.conf ./nginx.conf

# 复制后端构建产物（只复制需要的内容，减少镜像大小）
COPY --from=backend-builder /app/dist ./dist-server
COPY --from=backend-builder /app/package*.json ./package.json

# 复制生产依赖（重新安装以确保干净的环境）
COPY --from=backend-builder /app/node_modules ./node_modules

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    PATH="/app/node_modules/.bin:$PATH"

# 创建日志目录
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查（使用 curl 更可靠）
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist-server/index.js"]
