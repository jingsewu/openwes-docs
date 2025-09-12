---
id: security
title: OpenWES Security Implementation
sidebar_position: 4
---

# OpenWES Security Implementation

This guide details how security is implemented in OpenWES, covering authentication mechanisms, authorization frameworks, data protection, and security architecture used in the system.

## Security Architecture Overview

### Multi-Layer Security Model

OpenWES implements a comprehensive security architecture with multiple layers:

```
┌─────────────────────────────────────────────────────────┐
│                 API Gateway Layer                       │
│  • Rate Limiting  • Request Validation  • SSL/TLS      │
├─────────────────────────────────────────────────────────┤
│               Authentication Layer                      │
│  • JWT Tokens  • API Keys  • Session Management        │
├─────────────────────────────────────────────────────────┤
│                Authorization Layer                       │
│  • RBAC  • Resource Permissions  •Tenant Isolation    │
├─────────────────────────────────────────────────────────┤
│              Application Security                       │
│  • Input Validation  • SQL Injection Prevention        │
├─────────────────────────────────────────────────────────┤
│                Data Layer Security                      │
│  • Encryption at Rest  • Audit Logging  • Backup       │
└─────────────────────────────────────────────────────────┘
```

### Service Communication Security

```java
// Service-to-service authentication using Nacos
@Configuration
public class ServiceSecurityConfig {
    
    @Bean
    public NacosConfigProperties nacosConfigProperties() {
        NacosConfigProperties properties = new NacosConfigProperties();
        properties.setServerAddr("${nacos.server-addr}");
        properties.setUsername("${nacos.username}");
        properties.setPassword("${nacos.password}");
        properties.setNamespace("${nacos.namespace}");
        return properties;
    }
}
```

## Authentication Implementation

### JWT Token-Based Authentication

OpenWES uses JWT (JSON Web Tokens) for stateless authentication across all services.

#### JWT Token Structure

```java
// JWT Token Service Implementation
@Service
public class JwtTokenService {
    
    private final String jwtSecret = "${openwes.jwt.secret}";
    private final int jwtExpirationMs = 86400000; // 24 hours
    
    public String generateJwtToken(UserPrincipal userPrincipal) {
        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .claim("userId", userPrincipal.getId())
                .claim("warehouseCode", userPrincipal.getWarehouseCode())
                .claim("roles", userPrincipal.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }
    
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }
}
```

#### Authentication Filter Chain

```java
// JWT Authentication Filter
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String jwt = getJwtFromRequest(request);
        
        if (StringUtils.hasText(jwt) && jwtTokenService.validateJwtToken(jwt)) {
            String username = jwtTokenService.getUsernameFromJwtToken(jwt);
            
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### API Key Authentication

For system-to-system integration, OpenWES implements API key authentication.

```java
// API Key Authentication
@Component
public class ApiKeyAuthenticationProvider implements AuthenticationProvider {
    
    @Autowired
    private ApiKeyRepository apiKeyRepository;
    
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String apiKey = (String) authentication.getCredentials();
        
        Optional<ApiKeyEntity> apiKeyEntity = apiKeyRepository.findByKeyValue(apiKey);
        
        if (apiKeyEntity.isPresent() && apiKeyEntity.get().isActive()) {
            ApiKeyEntity keyEntity = apiKeyEntity.get();
            
            // Check expiration
            if (keyEntity.getExpiresAt() != null && keyEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new BadCredentialsException("API key has expired");
            }
            
            // Check IP restrictions
            if (!isIpAllowed(keyEntity, getClientIp())) {
                throw new BadCredentialsException("IP address not allowed");
            }
            
            // Update last used timestamp
            keyEntity.setLastUsedAt(LocalDateTime.now());
            apiKeyRepository.save(keyEntity);
            
            return new ApiKeyAuthenticationToken(apiKey, keyEntity.getPermissions());
        }
        
