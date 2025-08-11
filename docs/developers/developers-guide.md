---
id: developers-guide
title: Developers Guide
sidebar_position: 1
---

# 💻 Developers Guide

Welcome to the OpenWES Developers Guide! This section is designed for software developers, system integrators, and technical architects working with OpenWES APIs, customizations, and integrations.

## 🎯 What You'll Find Here

### Development & Integration
- **[API Reference](../api/api-client-to-wes.md)** - Complete REST API documentation
- **[Plugin Development](../advanced/plugin-development.md)** - Custom plugin creation and deployment
- **[System Integrations](../advanced/integrations.md)** - Integration patterns and best practices

### Key Areas for Developers

#### API Development
- RESTful API endpoints for all system functions
- GraphQL interface for flexible data queries
- Webhook framework for event-driven integrations
- SDK libraries for popular programming languages

#### Custom Extensions
- Plugin architecture for custom functionality
- Custom workflow development
- Business rule extensions
- UI component customization

#### System Integration
- ERP and WMS system connectivity
- Equipment and hardware integration
- Third-party service integration
- Data synchronization and transformation

#### DevOps & Deployment
- Containerized deployment with Docker/Kubernetes
- CI/CD pipeline setup and automation
- Monitoring and logging configuration
- Performance optimization and scaling

## 🚀 Quick Start for Developers

### Development Environment Setup

#### Prerequisites
```bash
# Core Requirements
Java 17+ (OpenJDK recommended)
Node.js 18+ with npm/yarn
Docker 20+ with Docker Compose
Git 2.30+

# Database Requirements
MySQL 8.0+
Redis 7.0+
Nacos 2.0+ (for configuration management)
```

#### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/openwes/openwes.git
cd openwes

# Start infrastructure services
docker-compose up -d mysql redis nacos

# Build and run WES server
./gradlew bootRun

# Start frontend development server
cd wes-ui
npm install
npm run dev
```

### API Quick Start

#### Authentication
```javascript
// Get authentication token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your-username',
    password: 'your-password',
    warehouseCode: 'WAREHOUSE-001'
  })
});

const { token } = await response.json();

// Use token for API calls
const apiResponse = await fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Basic API Usage
```javascript
// Create inbound order
const createOrder = async (orderData) => {
  const response = await fetch('/api-platform/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': 'your-api-key',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      apiType: 'INBOUND_PLAN_ORDER_CREATE',
      body: [orderData]
    })
  });
  
  return response.json();
};

// Query inventory
const getInventory = async (warehouseCode, skuCode) => {
  const response = await fetch(
    `/api/inventory?warehouse=${warehouseCode}&sku=${skuCode}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  return response.json();
};
```

## 🔧 Core Development Concepts

### Plugin Architecture

#### Plugin Structure
```
my-custom-plugin/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/mycompany/plugin/
│   │   │       ├── MyPlugin.java
│   │   │       ├── MyPluginConfiguration.java
│   │   │       └── handlers/
│   │   │           └── MyEventHandler.java
│   │   └── resources/
│   │       ├── plugin.yml
│   │       └── application-plugin.yml
│   └── test/
├── build.gradle
└── README.md
```

#### Plugin Development
```java
// Main plugin class
@Plugin(
    id = "my-custom-plugin",
    name = "My Custom Plugin",
    version = "1.0.0",
    description = "Custom warehouse operations plugin"
)
public class MyPlugin {
    
    @EventHandler
    public void onOrderCreated(OrderCreatedEvent event) {
        // Custom business logic
        processCustomOrderRules(event.getOrder());
    }
    
    @ApiEndpoint("/custom/orders")
    public ResponseEntity<List<Order>> getCustomOrders(
            @RequestParam String warehouseCode) {
        // Custom API endpoint
        return ResponseEntity.ok(customOrderService.getOrders(warehouseCode));
    }
}
```

### Custom Workflows

#### Workflow Definition
```yaml
# custom-workflow.yml
workflows:
  custom-receiving:
    name: "Custom Receiving Workflow"
    trigger: "INBOUND_ORDER_CREATED"
    steps:
      - name: "validate-order"
        type: "validation"
        handler: "com.mycompany.CustomOrderValidator"
        
      - name: "custom-allocation"
        type: "processing"
        handler: "com.mycompany.CustomAllocationHandler"
        
      - name: "notify-external-system"
        type: "integration"
        handler: "com.mycompany.ExternalNotificationHandler"
```

#### Workflow Implementation
```java
@Component
public class CustomOrderValidator implements WorkflowStepHandler {
    
