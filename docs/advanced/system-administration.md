---
id: system-administration
title: System Administration & Technical Troubleshooting
sidebar_position: 7
---

# System Administration & Technical Troubleshooting

This comprehensive guide covers system administration, technical troubleshooting, monitoring, and operational procedures for OpenWES deployments. **This guide is for system administrators and IT support staff.**

> **Note for Operators**: If you're a warehouse operator looking for help with daily issues, see the [Operator Troubleshooting Guide](../operators/operator-troubleshooting.md) instead.

## Quick Diagnostic Checklist

### System Health Check

```bash
#!/bin/bash
# health-check.sh - Quick system health verification

echo "=== OpenWES Health Check ==="
echo "Timestamp: $(date)"

# Check system resources
echo -e "\n1. System Resources:"
echo "Memory Usage:"
free -h
echo "Disk Usage:"
df -h | grep -E '^/dev/'
echo "CPU Load:"
uptime

# Check services
echo -e "\n2. Service Status:"
services=("mysql" "redis-server" "openwes-wes" "openwes-gateway" "openwes-station")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "✓ $service: Running"
    else
        echo "✗ $service: Stopped"
    fi
done

# Check network connectivity
echo -e "\n3. Network Connectivity:"
ports=("3306:MySQL" "6379:Redis" "8080:WES-Server" "8081:Gateway" "8082:Station")
for port_info in "${ports[@]}"; do
    port=${port_info%:*}
    service=${port_info#*:}
    if netstat -tlnp | grep -q ":$port "; then
        echo "✓ $service (Port $port): Listening"
    else
        echo "✗ $service (Port $port): Not accessible"
    fi
done

# Check application health endpoints
echo -e "\n4. Application Health:"
endpoints=("http://localhost:8080/actuator/health" "http://localhost:8081/actuator/health" "http://localhost:8082/actuator/health")
for endpoint in "${endpoints[@]}"; do
    service_name=$(echo $endpoint | cut -d':' -f3 | cut -d'/' -f1)
    if curl -s -f "$endpoint" > /dev/null; then
        echo "✓ Service $service_name: Healthy"
    else
        echo "✗ Service $service_name: Unhealthy"
    fi
done

# Check log errors
echo -e "\n5. Recent Errors (Last 10 minutes):"
log_files=("/opt/openwes/*/logs/*.log" "/var/log/openwes/*.log")
for pattern in "${log_files[@]}"; do
    find $pattern -type f -name "*.log" 2>/dev/null | while read logfile; do
        errors=$(grep -i "error\|exception\|failed" "$logfile" | grep "$(date -d '10 minutes ago' '+%Y-%m-%d %H:%M')" | wc -l)
        if [ $errors -gt 0 ]; then
            echo "⚠ $logfile: $errors recent errors"
        fi
    done
done

echo -e "\n=== Health Check Complete ==="
```

## Common Issues and Solutions

### 1. Service Startup Issues

#### Issue: WES Server Won't Start

**Symptoms:**
- Service fails to start
- Connection refused errors
- No response on port 8080

**Diagnosis:**
```bash
# Check service status
systemctl status openwes-wes

# Check logs
journalctl -u openwes-wes -f

# Check Java process
ps aux | grep java

# Check port binding
netstat -tlnp | grep 8080
```

**Common Causes & Solutions:**

1. **Database Connection Issues**
```bash
# Test MySQL connection
mysql -h localhost -u openwes -p -e "SELECT 1"

# Check MySQL service
systemctl status mysql

# Verify credentials in configuration
grep -n "datasource" /opt/openwes/wes-server/application.yml
```

2. **Port Already in Use**
```bash
# Find process using port 8080
lsof -i :8080

# Kill conflicting process
kill -9 <PID>
```

3. **Insufficient Memory**
```bash
# Check available memory
free -h

# Adjust JVM heap size
export JAVA_OPTS="-Xms1g -Xmx2g"
```

4. **Configuration Issues**
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('/opt/openwes/wes-server/application.yml'))"

# Check required environment variables
env | grep -E "(MYSQL_|REDIS_|NACOS_)"
```

#### Issue: Database Connection Failures

**Symptoms:**
- "Connection refused" errors
- "Unknown database" errors
- Authentication failures

**Solutions:**
```sql
-- Check MySQL status
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';

-- Verify database exists
SHOW DATABASES LIKE 'open_wes';

-- Check user permissions
SELECT user,host FROM mysql.user WHERE user='openwes';
SHOW GRANTS FOR 'openwes'@'localhost';

-- Create database if missing
CREATE DATABASE IF NOT EXISTS open_wes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix permissions
GRANT ALL PRIVILEGES ON open_wes.* TO 'openwes'@'localhost';
FLUSH PRIVILEGES;
```

#### Issue: Redis Connection Problems

**Symptoms:**
- Cache operations fail
- Session management issues
- "Connection reset by peer" errors

**Solutions:**
```bash
# Test Redis connectivity
redis-cli ping