        throw new BadCredentialsException("Invalid API key");
    }
}
```

### Multi-Factor Authentication (MFA)

```java
// TOTP-based MFA implementation
@Service
public class MfaService {
    
    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return new String(Base32.encode(bytes));
    }
    
    public boolean validateTotp(String secretKey, String totpCode) {
        long timeWindow = System.currentTimeMillis() / 30000;
        
        // Check current time window and previous/next for clock skew
        for (int i = -1; i <= 1; i++) {
            String expectedCode = generateTotpCode(secretKey, timeWindow + i);
            if (totpCode.equals(expectedCode)) {
                return true;
            }
        }
        return false;
    }
    
    private String generateTotpCode(String secretKey, long timeWindow) {
        byte[] key = Base32.decode(secretKey);
        byte[] timeBytes = ByteBuffer.allocate(8).putLong(timeWindow).array();
        
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(timeBytes);
            
            int offset = hash[hash.length - 1] & 0x0f;
            int code = ((hash[offset] & 0x7f) << 24) |
                      ((hash[offset + 1] & 0xff) << 16) |
                      ((hash[offset + 2] & 0xff) << 8) |
                      (hash[offset + 3] & 0xff);
            
            return String.format("%06d", code % 1000000);
        } catch (Exception e) {
            throw new RuntimeException("Error generating TOTP code", e);
        }
    }
}
```

## Authorization Framework

### Role-Based Access Control (RBAC)

OpenWES implements a hierarchical RBAC system with warehouse-level isolation.

#### Role Definition

```java
// Role entity with hierarchical permissions
@Entity
@Table(name = "roles")
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String roleName;
    
    private String description;
    
    @Enumerated(EnumType.STRING)
    private RoleType roleType; // SYSTEM, WAREHOUSE, CUSTOM
    
    @Column(columnDefinition = "JSON")
    private Set<String> permissions;
    
    private String warehouseCode; // null for system-wide roles
    
    @ManyToOne
    @JoinColumn(name = "parent_role_id")
    private Role parentRole; // Role inheritance
}

// Permission constants
public class Permissions {
    // Order management
    public static final String ORDER_CREATE = "order:create";
    public static final String ORDER_READ = "order:read";
    public static final String ORDER_UPDATE = "order:update";
    public static final String ORDER_DELETE = "order:delete";
    
    // Inventory management
    public static final String INVENTORY_READ = "inventory:read";
    public static final String INVENTORY_ADJUST = "inventory:adjust";
    public static final String INVENTORY_COUNT = "inventory:count";
    
    // Task management
    public static final String TASK_ASSIGN = "task:assign";
    public static final String TASK_EXECUTE = "task:execute";
    public static final String TASK_MONITOR = "task:monitor";
    
    // System administration
    public static final String USER_MANAGE = "user:manage";
    public static final String SYSTEM_CONFIG = "system:config";
    public static final String AUDIT_VIEW = "audit:view";
}
```

#### Permission Checking

```java
// Method-level security using Spring Security
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @PostMapping
    @PreAuthorize("hasPermission(#request.warehouseCode, 'warehouse', 'order:create')")
    public ResponseEntity<Order> createOrder(@RequestBody OrderCreateRequest request) {
        // Order creation logic
        return ResponseEntity.ok(orderService.createOrder(request));
    }
    
    @GetMapping("/{orderId}")
    @PreAuthorize("hasPermission(#orderId, 'order', 'order:read')")
    public ResponseEntity<Order> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrder(orderId));
    }
}

// Custom permission evaluator
@Component
public class WarehousePermissionEvaluator implements PermissionEvaluator {
    
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String permissionStr = (String) permission;
        
