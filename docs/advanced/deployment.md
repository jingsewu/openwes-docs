---
id: deployment
title: Production Deployment Guide
sidebar_position: 5
---

# Production Deployment Guide

This guide provides comprehensive instructions for deploying OpenWES in production environments, covering various deployment scenarios and best practices.

## Overview

OpenWES supports multiple deployment architectures:
- **Docker Compose** - Single-node deployment for small to medium warehouses
- **Kubernetes** - Scalable container orchestration for enterprise environments
- **Manual Deployment** - Traditional server-based deployment
- **Hybrid Cloud** - Multi-cloud and on-premises deployments

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps

#### Recommended for Production
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 500GB+ SSD with backup
- **Network**: 1Gbps+ with redundancy

### Software Dependencies
- **Java**: OpenJDK 17 or higher
- **Node.js**: 18.x or higher
- **MySQL**: 8.0+
- **Redis**: 7.0+
- **Nacos**: 2.0+

## Docker Compose Deployment

### Quick Production Setup

1. **Clone and Configure**
```bash
git clone https://github.com/jingsewu/open-wes
cd open-wes
```

2. **Production Docker Compose**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: open_wes
    volumes:
      - mysql_data:/var/lib/mysql
      - ./initdb.d:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  nacos:
    image: nacos/nacos-server:v2.0.4
    environment:
      MODE: standalone
      MYSQL_SERVICE_HOST: mysql
      MYSQL_SERVICE_DB_NAME: nacos
      MYSQL_SERVICE_USER: root
      MYSQL_SERVICE_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    ports:
      - "8848:8848"
    depends_on:
      - mysql
    restart: unless-stopped

  wes-server:
    image: openwes/wes-server:latest
    environment:
      SPRING_PROFILES_ACTIVE: prod
      MYSQL_HOST: mysql:3306
      REDIS_HOST: redis:6379
      NACOS_HOST: nacos:8848
    ports:
      - "9010:9010"
    depends_on:
      - mysql
      - redis
      - nacos
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9010/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  gateway-server:
    image: openwes/gateway-server:latest
    environment:
      SPRING_PROFILES_ACTIVE: prod
      WES_SERVER_HOST: wes-server:8080
      NACOS_HOST: nacos:8848
    ports:
      - "8090:8090"
    depends_on:
      - wes-server
    restart: unless-stopped

  station-server:
    image: openwes/station-server:latest
    environment:
      SPRING_PROFILES_ACTIVE: prod
      WES_SERVER_HOST: wes-server:9010
      NACOS_HOST: nacos:8848
    ports:
      - "9040:9040"
    depends_on:
      - wes-server
    restart: unless-stopped

  frontend:
    image: openwes/frontend:latest
    environment:
      REACT_APP_API_URL: http://gateway-server:8081
    ports:
      - "80:80"
    depends_on:
      - gateway-server
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:

networks:
  default:
    driver: bridge
```

3. **Deploy with SSL/TLS**
```bash
# Generate SSL certificates (Let's Encrypt recommended)
certbot certonly --standalone -d your-domain.com

# Deploy with SSL proxy
docker-compose -f docker-compose.prod.yml up -d
```

### Production Environment Variables

```bash
# .env.prod
MYSQL_ROOT_PASSWORD=your_secure_mysql_password
REDIS_PASSWORD=your_secure_redis_password

# Application Settings
SPRING_PROFILES_ACTIVE=prod
LOG_LEVEL=INFO

```

### Database Security

1. **MySQL Hardening**
```sql
-- Create dedicated database user
CREATE USER 'openwes'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON open_wes.* TO 'openwes'@'localhost';
FLUSH PRIVILEGES;

-- Enable SSL
-- Add to /etc/mysql/mysql.conf.d/mysqld.cnf
ssl-ca=/etc/mysql/ssl/ca-cert.pem
ssl-cert=/etc/mysql/ssl/server-cert.pem
ssl-key=/etc/mysql/ssl/server-key.pem
```

2. **Redis Security**
```bash
# /etc/redis/redis.conf
requirepass your_secure_redis_password
bind 127.0.0.1
protected-mode yes
```

## Monitoring and Maintenance

### Health Checks

1. **Application Health**
```bash
# Check service status
curl -f http://localhost:8080/actuator/health

# Check all services
docker-compose ps
kubectl get pods -n openwes
```

2. **Database Health**
```sql
-- Check MySQL status
SHOW STATUS LIKE 'Threads_connected';
SHOW PROCESSLIST;

-- Check Redis
redis-cli ping
redis-cli info memory
```

### Backup Strategy

1. **Database Backup**
```bash
#!/bin/bash
# backup-mysql.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p open_wes > /backup/openwes_${DATE}.sql
```

2. **File System Backup**
```bash
#!/bin/bash
# backup-filesystem.sh
tar -czf /backup/openwes_files_$(date +%Y%m%d).tar.gz \
    /opt/openwes \
    /etc/openwes \
    --exclude='*.log'
```

### Log Management

```bash
# Configure log rotation
# /etc/logrotate.d/openwes
/opt/openwes/*/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload openwes-*
    endscript
}
```

## Performance Optimization

### JVM Tuning

```bash
# Add to systemd service or docker-compose
JAVA_OPTS="-Xms6g -Xmx6g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Database Optimization

```sql
-- MySQL configuration recommendations
-- /etc/mysql/mysql.conf.d/mysqld.cnf
innodb_buffer_pool_size = 2G
innodb_log_buffer_size = 256M
query_cache_size = 128M
max_connections = 200
```

### Redis Optimization

```bash
# /etc/redis/redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Troubleshooting

### Common Issues

1. **Service Won't Start**
```bash
# Check logs
journalctl -u openwes-wes -f
docker-compose logs wes-server

# Check port conflicts
netstat -tlnp | grep :9010
```

2. **Database Connection Issues**
```bash
# Test MySQL connection
mysql -h localhost -u openwes -p open_wes

# Check MySQL status
systemctl status mysql
```

3. **Memory Issues**
```bash
# Check system resources
free -h
df -h
top -p $(pgrep java)
```

### Support and Maintenance

- **Log Locations**: `/opt/openwes/*/logs/` or container logs
- **Health Endpoints**: `/actuator/health` for all services
- **Metrics**: Available at `/actuator/metrics` when enabled

For additional support, consult the [Troubleshooting Guide](../advanced/troubleshooting.md) or visit our [GitHub Issues](https://github.com/jingsewu/open-wes/issues).