# Check Redis configuration
redis-cli CONFIG GET "*"

# Monitor Redis operations
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory

# Clear Redis cache if corrupted
redis-cli FLUSHDB
```

### 2. Performance Issues

#### Issue: Slow Response Times

**Diagnosis Tools:**
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/actuator/health

# Create curl-format.txt
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# Monitor JVM performance
jstat -gc <java_pid> 5s

# Check database performance
mysql -e "SHOW PROCESSLIST; SHOW STATUS LIKE 'Slow_queries';"

# Monitor system resources
iostat -x 1
vmstat 1
```

**Optimization Strategies:**

1. **Database Optimization**
```sql
-- Analyze slow queries
SET global slow_query_log = 'ON';
SET global long_query_time = 2;

-- Check index usage
EXPLAIN SELECT * FROM picking_orders WHERE status = 'NEW';

-- Optimize frequently used queries
ALTER TABLE picking_orders ADD INDEX idx_status_created (status, created_time);

-- Update table statistics
ANALYZE TABLE picking_orders, container_stock, work_stations;
```

2. **JVM Tuning**
```bash
# Optimize garbage collection
JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication"

# Monitor garbage collection
jstat -gc -t <java_pid> 5s

# Analyze heap dump if needed
jmap -dump:format=b,file=heap.hprof <java_pid>
```

3. **Cache Optimization**
```bash
# Monitor Redis performance
redis-cli --latency-history

# Optimize Redis configuration
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory 2gb
```

#### Issue: High Memory Usage

**Diagnosis:**
```bash
# Check memory usage by process
ps aux --sort=-%mem | head -10

# Analyze Java heap usage
jmap -histo <java_pid> | head -20

# Check for memory leaks
jstat -gccapacity <java_pid>
```

**Solutions:**
```bash
# Adjust JVM memory settings
export JAVA_OPTS="-Xms2g -Xmx4g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m"

# Enable heap dump on OOM
export JAVA_OPTS="$JAVA_OPTS -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/"

# Monitor and profile
jvisualvm --jdkhome $JAVA_HOME
```

### 3. Data Integrity Issues

#### Issue: Inventory Discrepancies

**Symptoms:**
- Stock levels don't match physical inventory
- Negative stock quantities
- Missing inventory transactions

**Investigation:**
```sql
-- Check for negative stock
SELECT container_code, sku_code, available_qty 
FROM container_stock 
WHERE available_qty < 0;

-- Audit inventory transactions
SELECT * FROM stock_transaction_record 
WHERE created_time > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_time DESC;

-- Find orphaned stock records
SELECT cs.* FROM container_stock cs
LEFT JOIN containers c ON cs.container_code = c.container_code
WHERE c.container_code IS NULL;

-- Verify task completion consistency
SELECT t.task_code, t.task_status, t.container_code,
       cs.available_qty, cs.allocated_qty
FROM tasks t
JOIN container_stock cs ON t.container_code = cs.container_code
WHERE t.task_status = 'COMPLETED' 
  AND t.updated_time > DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

**Reconciliation Procedures:**
```sql
-- Stock reconciliation procedure
DELIMITER //
CREATE PROCEDURE ReconcileInventory(IN p_warehouse_code VARCHAR(64))
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_container_code VARCHAR(64);
    DECLARE v_sku_code VARCHAR(64);
    DECLARE v_physical_qty INT;
    DECLARE v_system_qty INT;
    
    DECLARE cur CURSOR FOR 
        SELECT container_code, sku_code, physical_count
        FROM inventory_reconciliation_temp
        WHERE warehouse_code = p_warehouse_code;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_container_code, v_sku_code, v_physical_qty;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SELECT available_qty INTO v_system_qty
        FROM container_stock
        WHERE container_code = v_container_code AND sku_code = v_sku_code;
        
        IF v_physical_qty != v_system_qty THEN
            INSERT INTO stock_adjustment_records 
            (container_code, sku_code, system_qty, physical_qty, 
             adjustment_qty, reason, created_time)
            VALUES 
            (v_container_code, v_sku_code, v_system_qty, v_physical_qty,
             v_physical_qty - v_system_qty, 'CYCLE_COUNT', NOW());
             
            UPDATE container_stock 
            SET available_qty = v_physical_qty,
                updated_time = NOW()
            WHERE container_code = v_container_code AND sku_code = v_sku_code;
        END IF;
    END LOOP;
    
    CLOSE cur;
    COMMIT;
END //
DELIMITER ;
```

#### Issue: Task Processing Errors

**Symptoms:**
- Tasks stuck in processing state
- Duplicate task execution
- Task assignment failures

**Debugging:**
```sql
-- Find stuck tasks
SELECT task_code, task_type, task_status, created_time, updated_time
FROM tasks 
WHERE task_status = 'PROCESSING' 
  AND created_time < DATE_SUB(NOW(), INTERVAL 30 MINUTE);