        // Check if user has the required permission
        if (principal.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(permissionStr))) {
            
            // Check warehouse-level access
            if (targetDomainObject instanceof String) {
                String warehouseCode = (String) targetDomainObject;
                return principal.hasWarehouseAccess(warehouseCode);
            }
            
            return true;
        }
        
        return false;
    }
}
```

### Resource-Level Security

```java
// Warehouse isolation at data level
@Entity
@Table(name = "orders")
@FilterDef(name = "warehouseFilter", parameters = @ParamDef(name = "warehouseCode", type = "string"))
@Filter(name = "warehouseFilter", condition = "warehouse_code = :warehouseCode")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "warehouse_code", nullable = false)
    private String warehouseCode;
    
    // Other fields...
}

// Automatic warehouse filtering
@Component
public class WarehouseSecurityInterceptor implements Interceptor {
    
    @Override
    public boolean onLoad(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        if (entity instanceof WarehouseAware) {
            UserPrincipal principal = getCurrentUser();
            if (principal != null) {
                WarehouseAware warehouseEntity = (WarehouseAware) entity;
                if (!principal.hasWarehouseAccess(warehouseEntity.getWarehouseCode())) {
                    throw new AccessDeniedException("No access to warehouse: " + warehouseEntity.getWarehouseCode());
                }
            }
        }
        return false;
    }
}
```

## Data Protection

### Encryption Implementation

#### Database Encryption

```java
// Sensitive data encryption
@Component
public class DataEncryptionService {
    
    private final AESUtil aesUtil;
    
    @EventListener
    public void handleEntityPrePersist(Object entity) {
        if (entity instanceof EncryptedEntity) {
            encryptSensitiveFields(entity);
        }
    }
    
    @EventListener
    public void handleEntityPostLoad(Object entity) {
        if (entity instanceof EncryptedEntity) {
            decryptSensitiveFields(entity);
        }
    }
    
    private void encryptSensitiveFields(Object entity) {
        Field[] fields = entity.getClass().getDeclaredFields();
        for (Field field : fields) {
            if (field.isAnnotationPresent(Encrypted.class)) {
                try {
                    field.setAccessible(true);
                    String value = (String) field.get(entity);
                    if (value != null) {
                        String encryptedValue = aesUtil.encrypt(value);
                        field.set(entity, encryptedValue);
                    }
                } catch (Exception e) {
                    logger.error("Failed to encrypt field: " + field.getName(), e);
                }
            }
        }
    }
}

// Custom annotation for encrypted fields
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Encrypted {
}

// Usage example
@Entity
public class UserCredential {
    
    @Encrypted
    private String password;
    
    @Encrypted
    private String apiSecret;
    
    // Other fields...
}
```

#### Configuration Encryption

```java
// Encrypted configuration properties
@ConfigurationProperties(prefix = "openwes.security")
@Component
public class SecurityProperties {
    
    @EncryptedProperty
    private String jwtSecret;
    
    @EncryptedProperty
    private String databasePassword;
    
    @EncryptedProperty
    private String redisPassword;
    
    // Getters and setters with automatic decryption
}

// Property decryption processor
@Component
public class EncryptedPropertyProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        Field[] fields = bean.getClass().getDeclaredFields();
        
        for (Field field : fields) {
            if (field.isAnnotationPresent(EncryptedProperty.class)) {
                try {
                    field.setAccessible(true);
                    String encryptedValue = (String) field.get(bean);
                    if (encryptedValue != null && encryptedValue.startsWith("ENC(")) {
                        String decryptedValue = decrypt(encryptedValue);
                        field.set(bean, decryptedValue);
                    }
                } catch (Exception e) {
                    throw new RuntimeException("Failed to decrypt property: " + field.getName(), e);
                }
            }
        }
        
        return bean;
    }
}
```

### Audit Logging

```java
// Comprehensive audit logging
@Component
public class SecurityAuditLogger {
    
    private final Logger auditLogger = LoggerFactory.getLogger("SECURITY_AUDIT");
    