    @Override
    public WorkflowResult execute(WorkflowContext context) {
        InboundOrder order = context.getOrder();
        
        // Custom validation logic
        if (!validateCustomRules(order)) {
            return WorkflowResult.failure("Custom validation failed");
        }
        
        return WorkflowResult.success();
    }
}
```

## 🌐 Integration Patterns

### REST API Integration

#### Synchronous Integration
```java
@RestController
@RequestMapping("/api/integration")
public class IntegrationController {
    
    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> createOrder(
            @RequestBody OrderRequest request) {
        
        try {
            // Process order
            Order order = orderService.createOrder(request);
            
            // Return response
            return ResponseEntity.ok(
                new OrderResponse(order.getId(), "SUCCESS")
            );
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new OrderResponse(null, "ERROR: " + e.getMessage()));
        }
    }
}
```

#### Asynchronous Integration
```java
@Component
public class AsyncIntegrationService {
    
    @EventListener
    @Async
    public void handleOrderCompletion(OrderCompletedEvent event) {
        // Send to external system asynchronously
        CompletableFuture.supplyAsync(() -> {
            try {
                externalSystemClient.notifyOrderCompletion(event);
                return "SUCCESS";
            } catch (Exception e) {
                logger.error("Failed to notify external system", e);
                // Schedule retry
                retryService.scheduleRetry(event, e);
                return "RETRY_SCHEDULED";
            }
        });
    }
}
```

### Message Queue Integration

#### RabbitMQ Integration
```java
@Component
public class MessageQueueHandler {
    
    @RabbitListener(queues = "wes.orders.inbound")
    public void processInboundOrder(InboundOrderMessage message) {
        try {
            // Process the order
            Order order = orderService.processInboundOrder(message);
            
            // Send confirmation
            rabbitTemplate.convertAndSend(
                "wes.orders.confirmations", 
                new OrderConfirmation(order.getId(), "PROCESSED")
            );
            
        } catch (Exception e) {
            // Send to error queue
            rabbitTemplate.convertAndSend(
                "wes.orders.errors", 
                new OrderError(message.getOrderId(), e.getMessage())
            );
        }
    }
    
    @EventListener
    public void publishOrderEvent(OrderEvent event) {
        rabbitTemplate.convertAndSend(
            "wes.events.orders", 
            event.getType().toString(),
            event
        );
    }
}
```

### Database Integration

#### Custom Repositories
```java
@Repository
public interface CustomOrderRepository extends JpaRepository<Order, Long> {
    
    @Query("SELECT o FROM Order o WHERE o.warehouseCode = :warehouse " +
           "AND o.status = :status AND o.createdTime >= :since")
    List<Order> findOrdersByWarehouseAndStatusSince(
        @Param("warehouse") String warehouseCode,
        @Param("status") OrderStatus status,
        @Param("since") LocalDateTime since
    );
    
    @Modifying
    @Query("UPDATE Order o SET o.priority = :priority " +
           "WHERE o.customerType = :customerType")
    int updatePriorityByCustomerType(
        @Param("priority") Integer priority,
        @Param("customerType") String customerType
    );
}
```

## 🏗️ Architecture Patterns

### Microservices Architecture

#### Service Communication
```java
// Service interface
@FeignClient(name = "inventory-service")
public interface InventoryServiceClient {
    
    @GetMapping("/api/inventory/{skuCode}")
    InventoryLevel getInventoryLevel(@PathVariable String skuCode);
    
    @PostMapping("/api/inventory/allocate")
    AllocationResult allocateInventory(@RequestBody AllocationRequest request);
}

// Service implementation
@Service
public class OrderProcessingService {
    
    private final InventoryServiceClient inventoryClient;
    
    public void processOrder(Order order) {
        for (OrderDetail detail : order.getDetails()) {
            // Check inventory availability
            InventoryLevel inventory = inventoryClient
                .getInventoryLevel(detail.getSkuCode());
            
            if (inventory.getAvailableQuantity() >= detail.getQuantity()) {
                // Allocate inventory
                AllocationRequest request = new AllocationRequest(
                    detail.getSkuCode(), 
                    detail.getQuantity()
                );
                inventoryClient.allocateInventory(request);
            }
        }
    }
}
```

### Event-Driven Architecture

#### Event Publishing
```java
@Component
public class EventPublisher {
    
    private final ApplicationEventPublisher applicationEventPublisher;
    
    public void publishOrderEvent(Order order, OrderEventType eventType) {
        OrderEvent event = OrderEvent.builder()
            .orderId(order.getId())
            .eventType(eventType)
            .timestamp(Instant.now())
            .warehouseCode(order.getWarehouseCode())
            .data(order)
            .build();
            
        applicationEventPublisher.publishEvent(event);
    }
}
```

#### Event Handling
```java
@Component
public class OrderEventHandler {
    
