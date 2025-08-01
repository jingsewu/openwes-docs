---
id: installation
title: Installation
sidebar_position: 2
---

# OpenWES Installation Guide

Choose one of the two paths below:

1. **Docker (recommended)** – spin everything up in < 30 s
2. **Manual install** – for full control or local development

---

<details open>
<summary><h2>🐳 Docker Quick-Start (30 s)</h2></summary>

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

### One-liner
```bash
git clone https://github.com/jingsewu/open-wes.git
cd open-wes
HOST_IP=$(hostname -I | awk '{print $1}') docker-compose up -d
```

Services will be available at:

| Service | URL                        |
|---------|----------------------------|
| Web UI | http://localhost       |
| Nacos  | http://localhost:8848/nacos |

</details>

---

<details>
<summary><h2>🛠️ Manual / Local Install</h2></summary>

### Prerequisites
- **Java 17+** – [download](https://www.java.com/)
- **MySQL 8.0+** – [download](https://www.mysql.com/)
- **Nacos 2.0+** – [download](https://nacos.io/)
- **Redis 7.0+** – [download](https://redis.io/)
- **Node.js 18+** – [download](https://nodejs.org/)

> ℹ️ MySQL, Nacos, and Redis **must** run on the same machine.  
> You can use the included `docker-compose.yml` to install them quickly.

---

### 1. Clone repository
```bash
git clone https://github.com/jingsewu/open-wes.git
cd open-wes
```

---

### 2. Set up backend

#### 2.1 Load Nacos schema
```bash
mysql -u root -p nacos_config < initdb.d/nacos_config.sql
```

#### 2.2 Add host entries
Edit your hosts file:

| OS | Path |
|----|------|
| Linux/macOS | `/etc/hosts` |
| Windows | `C:\Windows\System32\drivers\etc\hosts` |

Append:
```
127.0.0.1 nacos.openwes.com
127.0.0.1 redis.openwes.com
127.0.0.1 mysql.openwes.com
```

#### 2.3 Create application database
```sql
mysql -u root -p -e "CREATE DATABASE openwes;"
```

#### 2.4 Start services
From `server/server/` run (in separate terminals or via IDE):

```bash
java -jar WesApplication.jar
java -jar GatewayApplication.jar
java -jar StationApplication.jar
```

---

### 3. Set up client

#### 3.1 Rename webpack config
```bash
mv client/build/webpack.config.example.dev.js client/build/webpack.config.dev.js
```

#### 3.2 Install dependencies
```bash
cd client
npm install
```

#### 3.3 Start client
```bash
npm start
```

Client opens at **http://localhost:4000**.

---

### Troubleshooting
| Symptom | Check |
|---------|-------|
| Service unreachable | All prerequisites installed and running |
| DNS errors | `hosts` file contains the three aliases |
| DB errors | `openwes` database exists and credentials are correct |

Still stuck?  
Open an issue in the [GitHub repo](https://github.com/jingsewu/open-wes/issues).

</details>

