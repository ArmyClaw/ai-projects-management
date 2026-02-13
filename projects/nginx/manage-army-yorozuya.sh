#!/bin/bash

# Army Yorozuya 管理脚本
set -e

CONTAINER_NAME="army-yorozuya-nginx-prod"
IMAGE_NAME="army-yorozuya-nginx:latest"

show_help() {
    echo "Army Yorozuya 网站管理脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动网站服务"
    echo "  stop      停止网站服务"
    echo "  restart   重启网站服务"
    echo "  status    查看服务状态"
    echo "  logs      查看服务日志"
    echo "  rebuild   重新构建并部署"
    echo "  test      测试网站访问"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 status   # 查看状态"
    echo "  $0 test     # 测试访问"
}

check_sudo() {
    if ! sudo docker ps > /dev/null 2>&1; then
        echo "❌ 需要sudo权限来管理Docker容器"
        echo "   请使用: sudo $0 $1"
        exit 1
    fi
}

start_service() {
    check_sudo "start"
    echo "🚀 启动 Army Yorozuya 网站服务..."
    
    if sudo docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        echo "🔄 启动现有容器..."
        sudo docker start $CONTAINER_NAME
    else
        echo "❌ 容器不存在，请先运行部署脚本"
        exit 1
    fi
    
    sleep 2
    status_service
}

stop_service() {
    check_sudo "stop"
    echo "🛑 停止 Army Yorozuya 网站服务..."
    
    if sudo docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        sudo docker stop $CONTAINER_NAME
        echo "✅ 服务已停止"
    else
        echo "ℹ️  服务未运行"
    fi
}

restart_service() {
    check_sudo "restart"
    echo "🔄 重启 Army Yorozuya 网站服务..."
    
    if sudo docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        sudo docker restart $CONTAINER_NAME
        sleep 2
        status_service
    else
        echo "❌ 容器不存在，请先运行部署脚本"
        exit 1
    fi
}

status_service() {
    echo "📊 Army Yorozuya 网站服务状态:"
    echo ""
    
    # 检查容器状态
    if sudo docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        echo "✅ 容器状态: 运行中"
        sudo docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
        
        # 检查端口
        echo ""
        echo "🔌 端口状态:"
        if sudo netstat -tulpn | grep -q ":80 "; then
            echo "  端口80: ✅ 监听中"
        else
            echo "  端口80: ❌ 未监听"
        fi
        
        if sudo netstat -tulpn | grep -q ":443 "; then
            echo "  端口443: ✅ 监听中"
        else
            echo "  端口443: ❌ 未监听"
        fi
        
        # 显示访问信息
        echo ""
        echo "🌐 访问信息:"
        echo "  HTTPS: https://localhost"
        echo "  HTTP:  http://localhost (自动重定向到HTTPS)"
        
    elif sudo docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        echo "⏸️  容器状态: 已停止"
        sudo docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
    else
        echo "❌ 容器不存在"
        echo "   请运行部署脚本: ./deploy-army-yorozuya-sudo.sh"
    fi
}

show_logs() {
    check_sudo "logs"
    echo "📝 Army Yorozuya 网站服务日志:"
    echo ""
    
    if sudo docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        sudo docker logs --tail 20 $CONTAINER_NAME
    else
        echo "❌ 容器不存在"
    fi
}

rebuild_service() {
    check_sudo "rebuild"
    echo "🔨 重新构建并部署 Army Yorozuya 网站..."
    
    # 停止并移除现有容器
    if sudo docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        echo "🔄 停止并移除现有容器..."
        sudo docker stop $CONTAINER_NAME > /dev/null 2>&1 || true
        sudo docker rm $CONTAINER_NAME > /dev/null 2>&1 || true
    fi
    
    # 构建新镜像
    echo "🔨 构建Docker镜像..."
    cd "$(dirname "$0")"
    sudo docker build -f Dockerfile-army-yorozuya -t $IMAGE_NAME .
    
    # 运行新容器
    echo "🚢 启动新容器..."
    sudo docker run -d \
        --name $CONTAINER_NAME \
        -p 80:80 \
        -p 443:443 \
        --restart unless-stopped \
        $IMAGE_NAME
    
    sleep 3
    status_service
}

test_service() {
    echo "🧪 测试 Army Yorozuya 网站访问..."
    
    # 检查容器是否运行
    if ! sudo docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        echo "❌ 容器未运行，请先启动服务"
        exit 1
    fi
    
    # 测试HTTPS访问
    echo "🔒 测试HTTPS访问..."
    if curl -s -k -o /dev/null -w "%{http_code}" https://localhost | grep -q "200"; then
        echo "✅ HTTPS访问正常"
        
        # 获取页面标题
        TITLE=$(curl -s -k https://localhost | grep -o '<title>[^<]*</title>' | sed 's/<title>//;s/<\/title>//')
        echo "📄 页面标题: $TITLE"
    else
        echo "❌ HTTPS访问失败"
    fi
    
    # 测试HTTP重定向
    echo "🌐 测试HTTP重定向..."
    REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" http://localhost)
    if [ -n "$REDIRECT" ]; then
        echo "✅ HTTP重定向正常: $REDIRECT"
    else
        echo "⚠️  HTTP重定向异常"
    fi
}

# 主逻辑
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        status_service
        ;;
    logs)
        show_logs
        ;;
    rebuild)
        rebuild_service
        ;;
    test)
        test_service
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac