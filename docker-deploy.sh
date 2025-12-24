#!/bin/bash

# =============================================================================
# Docker 部署脚本 - 签到系统
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p mysql/conf
    # mkdir -p redis
    mkdir -p nginx
    mkdir -p logs
    mkdir -p backups
    
    log_success "目录创建完成"
}

# 创建MySQL配置文件
create_mysql_config() {
    if [ ! -f "mysql/conf/my.cnf" ]; then
        log_info "创建MySQL配置文件..."
        cat > mysql/conf/my.cnf << EOF
[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
init_connect = 'SET NAMES utf8mb4'
max_connections = 1000
max_allowed_packet = 64M
innodb_buffer_pool_size = 256M
query_cache_size = 32M
query_cache_type = 1
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
EOF
        log_success "MySQL配置文件创建完成"
    fi
}

# 创建Redis配置文件
# create_redis_config() {
#     if [ ! -f "redis/redis.conf" ]; then
#         log_info "创建Redis配置文件..."
#         cat > redis/redis.conf << EOF
# bind 0.0.0.0
# port 6379
# timeout 300
# keepalive 60
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000
# appendonly yes
# appendfsync everysec
# EOF
#         log_success "Redis配置文件创建完成"
#     fi
# }

# 创建Nginx负载均衡配置
create_nginx_lb_config() {
    if [ ! -f "nginx/nginx-lb.conf" ]; then
        log_info "创建Nginx负载均衡配置..."
        cat > nginx/nginx-lb.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }
    
    upstream frontend {
        server frontend:80;
    }
    
    server {
        listen 443 ssl;
        server_name localhost;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }
    }
    
    server {
        listen 80;
        server_name localhost;
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
        log_success "Nginx负载均衡配置创建完成"
    fi
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker-compose build backend
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker-compose build frontend
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    local compose_file="docker-compose.yml"
    if [ "$1" = "simple" ]; then
        compose_file="docker-compose-simple.yml"
        log_info "使用简化版本启动服务..."
    else
        log_info "启动服务..."
    fi
    
    # 启动基础服务（数据库和缓存）
    log_info "启动数据库和缓存服务..."
    docker-compose -f $compose_file up -d mysql redis
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    sleep 30
    
    # 启动后端服务
    log_info "启动后端服务..."
    docker-compose -f $compose_file up -d backend
    
    # 等待后端服务启动
    log_info "等待后端服务启动..."
    sleep 30
    
    # 启动前端服务
    log_info "启动前端服务..."
    docker-compose -f $compose_file up -d frontend
    
    log_success "所有服务启动完成"
}

# 检查服务状态
check_services() {
    local compose_file="docker-compose.yml"
    if [ "$1" = "simple" ]; then
        compose_file="docker-compose-simple.yml"
    fi
    
    log_info "检查服务状态..."
    
    services=("mysql" "backend" "frontend")
    
    for service in "${services[@]}"; do
        status=$(docker-compose -f $compose_file ps -q $service | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
        
        if [ "$status" = "running" ]; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务状态异常: $status"
        fi
    done
}

# 显示访问信息
show_access_info() {
    log_info "服务访问信息："
    echo "=================================="
    echo "前端地址: http://localhost"
    echo "后端API: http://localhost:8080"
    echo "MySQL: localhost:3306"
    # echo "Redis: localhost:6379"
    echo "=================================="
    
    log_info "查看服务状态: docker-compose ps"
    log_info "查看日志: docker-compose logs -f [service_name]"
    log_info "停止服务: docker-compose down"
    log_info "重启服务: docker-compose restart [service_name]"
}

# 备份数据
backup_data() {
    log_info "备份数据..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_dir="backups/backup_$timestamp"
    
    mkdir -p "$backup_dir"
    
    # 备份MySQL数据
    docker-compose exec mysql mysqldump -u root -p123456 checkin_db > "$backup_dir/mysql_backup.sql"
    
    # 备份Redis数据
    # docker cp $(docker-compose ps -q redis):/data "$backup_dir/redis_data"
    
    log_success "数据备份完成: $backup_dir"
}

# 主函数
main() {
    echo "=================================="
    echo "    Docker 部署脚本 - 签到系统"
    echo "=================================="
    echo ""
    
    case "${1:-deploy}" in
        "check")
            check_docker
            ;;
        "build")
            check_docker
            create_directories
            create_mysql_config
            # create_redis_config
            create_nginx_lb_config
            build_images
            ;;
        "deploy")
            check_docker
            create_directories
            create_mysql_config
            # create_redis_config
            create_nginx_lb_config
            build_images
            start_services
            sleep 10
            check_services
            show_access_info
            ;;
        "deploy-simple")
            check_docker
            create_directories
            create_mysql_config
            build_images
            start_services simple
            sleep 10
            check_services simple
            show_access_info
            ;;
        "start")
            docker-compose up -d
            check_services
            show_access_info
            ;;
        "start-simple")
            docker-compose -f docker-compose-simple.yml up -d
            check_services simple
            show_access_info
            ;;
        "stop")
            docker-compose down
            log_success "所有服务已停止"
            ;;
        "restart")
            docker-compose restart
            check_services
            ;;
        "status")
            check_services
            ;;
        "logs")
            docker-compose logs -f ${2:-}
            ;;
        "backup")
            backup_data
            ;;
        "clean")
            log_warning "这将删除所有容器、镜像和数据卷"
            read -p "确认删除? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose down -v --rmi all
                log_success "清理完成"
            fi
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  check    - 检查Docker环境"
            echo "  build    - 构建镜像"
            echo "  deploy        - 完整部署（默认）"
            echo "  deploy-simple - 简化版部署"
            echo "  start         - 启动服务"
            echo "  start-simple  - 启动简化版服务"
            echo "  stop     - 停止服务"
            echo "  restart  - 重启服务"
            echo "  status   - 检查服务状态"
            echo "  logs     - 查看日志"
            echo "  backup   - 备份数据"
            echo "  clean    - 清理所有资源"
            echo "  help     - 显示帮助"
            ;;
        *)
            log_error "未知命令: $1"
            log_info "使用 '$0 help' 查看可用命令"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"