-- Check task dependencies
SELECT t1.task_code as parent_task, t2.task_code as dependent_task, 
       t1.task_status as parent_status, t2.task_status as dependent_status
FROM task_dependencies td
JOIN tasks t1 ON td.parent_task_id = t1.id
JOIN tasks t2 ON td.dependent_task_id = t2.id
WHERE t1.task_status != 'COMPLETED';

-- Analyze task execution patterns
SELECT task_type, task_status, COUNT(*) as count,
       AVG(TIMESTAMPDIFF(MINUTE, created_time, updated_time)) as avg_duration
FROM tasks 
WHERE created_time > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY task_type, task_status;
```

### 4. Integration Issues

#### Issue: External System Communication Failures

**Symptoms:**
- API timeouts
- Authentication errors
- Data synchronization issues

**Debugging:**
```bash
# Test external API connectivity
curl -v -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     https://external-wms.company.com/api/orders

# Check network latency
ping -c 10 external-wms.company.com
traceroute external-wms.company.com

# Monitor network traffic
netstat -i
iftop -i eth0

# Check SSL certificate validity
openssl s_client -connect external-wms.company.com:443 -servername external-wms.company.com
```

**Solutions:**
```java
// Implement retry mechanism with exponential backoff
@Retryable(
    value = {ConnectException.class, SocketTimeoutException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public ApiResponse callExternalAPI(String endpoint, Object data) {
    // Implementation with proper error handling
}

// Circuit breaker pattern
@CircuitBreaker(name = "externalAPI", fallbackMethod = "fallbackMethod")
public ApiResponse callExternalAPIWithCircuitBreaker(String endpoint, Object data) {
    // Implementation
}
```

#### Issue: Message Queue Problems

**Symptoms:**
- Messages not being processed
- Dead letter queue accumulation
- Consumer lag

**Diagnosis:**
```bash
# Check Kafka topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Monitor consumer lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --all-groups

# Check message queue health
kafka-log-dirs.sh --bootstrap-server localhost:9092 --describe
```

### 5. UI and Frontend Issues

#### Issue: Frontend Application Not Loading

**Symptoms:**
- Blank page or loading spinner
- JavaScript errors in browser console
- API call failures

**Debugging:**
```bash
# Check frontend service
curl -I http://localhost:3000

# Check browser console for errors
# Open Developer Tools (F12) and check Console tab

# Verify API endpoints
curl http://localhost:8081/api/health

# Check CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8081/api/execute
```

**Solutions:**
```javascript
// Debug API calls
const debugApiCall = async (url, options) => {
    console.log('API Call:', { url, options });
    try {
        const response = await fetch(url, options);
        console.log('Response:', response.status, response.statusText);
        const data = await response.json();
        console.log('Data:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Error boundary component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.log('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }
        return this.props.children;
    }
}
```

## Monitoring and Alerting

### Application Monitoring

#### Metrics Collection
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'openwes-wes'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
    
  - job_name: 'openwes-gateway'
    static_configs:
      - targets: ['localhost:8081']
    metrics_path: '/actuator/prometheus'

  - job_name: 'mysql'
    static_configs:
      - targets: ['localhost:9104']
```

#### Key Metrics Dashboard
```yaml
# grafana-dashboard.json
{
  "dashboard": {
    "title": "OpenWES Monitoring",
    "panels": [
      {
        "title": "API Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "http_server_requests_seconds{job=\"openwes-wes\"}",
            "legendFormat": "{{uri}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "mysql_global_status_threads_connected"
          }
        ]
      },
      {
        "title": "JVM Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes{job=\"openwes-wes\"}",
            "legendFormat": "{{area}}"
          }
        ]
      }
    ]
  }
}
```

#### Alert Rules
```yaml
# alert-rules.yml
groups:
  - name: openwes-alerts
    rules:
      - alert: ServiceDown
        expr: up{job=~"openwes-.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "OpenWES service {{ $labels.job }} is down"
      
      - alert: HighMemoryUsage
        expr: (jvm_memory_used_bytes / jvm_memory_max_bytes) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.job }}"
      
      - alert: DatabaseConnectionsHigh
        expr: mysql_global_status_threads_connected > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High number of database connections"
      
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Disk space low on {{ $labels.mountpoint }}"
```

### Log Management

#### Centralized Logging with ELK Stack
```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    paths:
      - /opt/openwes/*/logs/*.log
    fields:
      service: openwes
    multiline.pattern: '^\d{4}-\d{2}-\d{2}'
    multiline.negate: true
    multiline.match: after

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "openwes-logs-%{+yyyy.MM.dd}"

setup.template.settings:
  index.number_of_shards: 1
  index.number_of_replicas: 0
```

#### Log Analysis Queries
```json
// Elasticsearch queries for common issues

// Find all errors in the last hour
{
  "query": {
    "bool": {
      "must": [
        {"match": {"level": "ERROR"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  }
}

// Find database connection errors
{
  "query": {
    "bool": {
      "must": [
        {"match": {"message": "database connection"}},
        {"match": {"level": "ERROR"}}
      ]
    }
  }
}

// API response time analysis
{
  "aggs": {
    "avg_response_time": {
      "avg": {
        "field": "response_time"
      }
    },
    "response_time_percentiles": {
      "percentiles": {
        "field": "response_time",
        "percents": [50, 95, 99]
      }
    }
  }
}
```

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="openwes_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mysqldump --single-transaction --routines --triggers \
          --user=root --password="$MYSQL_ROOT_PASSWORD" \
          open_wes > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Application Data Backup
```bash
#!/bin/bash
# backup-application.sh

BACKUP_DIR="/backup/application"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup configuration files
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    /opt/openwes/*/application.yml \
    /opt/openwes/*/application-*.yml \
    /etc/openwes/

# Backup uploaded files
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" \
    /opt/openwes/uploads/

# Backup logs (last 7 days)
find /opt/openwes/*/logs/ -name "*.log" -mtime -7 \
    -exec tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" {} +

echo "Application backup completed"
```

### Disaster Recovery Procedures

#### Complete System Recovery
```bash
#!/bin/bash
# disaster-recovery.sh

echo "Starting OpenWES disaster recovery..."

# 1. Restore database
echo "Restoring database..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" open_wes < /backup/mysql/latest_backup.sql

# 2. Restore configuration
echo "Restoring configuration..."
tar -xzf /backup/application/latest_config.tar.gz -C /

# 3. Restore application data
echo "Restoring application data..."
tar -xzf /backup/application/latest_uploads.tar.gz -C /

# 4. Start services
echo "Starting services..."
systemctl start mysql
systemctl start redis-server
systemctl start openwes-wes
systemctl start openwes-gateway
systemctl start openwes-station

# 5. Verify system health
echo "Verifying system health..."
./health-check.sh

echo "Disaster recovery completed"
```

## Performance Tuning

### Database Optimization
```sql
-- MySQL optimization settings
SET GLOBAL innodb_buffer_pool_size = 2147483648;  -- 2GB
SET GLOBAL innodb_log_buffer_size = 268435456;    -- 256MB
SET GLOBAL query_cache_size = 134217728;          -- 128MB
SET GLOBAL max_connections = 200;
SET GLOBAL innodb_file_per_table = 1;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;

-- Index optimization
ANALYZE TABLE picking_orders, container_stock, tasks, work_stations;

-- Create performance-critical indexes
CREATE INDEX idx_picking_orders_status_priority ON picking_orders(status, priority);
CREATE INDEX idx_container_stock_sku_location ON container_stock(sku_code, location_code);
CREATE INDEX idx_tasks_status_workstation ON tasks(task_status, work_station_id);
```

### Application Tuning
```bash
# JVM optimization for production
export JAVA_OPTS="
-Xms4g -Xmx8g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UseStringDeduplication
-XX:+DisableExplicitGC
-XX:+PrintGCDetails
-XX:+PrintGCTimeStamps
-Xloggc:/opt/openwes/logs/gc.log
-XX:+UseGCLogFileRotation
-XX:NumberOfGCLogFiles=10
-XX:GCLogFileSize=10M
"
```

## Security Auditing

### Security Checklist
```bash
#!/bin/bash
# security-audit.sh

echo "=== OpenWES Security Audit ==="

# Check for default passwords
echo "1. Checking for default passwords..."
if mysql -u root -proot -e "SELECT 1" 2>/dev/null; then
    echo "⚠ WARNING: MySQL root has default password"
fi

# Check file permissions
echo "2. Checking file permissions..."
find /opt/openwes -type f -perm -o+w -exec ls -la {} \;

# Check for unencrypted connections
echo "3. Checking SSL configuration..."
netstat -tlnp | grep -E ':(3306|6379|8080|8081)' | grep -v 127.0.0.1

# Check for SQL injection vulnerabilities
echo "4. Checking for potential SQL injection points..."
grep -r "Statement.*+.*" /opt/openwes/*/src/ || echo "No obvious SQL injection patterns found"

# Check authentication configuration
echo "5. Checking authentication settings..."
grep -n "authentication" /opt/openwes/*/application*.yml

echo "=== Security Audit Complete ==="
```

This comprehensive troubleshooting guide provides the tools and procedures needed to diagnose, resolve, and prevent common issues in OpenWES deployments. Regular use of these monitoring and maintenance procedures will ensure optimal system performance and reliability.