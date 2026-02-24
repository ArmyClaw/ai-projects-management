.PHONY: help start stop restart delete logs ps

help:
	@echo "AI Project Management - Docker 管理脚本"
	@echo ""
	@echo "用法: make <command>"
	@echo ""
	@echo "命令:"
	@echo "  start   - 启动所有服务"
	@echo "  stop    - 停止所有服务"
	@echo "  restart - 重启所有服务"
	@echo "  delete  - 删除所有容器和网络（数据会保留）"
	@echo "  destroy - 完全删除（容器+网络+数据）"
	@echo "  logs    - 查看日志"
	@echo "  ps      - 查看运行状态"

start:
	docker-compose up -d
	@echo "✅ 服务已启动，访问 http://localhost"

stop:
	docker-compose stop

restart:
	docker-compose restart

delete:
	docker-compose down

destroy:
	docker-compose down -v

logs:
	docker-compose logs -f

ps:
	docker-compose ps
