---
id: security
title: System Security Guide
sidebar_position: 4
---

# System Security Guide

This comprehensive guide covers security hardening, threat protection, and security best practices for OpenWES infrastructure and deployments.

## Infrastructure Security

### Network Security Architecture

#### Network Segmentation

```yaml
# Network zones for OpenWES deployment
networks:
  dmz:
    description: "External-facing services"
    cidr: "10.0.1.0/24"
    services:
      - nginx_reverse_proxy
      - api_gateway
    
  application:
    description: "Application tier"
    cidr: "10.0.2.0/24"
    services:
      - wes_server
      - gateway_server
      - station_server
    
  data:
    description: "Database tier"
    cidr: "10.0.3.0/24"
    services:
      - mysql
      - redis
      - nacos
    
  management:
    description: "Management and monitoring"
    cidr: "10.0.4.0/24"
    services:
      - monitoring
      - logging
      - backup_services
```

#### Firewall Rules

```bash
# iptables rules for OpenWES
#!/bin/bash

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# HTTP/HTTPS access to reverse proxy
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# SSH access (restrict to management network)
iptables -A INPUT -p tcp -s 10.0.4.0/24 --dport 22 -j ACCEPT

# Application tier access from DMZ
iptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 8080 -j ACCEPT
iptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 8081 -j ACCEPT
iptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 8082 -j ACCEPT

# Database access from application tier only
iptables -A INPUT -p tcp -s 10.0.2.0/24 --dport 3306 -j ACCEPT
iptables -A INPUT -p tcp -s 10.0.2.0/24 --dport 6379 -j ACCEPT
iptables -A INPUT -p tcp -s 10.0.2.0/24 --dport 8848 -j ACCEPT

# Drop everything else
iptables -A INPUT -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Container Security

#### Docker Security Configuration

```yaml
# docker-compose.security.yml
version: '3.8'

services:
  wes-server:
    image: openwes/wes-server:latest
    user: "1001:1001"  # Non-root user
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
      - apparmor:docker-default
    sysctls:
      - net.ipv4.ip_unprivileged_port_start=0
    ulimits:
      nproc: 65535
      nofile: 65535
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  mysql:
    image: mysql:8.0
    user: "999:999"
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=200m
      - /var/run/mysqld:noexec,nosuid,size=10m
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - SETGID
      - SETUID
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined
```

#### Kubernetes Security Policies

```yaml
# pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: openwes-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  readOnlyRootFilesystem: true
```

### Database Security

#### MySQL Security Hardening

```sql
-- Remove default accounts
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Create application user with minimal privileges
CREATE USER 'openwes_app'@'10.0.2.%' IDENTIFIED BY 'strong_random_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON openwes.* TO 'openwes_app'@'10.0.2.%';

-- Enable SSL
ALTER USER 'openwes_app'@'10.0.2.%' REQUIRE SSL;

-- Configure secure settings
SET GLOBAL log_bin_trust_function_creators = 0;
SET GLOBAL local_infile = 0;
SET GLOBAL secure_file_priv = '/var/lib/mysql-files/';

-- Enable audit logging
INSTALL PLUGIN audit_log SONAME 'audit_log.so';
SET GLOBAL audit_log_policy = 'ALL';

-- Flush privileges
FLUSH PRIVILEGES;
```

#### Redis Security Configuration

```bash
# redis.conf security settings
# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG "CONFIG_9f2c4e7a8b3d1e6f"
rename-command SHUTDOWN "SHUTDOWN_a1b2c3d4e5f6"

# Authentication
requirepass your_very_strong_password_here

# Network security
bind 127.0.0.1 10.0.3.100
protected-mode yes

# SSL/TLS
port 0
tls-port 6380
tls-cert-file /etc/ssl/certs/redis.crt
tls-key-file /etc/ssl/private/redis.key
tls-ca-cert-file /etc/ssl/certs/ca.crt

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
syslog-enabled yes
```

## Application Security

### Secure Configuration Management

#### Environment Variables Security

```bash
# .env.production (never commit to version control)
# Use a secrets management system in production

# Database credentials
MYSQL_PASSWORD=$(vault kv get -field=password secret/openwes/mysql)
REDIS_PASSWORD=$(vault kv get -field=password secret/openwes/redis)

# API keys
JWT_SECRET=$(vault kv get -field=jwt_secret secret/openwes/auth)
ENCRYPTION_KEY=$(vault kv get -field=encryption_key secret/openwes/crypto)

