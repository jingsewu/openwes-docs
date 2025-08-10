---
id: authentication
title: Authentication & Security
sidebar_position: 3
---

# Authentication & Security

This guide covers authentication methods, security best practices, and access control mechanisms for OpenWES APIs and integrations.

## API Authentication

### API Key Authentication

OpenWES uses API key-based authentication for external integrations. API keys provide a secure way to authenticate requests without exposing user credentials.

#### Obtaining API Keys

1. **Admin Portal Access**
```bash
# Access the OpenWES admin portal
https://your-openwes-instance.com/admin

# Navigate to: System Settings > API Management > API Keys
```

2. **Create New API Key**
```json
{
  "keyName": "External WMS Integration",
  "description": "API key for WMS system integration",
  "permissions": [
    "orders:read",
    "orders:write", 
    "inventory:read",
    "tasks:read"
  ],
  "expiresAt": "2024-12-31T23:59:59Z",
  "ipWhitelist": [
    "192.168.1.100",
    "10.0.0.0/8"
  ]
}
```

#### Using API Keys

**HTTP Headers**
```http
POST /api-platform/api/execute
Content-Type: application/json
X-API-KEY: your-api-key-here
X-Tenant-Id: your-tenant-id
X-Request-ID: unique-request-id
```

**cURL Example**
```bash
curl -X POST https://your-openwes-instance.com/api-platform/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sk_live_1234567890abcdef" \
  -H "X-Tenant-Id: tenant_123" \
  -H "X-Request-ID: req_$(date +%s)" \
  -d '{
    "apiType": "SKU_CREATE",
    "body": [...]
  }'
```

### JWT Token Authentication

For web applications and user sessions, OpenWES uses JWT (JSON Web Tokens) for authentication.

#### Login Process

```javascript
// Login request
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'user@company.com',
    password: 'secure_password',
    warehouseCode: 'WH-001'
  })
});

const { token, refreshToken } = await loginResponse.json();

// Store tokens securely
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

#### Using JWT Tokens

```javascript
// Authenticated API requests
const response = await fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
```

#### Token Refresh

```javascript
// Refresh expired tokens
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });
  
  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('accessToken', token);
    return token;
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
};
```

### OAuth 2.0 Integration

For third-party applications, OpenWES supports OAuth 2.0 authorization code flow.

#### Authorization Flow

1. **Authorization Request**
```http
GET /oauth/authorize?
  response_type=code&
  client_id=your_client_id&
  redirect_uri=https://your-app.com/callback&
  scope=orders:read inventory:read&
  state=random_state_string
```

2. **Token Exchange**
```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=authorization_code_here&
redirect_uri=https://your-app.com/callback&
client_id=your_client_id&
client_secret=your_client_secret
```

3. **Access Protected Resources**
```http
GET /api/orders
Authorization: Bearer access_token_here
```

## Role-Based Access Control (RBAC)

### User Roles

OpenWES implements a hierarchical role system:

```yaml
roles:
  super_admin:
    description: "Full system access"
    permissions: ["*"]
    
  warehouse_manager:
    description: "Warehouse management"
    permissions:
      - "orders:*"
      - "inventory:*"
      - "users:read"
      - "reports:*"
      
  warehouse_operator:
    description: "Daily operations"
    permissions:
      - "orders:read"
      - "tasks:*"
      - "inventory:read"
      - "station:*"
      
  integration_service:
    description: "External system integration"
    permissions:
      - "orders:create"
      - "orders:update"
      - "inventory:read"
      - "callbacks:receive"
```

### Permission System

Permissions follow the format: `resource:action`

**Resources:**
- `orders` - Inbound/outbound orders
- `inventory` - Stock and container management
- `tasks` - Work tasks and assignments
- `users` - User management
- `reports` - Reporting and analytics
- `station` - Work station operations
- `admin` - System administration

**Actions:**
- `read` - View/list resources
- `write` - Create/update resources
- `delete` - Remove resources
- `*` - All actions on resource

### Managing User Permissions

```sql
-- Create role
INSERT INTO roles (role_name, description, permissions) 
VALUES ('custom_role', 'Custom Role', '["orders:read", "inventory:read"]');

-- Assign role to user
INSERT INTO user_roles (user_id, role_id) 
VALUES (1, 2);

-- Check user permissions
SELECT r.role_name, r.permissions 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'operator@company.com';
```

## Security Best Practices

### API Key Security

1. **Key Rotation**
```bash
# Regular key rotation (every 90 days)
curl -X POST /api/admin/api-keys/rotate \
  -H "Authorization: Bearer admin_token" \
  -d '{"keyId": "key_123"}'
```

2. **IP Whitelisting**
```json
{
  "apiKey": "sk_live_1234567890abcdef",
  "ipWhitelist": [
    "192.168.1.100/32",
    "10.0.0.0/8",
    "172.16.0.0/12"
  ],
  "description": "Restrict access to internal networks only"
}
```

3. **Least Privilege Principle**
```json
{
  "apiKey": "sk_integration_abc123",
  "permissions": [
    "orders:create",
    "orders:read"
  ],
  "note": "Only grant minimum required permissions"
}
```

### Network Security

#### HTTPS/TLS Configuration

```yaml
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-openwes-instance.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

#### Rate Limiting

```yaml
# Application-level rate limiting
rate_limiting:
  api_keys:
    default: "1000/minute"
    premium: "5000/minute"
  
  endpoints:
    "/api/orders": "100/minute"
    "/api/inventory": "500/minute"
    "/api/auth/login": "10/minute"
```

