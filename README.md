# 移动端签到打卡应用

一个基于Spring Boot + React的移动端签到打卡系统，支持Docker容器化部署。

## 项目结构

```
checkin/
├── checkin-backend/          # Spring Boot后端服务
│   ├── src/main/java/        # Java源代码
│   ├── src/main/resources/   # 配置文件
│   ├── Dockerfile           # 后端Docker配置
│   └── pom.xml              # Maven依赖配置
├── checkin-mobiled/         # React移动端前端
│   ├── src/                 # React源代码
│   ├── public/              # 静态资源
│   ├── Dockerfile          # 前端Docker配置
│   └── package.json        # Node.js依赖配置
├── docker-compose-simple.yml # 简化版Docker编排
├── docker-compose.yml        # 完整版Docker编排
├── mysql/                    # MySQL配置
├── redis/                    # Redis配置
└── nginx/                    # Nginx负载均衡配置
```

## 技术栈

### 后端
- Spring Boot 2.7+
- MySQL 5.7
- Redis 6
- JWT认证
- MyBatis

### 前端
- React 18
- Tailwind CSS
- Axios
- React Router

### 部署
- Docker & Docker Compose
- Nginx

## 快速开始

### 1. 环境要求
- Docker
- Docker Compose
- Node.js 16+ (开发环境)
- Java 11+ (开发环境)

### 2. 启动服务

```bash
# 使用简化版配置启动
docker-compose -f docker-compose-simple.yml up -d

# 或使用完整版配置启动
docker-compose up -d
```

### 3. 访问应用
- 前端应用: http://localhost:7779
- 后端API: http://localhost:7778
- MySQL: localhost:3307
- Redis: localhost:6379

### 4. 默认账户
- 用户名: admin
- 密码: 123456

## Git托管配置

### 本地仓库已初始化
项目已配置Git版本控制，包含完整的.gitignore文件。

### 添加远程仓库

#### GitHub
```bash
# 在GitHub创建新仓库后，添加远程仓库
git remote add origin https://github.com/你的用户名/仓库名.git

# 推送到远程仓库
git push -u origin main
```

#### Gitee
```bash
# 在Gitee创建新仓库后，添加远程仓库
git remote add origin https://gitee.com/你的用户名/仓库名.git

# 推送到远程仓库
git push -u origin master
```

#### GitLab
```bash
# 在GitLab创建新仓库后，添加远程仓库
git remote add origin https://gitlab.com/你的用户名/仓库名.git

# 推送到远程仓库
git push -u origin main
```

### 推荐的Git工作流

1. **功能分支开发**
```bash
# 创建功能分支
git checkout -b feature/新功能名称

# 开发完成后提交
git add .
git commit -m "feat: 添加新功能描述"

# 切换到主分支并合并
git checkout main
git merge feature/新功能名称

# 推送到远程仓库
git push origin main
```

2. **提交信息规范**
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 开发指南

### 后端开发
```bash
cd checkin-backend
mvn clean install
mvn spring-boot:run
```

### 前端开发
```bash
cd checkin-mobiled
npm install
npm start
```

### 数据库初始化
数据库表结构和初始数据会在容器启动时自动创建。

## 部署说明

### 生产环境部署
1. 修改配置文件中的数据库密码等敏感信息
2. 使用环境变量管理配置
3. 配置HTTPS证书
4. 设置防火墙规则

### 备份策略
- 定期备份MySQL数据
- 备份重要配置文件
- 使用Git管理代码版本

## 常见问题

### 数据库连接问题
确保MySQL容器已启动且网络配置正确。

### 端口冲突
检查端口是否被占用，可修改docker-compose.yml中的端口映射。

### 权限问题
确保Docker有足够权限访问项目文件。

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系项目维护者。