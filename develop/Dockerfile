# 多阶段构建 Dockerfile
# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖
COPY frontend/package*.json ./
RUN npm ci

# 复制前端源代码
COPY frontend/ .

# 构建前端
ARG VITE_API_BASE_URL
ARG VITE_GITHUB_CLIENT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_GITHUB_CLIENT_ID=${VITE_GITHUB_CLIENT_ID}

RUN npm run build

# 阶段2: 构建后端
FROM node:20-alpine AS backend-builder

WORKDIR /app

# 复制后端依赖
COPY backend/package*.json ./
RUN npm ci

# 复制后端源代码
COPY backend/ .

# 构建后端（TypeScript 编译）
RUN npm run build

# 阶段3: 生产镜像
FROM node:20-alpine AS production

# 安装 dumb-init 用于信号转发
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/nginx.conf ./nginx.conf

# 复制后端构建产物和运行时文件
COPY --from=backend-builder /app/dist ./dist-server
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# 设置工作目录
WORKDIR /app/dist-server

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