    @EventListener
    @Async
    public void handleOrderCreated(OrderCreatedEvent event) {
        // Validate order
        orderValidationService.validate(event.getOrder());
        
        // Allocate inventory
        inventoryService.allocate(event.getOrder());
        
        // Notify external systems
        externalNotificationService.notifyOrderCreated(event.getOrder());
    }
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderCompleted(OrderCompletedEvent event) {
        // Update external systems after transaction commit
        erpIntegrationService.updateOrderStatus(event.getOrder());
    }
}
```

## 🔍 Testing & Quality Assurance

### Unit Testing

#### Test Structure
```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    
    @Mock
    private OrderRepository orderRepository;
    
    @Mock
    private InventoryService inventoryService;
    
    @InjectMocks
    private OrderService orderService;
    
    @Test
    void shouldCreateOrderSuccessfully() {
        // Given
        OrderRequest request = OrderRequest.builder()
            .customerOrderNo("TEST-001")
            .warehouseCode("WH-001")
            .build();
            
        when(orderRepository.save(any(Order.class)))
            .thenReturn(createMockOrder());
            
        // When
        Order result = orderService.createOrder(request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCustomerOrderNo()).isEqualTo("TEST-001");
        verify(inventoryService).checkAvailability(any());
    }
}
```

### Integration Testing

#### API Testing
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderControllerIntegrationTest {
    
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("openwes_test")
            .withUsername("test")
            .withPassword("test");
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldCreateOrderViaApi() {
        // Given
        OrderRequest request = new OrderRequest();
        request.setCustomerOrderNo("API-TEST-001");
        request.setWarehouseCode("WH-001");
        
        // When
        ResponseEntity<OrderResponse> response = restTemplate.postForEntity(
            "/api/orders", 
            request, 
            OrderResponse.class
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getOrderId()).isNotNull();
    }
}
```

## 📊 Monitoring & Observability

### Application Metrics

#### Custom Metrics
```java
@Component
public class OrderMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Counter orderCreatedCounter;
    private final Timer orderProcessingTimer;
    
    public OrderMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.orderCreatedCounter = Counter.builder("orders.created")
            .description("Number of orders created")
            .register(meterRegistry);
        this.orderProcessingTimer = Timer.builder("orders.processing.time")
            .description("Order processing time")
            .register(meterRegistry);
    }
    
    public void recordOrderCreated(String warehouseCode, String orderType) {
        orderCreatedCounter.increment(
            Tags.of(
                "warehouse", warehouseCode,
                "type", orderType
            )
        );
    }
    
    public void recordOrderProcessingTime(Duration processingTime) {
        orderProcessingTimer.record(processingTime);
    }
}
```

### Logging Configuration

#### Structured Logging
```java
@Component
public class StructuredLogger {
    
    private final Logger logger = LoggerFactory.getLogger(StructuredLogger.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void logOrderEvent(String event, Order order, Map<String, Object> context) {
        try {
            Map<String, Object> logEntry = Map.of(
                "event", event,
                "orderId", order.getId(),
                "warehouseCode", order.getWarehouseCode(),
                "timestamp", Instant.now().toString(),
                "context", context
            );
            
            logger.info(objectMapper.writeValueAsString(logEntry));
            
        } catch (Exception e) {
            logger.error("Failed to write structured log", e);
        }
    }
}
```

## 🚀 Deployment & DevOps

### Docker Configuration

#### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM openjdk:17-jdk-slim AS builder
WORKDIR /app
COPY gradle gradle
COPY build.gradle settings.gradle gradlew ./
COPY src src
RUN ./gradlew build -x test

# Runtime stage
FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Docker Compose for Development
```yaml
version: '3.8'
services:
  wes-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
      
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: openwes
    volumes:
      - mysql_data:/var/lib/mysql
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
volumes:
  mysql_data:
```

### Kubernetes Deployment

#### Application Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wes-server
  namespace: openwes
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wes-server
  template:
    metadata:
      labels:
        app: wes-server
    spec:
      containers:
      - name: wes-server
        image: openwes/wes-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: DB_HOST
          value: "mysql-service"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 📚 Resources & Community

### Documentation
- **[API Reference](../api/api-client-to-wes.md)** - Complete API documentation
- **[Integration Examples](../api/integration-examples.md)** - Real-world integration patterns
- **[Plugin Development](../advanced/plugin-development.md)** - Custom plugin creation guide
- **[System Architecture](../concepts/architecture.md)** - Technical architecture overview

### Development Tools
- **OpenAPI/Swagger**: Interactive API documentation
- **Postman Collections**: Pre-built API request collections
- **SDK Libraries**: Java, Python, Node.js, .NET SDKs
- **CLI Tools**: Command-line utilities for development and deployment

### Community & Support
- **GitHub Repository**: Source code, issues, and discussions
- **Developer Forum**: Technical discussions and Q&A
- **Slack Community**: Real-time chat with other developers
- **Stack Overflow**: Tagged questions and community answers

### Continuous Learning
- **Webinar Series**: Monthly technical deep-dives
- **Code Examples**: GitHub repository with sample implementations
- **Best Practices**: Documented patterns and recommendations
- **Release Notes**: Stay updated with new features and changes

---

**🚀 Developer Success Tip**: Start with the API documentation and sample integrations, then move on to custom plugins and advanced integrations. The OpenWES community is here to help you build amazing warehouse automation solutions!
