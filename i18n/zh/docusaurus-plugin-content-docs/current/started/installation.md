---
id: installation
title: 安装指南
sidebar_position: 2
---

# OpenWES 安装指南

请选择以下两种方式之一：

1. **Docker（推荐）** – 30 秒内一键启动所有服务
2. **手动安装** – 适合需要完全控制或本地开发的用户

---

<details open>
<summary><h2>🐳 Docker 快速启动（30 秒）</h2></summary>

### 前置条件
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)（v2.20 及以上）

### 一行命令搞定
```bash
git clone https://github.com/jingsewu/open-wes.git
cd open-wes
HOST_IP=$(hostname -I | awk '{print $1}') docker-compose up -d
```

启动后可通过以下地址访问服务：

| 服务名称 | 访问地址                    |
|----------|-----------------------------|
| Web 界面 | http://localhost            |
| Nacos    | http://localhost:8848/nacos |

</details>

---

<details>
<summary><h2>🛠️ 手动 / 本地安装</h2></summary>

### 前置条件
- **Java 17+** – [下载地址](https://www.java.com/)
- **MySQL 8.0+** – [下载地址](https://www.mysql.com/)
- **Nacos 2.0+** – [下载地址](https://nacos.io/)
- **Redis 7.0+** – [下载地址](https://redis.io/)
- **Node.js 18+** – [下载地址](https://nodejs.org/)

---

### 1. 克隆仓库
```bash
git clone https://github.com/jingsewu/open-wes.git
cd open-wes
```

---

### 2. 配置后端
#### 2.1 创建nacos数据库
```sql
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nacos_config CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 2.2 导入 Nacos 数据库结构
```bash
mysql -u root -p nacos_config < initdb.d/nacos_config.sql
```

#### 2.3 配置本地 hosts 文件
根据操作系统编辑对应路径的 hosts 文件：

| 操作系统 | 路径 |
|----------|------|
| Linux/macOS | `/etc/hosts` |
| Windows | `C:\Windows\System32\drivers\etc\hosts` |

添加以下内容：
```
127.0.0.1 nacos.openwes.com 
127.0.0.1 redis.openwes.com
127.0.0.1 mysql.openwes.com
```
> nacos.openwes.com 对应nacos服务的ip地址  
> redis.openwes.com 对应redis服务的ip地址  
> mysql.openwes.com 对应mysql服务的ip地址

#### 2.4 创建应用数据库
```sql
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS openwes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 2.5 启动服务
在 `server/server/` 目录下，分别打开多个终端或用 IDE 启动以下服务：

```bash
java -jar WesApplication.jar
java -jar GatewayApplication.jar
java -jar StationApplication.jar
```

---

### 3. 配置前端

#### 3.1 重命名 webpack 配置文件
```bash
mv client/build/webpack.config.example.dev.js client/build/webpack.config.dev.js
```

#### 3.2 安装依赖
```bash
cd client
npm install
```

#### 3.3 启动前端
```bash
npm start
```

前端默认打开地址：**http://localhost:4001**

---

### 常见问题排查
| 问题现象 | 检查项 |
|----------|--------|
| 服务无法访问 | 是否已安装并启动所有前置条件 |
| DNS 报错 | 检查 hosts 文件中是否包含三条别名 |
| 数据库报错 | 确认 `openwes` 数据库存在且连接信息正确 |

仍有问题？  
前往 [GitHub 仓库](https://github.com/jingsewu/open-wes/issues) 提交 issue。

</details>