# External service credentials
AWS_ACCESS_KEY_ID=$(vault kv get -field=access_key secret/openwes/aws)
AWS_SECRET_ACCESS_KEY=$(vault kv get -field=secret_key secret/openwes/aws)
```

#### Vault Integration

```java
// VaultConfigService.java
@Service
public class VaultConfigService {
    
    @Value("${vault.token}")
    private String vaultToken;
    
    @Value("${vault.url}")
    private String vaultUrl;
    
    private VaultTemplate vaultTemplate;
    
    @PostConstruct
    public void initVault() {
        VaultEndpoint endpoint = VaultEndpoint.from(URI.create(vaultUrl));
        TokenAuthentication auth = new TokenAuthentication(vaultToken);
        this.vaultTemplate = new VaultTemplate(endpoint, auth);
    }
    
    public String getSecret(String path, String key) {
        VaultResponse response = vaultTemplate.read(path);
        return response != null ? (String) response.getData().get(key) : null;
    }
    
    public void rotateSecret(String path, String key, String newValue) {
        Map<String, Object> data = new HashMap<>();
        data.put(key, newValue);
        vaultTemplate.write(path, data);
    }
}
```

### Input Validation and Sanitization

#### Request Validation

```java
// RequestValidationAspect.java
@Aspect
@Component
public class RequestValidationAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(RequestValidationAspect.class);
    
    @Before("@annotation(ValidateRequest)")
    public void validateRequest(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        
        for (Object arg : args) {
            if (arg instanceof String) {
                validateStringInput((String) arg);
            } else if (arg instanceof Map) {
                validateMapInput((Map<?, ?>) arg);
            }
        }
    }
    
    private void validateStringInput(String input) {
        if (input == null) return;
        
        // Check for SQL injection patterns
        String[] sqlPatterns = {"'", "--", ";", "/*", "*/", "xp_", "sp_"};
        for (String pattern : sqlPatterns) {
            if (input.toLowerCase().contains(pattern)) {
                throw new SecurityException("Potential SQL injection detected: " + pattern);
            }
        }
        
        // Check for XSS patterns
        String[] xssPatterns = {"<script", "javascript:", "onload=", "onerror="};
        for (String pattern : xssPatterns) {
            if (input.toLowerCase().contains(pattern)) {
                throw new SecurityException("Potential XSS attack detected: " + pattern);
            }
        }
        
        // Check input length
        if (input.length() > 10000) {
            throw new SecurityException("Input too long, potential DoS attack");
        }
    }
    
    private void validateMapInput(Map<?, ?> map) {
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (entry.getValue() instanceof String) {
                validateStringInput((String) entry.getValue());
            }
        }
    }
}
```

#### Data Sanitization

```java
// DataSanitizer.java
@Component
public class DataSanitizer {
    
    private final HtmlSanitizer htmlSanitizer;
    
    public DataSanitizer() {
        this.htmlSanitizer = HtmlSanitizer.builder()
                .allowCommonInlineFormattingElements()
                .allowCommonBlockElements()
                .allowStyling()
                .allowLinks()
                .toFactory()
                .sanitizer();
    }
    
    public String sanitizeHtml(String input) {
        if (input == null) return null;
        return htmlSanitizer.sanitize(input);
    }
    
    public String sanitizeSql(String input) {
        if (input == null) return null;
        return input.replaceAll("[';\\-\\-]", "");
    }
    
    public String sanitizeFilename(String filename) {
        if (filename == null) return null;
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
    
    public Map<String, Object> sanitizeMap(Map<String, Object> map) {
        Map<String, Object> sanitized = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = sanitizeSql(entry.getKey());
            Object value = entry.getValue();
            
            if (value instanceof String) {
                value = sanitizeHtml((String) value);
            }
            
            sanitized.put(key, value);
        }
        
        return sanitized;
    }
}
```

## Threat Protection

### DDoS Protection

#### Rate Limiting Implementation

```java
// RateLimitingFilter.java
@Component
public class RateLimitingFilter implements Filter {
    
    private final RedisTemplate<String, Integer> redisTemplate;
    private final RateLimitConfig rateLimitConfig;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientIp = getClientIp(httpRequest);
        String endpoint = httpRequest.getRequestURI();
        
        if (isRateLimited(clientIp, endpoint)) {
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.getWriter().write("Rate limit exceeded");
            return;
        }
        