    @EventListener
    public void logAuthenticationSuccess(AuthenticationSuccessEvent event) {
        UserPrincipal principal = (UserPrincipal) event.getAuthentication().getPrincipal();
        
        SecurityAuditEvent auditEvent = SecurityAuditEvent.builder()
                .eventType("AUTHENTICATION_SUCCESS")
                .userId(principal.getId())
                .username(principal.getUsername())
                .warehouseCode(principal.getWarehouseCode())
                .ipAddress(getClientIp())
                .userAgent(getUserAgent())
                .timestamp(Instant.now())
                .build();
        
        auditLogger.info(JsonUtils.toJson(auditEvent));
    }
    
    @EventListener
    public void logAuthenticationFailure(AbstractAuthenticationFailureEvent event) {
        SecurityAuditEvent auditEvent = SecurityAuditEvent.builder()
                .eventType("AUTHENTICATION_FAILURE")
                .username(event.getAuthentication().getName())
                .failureReason(event.getException().getMessage())
                .ipAddress(getClientIp())
                .userAgent(getUserAgent())
                .timestamp(Instant.now())
                .build();
        
        auditLogger.warn(JsonUtils.toJson(auditEvent));
    }
    
    @EventListener
    public void logDataAccess(DataAccessEvent event) {
        SecurityAuditEvent auditEvent = SecurityAuditEvent.builder()
                .eventType("DATA_ACCESS")
                .userId(getCurrentUserId())
                .resource(event.getResourceType())
                .resourceId(event.getResourceId())
                .action(event.getAction())
                .warehouseCode(event.getWarehouseCode())
                .timestamp(Instant.now())
                .build();
        
        auditLogger.info(JsonUtils.toJson(auditEvent));
    }
}
```

## Input Validation and Security

### Request Validation

```java
// Comprehensive input validation
@Component
public class SecurityValidationAspect {
    
    @Around("@annotation(ValidateSecureInput)")
    public Object validateInput(ProceedingJoinPoint joinPoint) throws Throwable {
        Object[] args = joinPoint.getArgs();
        
        for (Object arg : args) {
            if (arg instanceof String) {
                validateStringInput((String) arg);
            } else if (arg instanceof Map) {
                validateMapInput((Map<?, ?>) arg);
            } else {
                validateObjectInput(arg);
            }
        }
        
        return joinPoint.proceed();
    }
    
    private void validateStringInput(String input) {
        if (input == null) return;
        
        // SQL injection prevention
        if (containsSqlInjectionPatterns(input)) {
            throw new SecurityException("Potential SQL injection detected");
        }
        
        // XSS prevention
        if (containsXssPatterns(input)) {
            throw new SecurityException("Potential XSS attack detected");
        }
        
        // Path traversal prevention
        if (containsPathTraversalPatterns(input)) {
            throw new SecurityException("Path traversal attempt detected");
        }
        
        // Length validation
        if (input.length() > MAX_INPUT_LENGTH) {
            throw new SecurityException("Input exceeds maximum allowed length");
        }
    }
    
    private boolean containsSqlInjectionPatterns(String input) {
        String[] sqlPatterns = {
            "'", "--", ";", "/*", "*/", "xp_", "sp_", "union", "select", "insert", 
            "update", "delete", "drop", "create", "alter", "exec", "execute"
        };
        
        String lowerInput = input.toLowerCase();
        return Arrays.stream(sqlPatterns)
                .anyMatch(lowerInput::contains);
    }
}
```

### Data Sanitization

```java
// Output sanitization
@Component
public class ResponseSanitizer implements ResponseBodyAdvice<Object> {
    
    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, 
                                 MediaType selectedContentType, Class<? extends HttpMessageConverter<?>> selectedConverterType, 
                                 ServerHttpRequest request, ServerHttpResponse response) {
        
        if (body instanceof String) {
            return sanitizeString((String) body);
        } else if (body instanceof Map) {
            return sanitizeMap((Map<?, ?>) body);
        } else if (body instanceof Collection) {
            return sanitizeCollection((Collection<?>) body);
        } else {
            return sanitizeObject(body);
        }
    }
    
    private String sanitizeString(String input) {
        if (input == null) return null;
        
        // Remove potentially harmful characters
        return input.replaceAll("<script[^>]*>.*?</script>", "")
                   .replaceAll("<[^>]+>", "")
                   .replaceAll("[\\r\\n\\t]", " ")
                   .trim();
    }
}
```

## Session Management

```java
// Redis-based session management
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // 30 minutes
public class SessionConfig {
    