### Data Protection

#### Encryption at Rest

```yaml
# Database encryption
mysql:
  encryption:
    enabled: true
    key_management: "vault"
    algorithm: "AES-256"

# File storage encryption
storage:
  encryption:
    enabled: true
    kms_key_id: "arn:aws:kms:region:account:key/key-id"
```

#### Encryption in Transit

```yaml
# Service communication
services:
  wes_server:
    tls:
      enabled: true
      cert_file: "/certs/wes-server.crt"
      key_file: "/certs/wes-server.key"
      
  database:
    ssl_mode: "require"
    ssl_cert: "/certs/client-cert.pem"
    ssl_key: "/certs/client-key.pem"
    ssl_ca: "/certs/ca-cert.pem"
```

### Audit and Monitoring

#### Access Logging

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event_type": "api_access",
  "user_id": "user_123",
  "api_key": "sk_***ef",
  "endpoint": "/api/orders",
  "method": "POST",
  "ip_address": "192.168.1.100",
  "user_agent": "OpenWES-Java-SDK/1.0",
  "response_code": 200,
  "request_size": 1024,
  "response_size": 512,
  "duration_ms": 250
}
```

#### Security Monitoring

```yaml
# Security alerts
alerts:
  - name: "Multiple Failed Logins"
    condition: "failed_logins > 5 in 5m"
    action: "block_ip"
    
  - name: "Unusual API Usage"
    condition: "api_calls > normal_threshold * 3"
    action: "alert_admin"
    
  - name: "Privilege Escalation"
    condition: "permission_denied && retry_count > 3"
    action: "alert_security_team"
```

## Multi-Tenant Security

### Tenant Isolation

```java
// Tenant context enforcement
@PreAuthorize("hasPermission(#warehouseCode, 'warehouse', 'access')")
public List<Order> getOrders(String warehouseCode) {
    String tenantId = SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal().getTenantId();
    
    return orderService.findByWarehouseAndTenant(warehouseCode, tenantId);
}
```

### Data Segregation

```sql
-- Row-level security policies
CREATE POLICY tenant_isolation ON orders
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## Compliance and Standards

### GDPR Compliance

```java
// Data anonymization
@Service
public class DataAnonymizationService {
    
    public void anonymizeUserData(Long userId) {
        userService.updateUser(userId, User.builder()
                .email("anonymized@example.com")
                .name("Anonymized User")
                .phone("***-***-****")
                .build());
    }
    
    public void deleteUserData(Long userId) {
        // Complete data removal
        orderService.anonymizeOrdersByUser(userId);
        userService.deleteUser(userId);
        auditService.logDataDeletion(userId);
    }
}
```

### SOC 2 Compliance

```yaml
# Security controls
controls:
  access_control:
    - multi_factor_authentication: required
    - session_timeout: 30_minutes
    - password_policy: enforced
    
  data_protection:
    - encryption_at_rest: enabled
    - encryption_in_transit: required
    - backup_encryption: enabled
    
  monitoring:
    - audit_logging: comprehensive
    - intrusion_detection: enabled
    - vulnerability_scanning: automated
```

## Security Incident Response

### Incident Types

1. **Data Breach**
2. **Unauthorized Access**
3. **System Compromise**
4. **DoS/DDoS Attacks**
5. **Malware/Ransomware**

### Response Procedures

```yaml
incident_response:
  detection:
    - automated_alerts
    - user_reports
    - security_monitoring
    
  containment:
    - isolate_affected_systems
    - disable_compromised_accounts
    - block_malicious_traffic
    
  investigation:
    - collect_evidence
    - analyze_logs
    - determine_scope
    
  recovery:
    - restore_systems
    - validate_integrity
    - monitor_for_recurrence
    
  lessons_learned:
    - document_incident
    - update_procedures
    - improve_controls
```

## Security Configuration Checklist

### Production Deployment

- [ ] HTTPS/TLS enabled with valid certificates
- [ ] API keys rotated and properly secured
- [ ] Rate limiting configured
- [ ] IP whitelisting implemented
- [ ] Database encryption enabled
- [ ] Audit logging configured
- [ ] Backup encryption enabled
- [ ] Monitoring and alerting set up
- [ ] Security headers configured
- [ ] Vulnerability scanning automated
- [ ] Incident response plan documented
- [ ] Staff security training completed

### Development Environment

- [ ] Separate API keys for development
- [ ] Test data anonymized
- [ ] Development databases isolated
- [ ] Code security scanning enabled
- [ ] Dependency vulnerability scanning
- [ ] Secrets management implemented
- [ ] Security testing automated

## Support and Resources

### Security Contact

- **Email**: security@openwes.com
- **Emergency**: +1-xxx-xxx-xxxx
- **GPG Key**: Available at keybase.io/openwes

### Documentation

- [Security Whitepaper](https://docs.openwes.top/security-whitepaper.pdf)
- [Compliance Certifications](https://docs.openwes.top/compliance/)
- [Security Best Practices](https://docs.openwes.top/security-best-practices/)

### Regular Security Updates

Subscribe to security advisories:
```bash
# Security mailing list
curl -X POST https://openwes.com/api/subscribe \
  -d '{"email": "security@yourcompany.com", "list": "security-advisories"}'
```

This comprehensive authentication and security guide ensures that your OpenWES implementation follows security best practices and compliance requirements.