        chain.doFilter(request, response);
    }
    
    private boolean isRateLimited(String clientIp, String endpoint) {
        String key = "rate_limit:" + clientIp + ":" + endpoint;
        String windowKey = key + ":" + getCurrentWindow();
        
        Integer requests = redisTemplate.opsForValue().get(windowKey);
        if (requests == null) {
            requests = 0;
        }
        
        int limit = rateLimitConfig.getLimit(endpoint);
        
        if (requests >= limit) {
            return true;
        }
        
        redisTemplate.opsForValue().increment(windowKey);
        redisTemplate.expire(windowKey, Duration.ofMinutes(1));
        
        return false;
    }
    
    private long getCurrentWindow() {
        return System.currentTimeMillis() / 60000; // 1-minute windows
    }
}
```

#### Nginx Rate Limiting

```nginx
# nginx.conf
http {
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=public:10m rate=1000r/m;
    
    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
    
    server {
        # General rate limiting
        limit_req zone=public burst=50 nodelay;
        limit_conn conn_limit_per_ip 20;
        
        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
        }
        
        # Login endpoint
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
        }
        
        # Block suspicious patterns
        location ~* \.(sql|bak|backup)$ {
            deny all;
        }
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000";
        add_header Content-Security-Policy "default-src 'self'";
    }
}
```

### Intrusion Detection

#### Log Analysis

```python
# security_monitor.py
import re
import json
from datetime import datetime, timedelta
from collections import defaultdict

class SecurityMonitor:
    def __init__(self):
        self.suspicious_patterns = [
            r'SELECT.*FROM.*information_schema',
            r'UNION.*SELECT',
            r'<script.*>',
            r'javascript:',
            r'\.\.\/.*\.\.\/.*\.\.\/',
            r'\/etc\/passwd',
            r'cmd\.exe',
            r'powershell\.exe'
        ]
        
        self.failed_attempts = defaultdict(list)
        self.suspicious_ips = set()
    
    def analyze_log_entry(self, log_entry):
        timestamp = log_entry.get('timestamp')
        ip_address = log_entry.get('ip_address')
        request_uri = log_entry.get('request_uri', '')
        user_agent = log_entry.get('user_agent', '')
        status_code = log_entry.get('status_code')
        
        # Check for suspicious patterns
        for pattern in self.suspicious_patterns:
            if re.search(pattern, request_uri, re.IGNORECASE):
                self.alert_suspicious_activity(ip_address, pattern, log_entry)
        
        # Track failed authentication attempts
        if status_code == 401 and '/api/auth/' in request_uri:
            self.track_failed_attempt(ip_address, timestamp)
        
        # Check for brute force attacks
        if self.is_brute_force_attack(ip_address):
            self.alert_brute_force(ip_address)
            self.suspicious_ips.add(ip_address)
    
    def track_failed_attempt(self, ip_address, timestamp):
        self.failed_attempts[ip_address].append(timestamp)
        
        # Keep only recent attempts (last hour)
        cutoff = datetime.now() - timedelta(hours=1)
        self.failed_attempts[ip_address] = [
            ts for ts in self.failed_attempts[ip_address] 
            if datetime.fromisoformat(ts) > cutoff
        ]
    
    def is_brute_force_attack(self, ip_address):
        return len(self.failed_attempts[ip_address]) > 10
    
    def alert_suspicious_activity(self, ip_address, pattern, log_entry):
        alert = {
            'type': 'suspicious_pattern',
            'ip_address': ip_address,
            'pattern': pattern,
            'timestamp': datetime.now().isoformat(),
            'log_entry': log_entry
        }
        self.send_alert(alert)
    
    def alert_brute_force(self, ip_address):
        alert = {
            'type': 'brute_force_attack',
            'ip_address': ip_address,
            'failed_attempts': len(self.failed_attempts[ip_address]),
            'timestamp': datetime.now().isoformat()
        }
        self.send_alert(alert)
    
    def send_alert(self, alert):
        # Send to SIEM, Slack, email, etc.
        print(f"SECURITY ALERT: {json.dumps(alert, indent=2)}")
```

## Vulnerability Management

### Dependency Scanning

```bash
#!/bin/bash
# security-scan.sh

echo "Running security scans..."

# Java dependencies (Maven)
if [ -f "pom.xml" ]; then
    echo "Scanning Java dependencies..."
    mvn org.owasp:dependency-check-maven:check
fi

# Node.js dependencies
if [ -f "package.json" ]; then
    echo "Scanning Node.js dependencies..."
    npm audit --audit-level high
    npx retire --severity high
fi

# Docker images
echo "Scanning Docker images..."
for image in $(docker images --format "{{.Repository}}:{{.Tag}}" | grep openwes); do
    echo "Scanning $image..."
    trivy image --severity HIGH,CRITICAL $image