    @Bean
    public LettuceConnectionFactory connectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("${redis.host}");
        config.setPort(Integer.parseInt("${redis.port}"));
        config.setPassword("${redis.password}");
        
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
        factory.setValidateConnection(true);
        return factory;
    }
    
    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }
}

// Session security events
@EventListener
public void sessionCreated(HttpSessionCreatedEvent event) {
    HttpSession session = event.getSession();
    
    // Set security attributes
    session.setAttribute("createdAt", Instant.now());
    session.setAttribute("ipAddress", getClientIp());
    session.setAttribute("userAgent", getUserAgent());
    
    // Log session creation
    logger.info("Session created: {}", session.getId());
}

@EventListener
public void sessionDestroyed(HttpSessionDestroyedEvent event) {
    HttpSession session = event.getSession();
    
    // Clean up session-related data
    sessionCleanupService.cleanup(session.getId());
    
    // Log session destruction
    logger.info("Session destroyed: {}", session.getId());
}
```

## Security Configuration

### Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and().csrf().disable()
            .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );
        
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(apiKeyAuthenticationFilter(), JwtAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

### Security Monitoring

```java
// Real-time security monitoring
@Component
public class SecurityMonitor {
    
    private final MeterRegistry meterRegistry;
    private final Counter failedLoginAttempts;
    private final Counter suspiciousRequests;
    
    public SecurityMonitor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.failedLoginAttempts = Counter.builder("security.failed.logins")
                .description("Number of failed login attempts")
                .register(meterRegistry);
        this.suspiciousRequests = Counter.builder("security.suspicious.requests")
                .description("Number of suspicious requests detected")
                .register(meterRegistry);
    }
    
    @EventListener
    public void handleAuthenticationFailure(AuthenticationFailureEvent event) {
        failedLoginAttempts.increment(
            Tags.of(
                "username", event.getAuthentication().getName(),
                "ip", getClientIp(),
                "reason", event.getException().getClass().getSimpleName()
            )
        );
        
        // Check for brute force attacks
        checkBruteForceAttack(event.getAuthentication().getName(), getClientIp());
    }
    
    private void checkBruteForceAttack(String username, String ipAddress) {
        int failedAttempts = getFailedAttempts(username, ipAddress);
        
        if (failedAttempts > BRUTE_FORCE_THRESHOLD) {
            // Block IP address
            ipBlockingService.blockIp(ipAddress, Duration.ofHours(1));
            
            // Send security alert
            securityAlertService.sendBruteForceAlert(username, ipAddress, failedAttempts);
            
            logger.warn("Brute force attack detected from IP: {} for username: {}", ipAddress, username);
        }
    }
}
```

## Security Best Practices for OpenWES

### Configuration Security

```yaml
# application-security.yml
openwes:
  security:
    jwt:
      secret: ${JWT_SECRET:your-256-bit-secret}
      expiration: 86400000
    api-keys:
      enabled: true
      rate-limit: 1000
    session:
      timeout: 1800
      redis-namespace: "openwes:session"
    audit:
      enabled: true
      retention-days: 90
```

### Database Security Configuration

```sql
-- Security-focused database setup
CREATE USER 'openwes_app'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON openwes.* TO 'openwes_app'@'%';

-- Enable SSL connections
ALTER USER 'openwes_app'@'%' REQUIRE SSL;

-- Audit table for security events
CREATE TABLE security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id BIGINT,
    username VARCHAR(100),
    ip_address VARCHAR(45),
    event_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
);
```

This comprehensive guide demonstrates how security is actually implemented in OpenWES, showing real code examples and architectural patterns used to protect the system and its data.