done

# Infrastructure scanning
echo "Scanning infrastructure..."
nmap -sV -sC localhost

# SSL/TLS configuration
echo "Checking SSL configuration..."
testssl.sh --severity HIGH https://your-openwes-instance.com

echo "Security scan completed."
```

### Automated Patching

```yaml
# .github/workflows/security-updates.yml
name: Security Updates

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM
  workflow_dispatch:

jobs:
  security-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update Java dependencies
        run: |
          mvn versions:use-latest-versions -DallowMajorUpdates=false
          mvn clean compile test
      
      - name: Update Node.js dependencies
        run: |
          npm update
          npm audit fix
          npm test
      
      - name: Update Docker base images
        run: |
          docker pull openjdk:17-jre-slim
          docker pull node:18-alpine
          docker pull mysql:8.0
          docker pull redis:7-alpine
      
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v4
        with:
          title: 'Security Updates - Automated'
          body: 'Automated security updates for dependencies and base images'
          branch: security-updates
```

## Compliance and Auditing

### Audit Logging

```java
// AuditLogger.java
@Component
public class AuditLogger {
    
    private final Logger auditLog = LoggerFactory.getLogger("AUDIT");
    
    public void logUserAction(String userId, String action, String resource, 
                             Map<String, Object> details) {
        AuditEvent event = AuditEvent.builder()
                .timestamp(Instant.now())
                .userId(userId)
                .action(action)
                .resource(resource)
                .details(details)
                .ipAddress(getCurrentUserIp())
                .userAgent(getCurrentUserAgent())
                .build();
        
        auditLog.info(JsonUtils.toJson(event));
    }
    
    public void logSecurityEvent(String eventType, String description, 
                                String severity) {
        SecurityEvent event = SecurityEvent.builder()
                .timestamp(Instant.now())
                .eventType(eventType)
                .description(description)
                .severity(severity)
                .ipAddress(getCurrentUserIp())
                .build();
        
        auditLog.warn(JsonUtils.toJson(event));
    }
    
    public void logSystemEvent(String component, String event, 
                              Map<String, Object> metadata) {
        SystemEvent systemEvent = SystemEvent.builder()
                .timestamp(Instant.now())
                .component(component)
                .event(event)
                .metadata(metadata)
                .build();
        
        auditLog.info(JsonUtils.toJson(systemEvent));
    }
}
```

### Compliance Reporting

```java
// ComplianceReportService.java
@Service
public class ComplianceReportService {
    
    public ComplianceReport generateSOC2Report(LocalDate startDate, LocalDate endDate) {
        return ComplianceReport.builder()
                .reportType("SOC2")
                .period(DateRange.of(startDate, endDate))
                .controls(generateSOC2Controls())
                .findings(auditFindings(startDate, endDate))
                .recommendations(generateRecommendations())
                .build();
    }
    
    public ComplianceReport generateGDPRReport(LocalDate startDate, LocalDate endDate) {
        return ComplianceReport.builder()
                .reportType("GDPR")
                .period(DateRange.of(startDate, endDate))
                .dataProcessingActivities(getDataProcessingActivities())
                .dataSubjectRequests(getDataSubjectRequests(startDate, endDate))
                .breachNotifications(getBreachNotifications(startDate, endDate))
                .build();
    }
    
    private List<ControlAssessment> generateSOC2Controls() {
        return Arrays.asList(
            assessControl("CC6.1", "Logical Access Controls", this::assessLogicalAccess),
            assessControl("CC6.2", "Authentication", this::assessAuthentication),
            assessControl("CC6.3", "Authorization", this::assessAuthorization),
            assessControl("CC7.1", "Threat Protection", this::assessThreatProtection)
        );
    }
}
```

## Security Monitoring Dashboard

### Metrics Collection

```yaml
# prometheus-security.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'security-metrics'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 30s

rule_files:
  - "security-alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Security Alerts

```yaml
# security-alerts.yml
groups:
  - name: security-alerts
    rules:
      - alert: HighFailedLoginRate
        expr: rate(failed_login_attempts_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High rate of failed login attempts"
          
      - alert: SuspiciousIPActivity
        expr: rate(suspicious_requests_total[5m]) > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Suspicious activity from IP address"
          
      - alert: UnauthorizedAccessAttempt
        expr: rate(unauthorized_access_attempts_total[5m]) > 1
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Unauthorized access attempt detected"
```

This comprehensive security guide provides the foundation for a secure OpenWES deployment, covering infrastructure, application, and operational security aspects.