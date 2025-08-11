---
id: plugin-development
title: Plugin Development Guide
sidebar_position: 6
---

# Plugin Development Guide

OpenWES features a powerful and flexible plugin system that allows you to extend warehouse functionality without modifying core system code. This guide covers everything you need to know about developing, deploying, and managing plugins.

## Plugin System Overview

### Architecture

OpenWES uses the **PF4J** (Plugin Framework for Java) to provide a robust plugin architecture with:

- **Hot Loading/Unloading**: Deploy plugins without system restart
- **Dependency Management**: Plugin dependencies and versioning
- **Lifecycle Management**: Plugin state management (start, stop, enable, disable)
- **Security**: Sandboxed plugin execution
- **API Extensions**: Extend core functionality through well-defined interfaces

### Plugin Types

1. **Business Logic Plugins**: Custom warehouse operation logic
2. **Integration Plugins**: Connect with external systems (WMS, ERP, equipment)
3. **UI Extension Plugins**: Add custom frontend components
4. **Reporting Plugins**: Custom reports and analytics
5. **Notification Plugins**: Custom alert and notification systems

## Getting Started

### Development Environment Setup

1. **Prerequisites**
```bash
# Required tools
Java 17+
Maven 3.8+ or Gradle 7+
IDE (IntelliJ IDEA recommended)
```

2. **Create Plugin Project**
```bash
# Clone plugin template
git clone https://github.com/jingsewu/openwes-plugin-template
cd openwes-plugin-template

# Or use Maven archetype
mvn archetype:generate \
  -DgroupId=com.yourcompany.openwes \
  -DartifactId=your-plugin-name \
  -DarchetypeArtifactId=openwes-plugin-archetype
```

3. **Project Structure**
```
your-plugin/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/yourcompany/plugin/
│   │   │       ├── YourPlugin.java
│   │   │       ├── extensions/
│   │   │       └── services/
│   │   └── resources/
│   │       ├── plugin.properties
│   │       └── META-INF/
│   └── test/
└── README.md
```

## Core Plugin Development

### Plugin Main Class

```java
// YourPlugin.java
package com.yourcompany.plugin;

import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;
import org.pf4j.RuntimeMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class YourPlugin extends Plugin {
    
    private static final Logger logger = LoggerFactory.getLogger(YourPlugin.class);
    
    public YourPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }
    
    @Override
    public void start() {
        logger.info("Starting {} plugin", getWrapper().getPluginId());
        
        // Initialize plugin resources
        initializeServices();
        registerEventHandlers();
        
        logger.info("Plugin {} started successfully", getWrapper().getPluginId());
    }
    
    @Override
    public void stop() {
        logger.info("Stopping {} plugin", getWrapper().getPluginId());
        
        // Cleanup resources
        cleanupServices();
        unregisterEventHandlers();
        
        logger.info("Plugin {} stopped successfully", getWrapper().getPluginId());
    }
    
    @Override
    public void delete() {
        logger.info("Deleting {} plugin", getWrapper().getPluginId());
        // Perform cleanup before plugin deletion
    }
    
    private void initializeServices() {
        // Initialize your plugin services here
    }
    
    private void registerEventHandlers() {
        // Register event handlers
    }
    
    private void cleanupServices() {
        // Cleanup resources
    }
    
    private void unregisterEventHandlers() {
        // Unregister event handlers
    }
}
```

### Plugin Configuration

```properties
# plugin.properties
plugin.id=your-plugin-id
plugin.class=com.yourcompany.plugin.YourPlugin
plugin.version=1.0.0
plugin.provider=Your Company
plugin.dependencies=
plugin.description=Description of your plugin functionality
plugin.license=MIT
plugin.requires=1.0.0
```

### Extension Points

#### 1. Order Processing Extension

```java
// OrderProcessingExtension.java
package com.yourcompany.plugin.extensions;

import org.pf4j.Extension;
import com.openwes.api.platform.api.IOrderProcessExtension;
import com.openwes.wes.api.outbound.dto.PickingOrderDTO;

@Extension
public class OrderProcessingExtension implements IOrderProcessExtension {
    
    @Override
    public void beforeOrderProcess(PickingOrderDTO order) {
        // Custom logic before order processing
        logger.info("Processing order: {}", order.getOrderNo());
        
        // Example: Custom validation
        validateCustomRules(order);
        
        // Example: External system notification
        notifyExternalSystem(order);
    }
    
    @Override
    public void afterOrderProcess(PickingOrderDTO order) {
        // Custom logic after order processing
        logger.info("Order processed: {}", order.getOrderNo());
        
        // Example: Send completion notification
        sendCompletionNotification(order);
    }
    
    @Override
    public boolean shouldSkipOrder(PickingOrderDTO order) {
        // Custom logic to determine if order should be skipped
        return order.getPriority() < getMinimumPriority();
    }
    
    private void validateCustomRules(PickingOrderDTO order) {
        // Implement custom validation logic
    }
    
    private void notifyExternalSystem(PickingOrderDTO order) {
        // Notify external systems
    }
    
    private void sendCompletionNotification(PickingOrderDTO order) {
        // Send notifications
    }
    
    private int getMinimumPriority() {
        return 1; // Configure as needed
    }
}
```

#### 2. Inventory Management Extension

```java
// InventoryExtension.java
package com.yourcompany.plugin.extensions;

import org.pf4j.Extension;
import com.openwes.api.platform.api.IInventoryExtension;
import com.openwes.wes.api.stock.dto.ContainerStockDTO;

@Extension
public class InventoryExtension implements IInventoryExtension {
    
    @Override
    public void onStockChange(ContainerStockDTO stock, int quantityChange) {
        logger.info("Stock changed for container: {}, change: {}", 
                   stock.getContainerCode(), quantityChange);
        
        // Example: Update external inventory system
        updateExternalInventory(stock, quantityChange);
        
        // Example: Check reorder levels
        checkReorderLevel(stock);
    }
    
    @Override
    public boolean validateStockOperation(ContainerStockDTO stock, String operation) {
        // Custom validation for stock operations
        switch (operation) {
            case "PICK":
                return validatePickOperation(stock);
            case "PUT":
                return validatePutOperation(stock);
            default:
                return true;
        }
    }
    
    private void updateExternalInventory(ContainerStockDTO stock, int quantityChange) {
        // Implementation for external system update
    }
    
    private void checkReorderLevel(ContainerStockDTO stock) {
        // Check if reorder is needed
    }
    
    private boolean validatePickOperation(ContainerStockDTO stock) {
        // Custom pick validation
        return stock.getAvailableQty() > 0;
    }
    
    private boolean validatePutOperation(ContainerStockDTO stock) {
        // Custom put validation
        return true;
    }
}
```

#### 3. Equipment Integration Extension

```java
// EquipmentExtension.java
package com.yourcompany.plugin.extensions;

import org.pf4j.Extension;
import com.openwes.api.platform.api.IEquipmentExtension;
import com.openwes.wes.api.ems.dto.WorkStationDTO;

@Extension
public class EquipmentExtension implements IEquipmentExtension {
    
    @Override
    public void onEquipmentStatusChange(String equipmentId, String status) {
        logger.info("Equipment {} status changed to: {}", equipmentId, status);
        
        // Custom logic for equipment status changes
        handleStatusChange(equipmentId, status);
    }
    
    @Override
    public boolean canExecuteTask(String equipmentId, String taskType) {
        // Custom logic to determine if equipment can execute task
        return isEquipmentAvailable(equipmentId) && 
               isTaskTypeSupported(equipmentId, taskType);
    }
    
    @Override
    public void beforeTaskExecution(String taskId, String equipmentId) {
        // Pre-task execution logic
        logger.info("Preparing equipment {} for task {}", equipmentId, taskId);
        prepareEquipment(equipmentId);
    }
    
    @Override
    public void afterTaskExecution(String taskId, String equipmentId, boolean success) {
        // Post-task execution logic
        if (success) {
            logger.info("Task {} completed successfully on equipment {}", taskId, equipmentId);
        } else {
            logger.error("Task {} failed on equipment {}", taskId, equipmentId);
            handleTaskFailure(taskId, equipmentId);
        }
    }
    
    private void handleStatusChange(String equipmentId, String status) {
        // Implementation for status change handling
    }
    
    private boolean isEquipmentAvailable(String equipmentId) {
        // Check equipment availability
        return true;
    }
    
    private boolean isTaskTypeSupported(String equipmentId, String taskType) {
        // Check if equipment supports the task type
        return true;
    }
    
    private void prepareEquipment(String equipmentId) {
        // Prepare equipment for task execution
    }
    
    private void handleTaskFailure(String taskId, String equipmentId) {
        // Handle task failure
    }
}
```

### Event Handling

```java
// EventHandlerExtension.java
package com.yourcompany.plugin.extensions;

import org.pf4j.Extension;
import org.springframework.context.event.EventListener;
import com.openwes.domain.event.DomainEvent;
import com.openwes.wes.api.outbound.event.PickingOrderCreatedEvent;

@Extension
public class EventHandlerExtension {
    
    @EventListener
    public void handlePickingOrderCreated(PickingOrderCreatedEvent event) {
        logger.info("Handling picking order created event: {}", event.getOrderNo());
        
        // Custom logic for new picking orders
        processNewPickingOrder(event);
    }
    
    @EventListener
    public void handleStockAdjustment(StockAdjustmentEvent event) {
        logger.info("Handling stock adjustment event: {}", event.getContainerCode());
        
        // Custom logic for stock adjustments
        processStockAdjustment(event);
    }
    
    private void processNewPickingOrder(PickingOrderCreatedEvent event) {
        // Process new picking order
    }
    
    private void processStockAdjustment(StockAdjustmentEvent event) {
        // Process stock adjustment
    }
}
```

## Configuration and Services

### Plugin Configuration Service

```java
// PluginConfigService.java
package com.yourcompany.plugin.services;

import org.springframework.stereotype.Service;
import java.util.Properties;

@Service
public class PluginConfigService {
    
    private Properties config;
    
    public PluginConfigService() {
        loadConfiguration();
    }
    
    private void loadConfiguration() {
        config = new Properties();
        try {
            config.load(getClass().getResourceAsStream("/plugin-config.properties"));
        } catch (Exception e) {
            logger.error("Failed to load plugin configuration", e);
        }
    }
    
    public String getProperty(String key) {
        return config.getProperty(key);
    }
    
    public String getProperty(String key, String defaultValue) {
        return config.getProperty(key, defaultValue);
    }
    
    public int getIntProperty(String key, int defaultValue) {
        String value = config.getProperty(key);
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
```

### Database Access

```java
// PluginDatabaseService.java
package com.yourcompany.plugin.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PluginDatabaseService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public void createPluginTables() {
        String sql = """
            CREATE TABLE IF NOT EXISTS plugin_data (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                plugin_id VARCHAR(100) NOT NULL,
                data_key VARCHAR(255) NOT NULL,
                data_value TEXT,
                created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_plugin_key (plugin_id, data_key)
            )
            """;
        jdbcTemplate.execute(sql);
    }
    
    public void savePluginData(String pluginId, String key, String value) {
        String sql = """
            INSERT INTO plugin_data (plugin_id, data_key, data_value) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            data_value = VALUES(data_value), 
            updated_time = CURRENT_TIMESTAMP
            """;
        jdbcTemplate.update(sql, pluginId, key, value);
    }
    
    public String getPluginData(String pluginId, String key) {
        String sql = "SELECT data_value FROM plugin_data WHERE plugin_id = ? AND data_key = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, pluginId, key);
        } catch (Exception e) {
            return null;
        }
    }
}
```

## Frontend Plugin Development

### React Component Extension

```typescript
// PluginComponent.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message } from 'antd';
import { pluginApiClient } from './api/pluginApi';

interface PluginComponentProps {
  warehouseId: string;
}

const PluginComponent: React.FC<PluginComponentProps> = ({ warehouseId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await pluginApiClient.getPluginData(warehouseId);
      setData(response.data);
    } catch (error) {
      message.error('Failed to load plugin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (record: any) => {
    try {
      await pluginApiClient.performAction(record.id);
      message.success('Action completed successfully');
      loadData();
    } catch (error) {
      message.error('Action failed');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: any) => (
        <Button onClick={() => handleAction(record)}>
          Process
        </Button>
      ),
    },
  ];

  return (
    <Card title="Plugin Component" loading={loading}>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default PluginComponent;
```

### Plugin Registration

```javascript
// plugin-registry.js
window.OpenWESPlugins = window.OpenWESPlugins || {};

window.OpenWESPlugins['your-plugin-id'] = {
  name: 'Your Plugin Name',
  version: '1.0.0',
  components: {
    'PluginComponent': React.lazy(() => import('./PluginComponent'))
  },
  routes: [
    {
      path: '/plugin/your-plugin',
      component: 'PluginComponent'
    }
  ],
  menuItems: [
    {
      key: 'your-plugin',
      label: 'Your Plugin',
      path: '/plugin/your-plugin'
    }
  ]
};
```

## Testing

### Unit Testing

```java
// PluginTest.java
package com.yourcompany.plugin;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PluginTest {
    
    @Mock
    private PluginWrapper mockWrapper;
    
    private YourPlugin plugin;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(mockWrapper.getPluginId()).thenReturn("test-plugin");
        plugin = new YourPlugin(mockWrapper);
    }
    
    @Test
    void testPluginStart() {
        // Test plugin start
        assertDoesNotThrow(() -> plugin.start());
        // Add specific assertions for your plugin's start behavior
    }
    
    @Test
    void testPluginStop() {
        // Test plugin stop
        plugin.start();
        assertDoesNotThrow(() -> plugin.stop());
        // Add specific assertions for your plugin's stop behavior
    }
}
```

### Integration Testing

```java
// PluginIntegrationTest.java
@SpringBootTest
@TestMethodOrder(OrderAnnotation.class)
class PluginIntegrationTest {
    
    @Autowired
    private PluginManager pluginManager;
    
    @Test
    @Order(1)
    void testPluginLoading() {
        // Test plugin loading
        pluginManager.loadPlugin(Paths.get("target/your-plugin-1.0.0.jar"));
        assertTrue(pluginManager.getPlugin("your-plugin-id").getPluginState() == PluginState.CREATED);
    }
    
    @Test
    @Order(2)
    void testPluginStart() {
        // Test plugin start
        pluginManager.startPlugin("your-plugin-id");
        assertTrue(pluginManager.getPlugin("your-plugin-id").getPluginState() == PluginState.STARTED);
    }
    
    @Test
    @Order(3)
    void testExtensionFunctionality() {
        // Test your plugin's extensions
        List<IOrderProcessExtension> extensions = pluginManager.getExtensions(IOrderProcessExtension.class);
        assertFalse(extensions.isEmpty());
    }
}
```

## Building and Packaging

### Maven Configuration

```xml
<!-- pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.yourcompany.openwes</groupId>
    <artifactId>your-plugin</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <openwes.version>1.0.0</openwes.version>
        <pf4j.version>3.9.0</pf4j.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.pf4j</groupId>
            <artifactId>pf4j</artifactId>
            <version>${pf4j.version}</version>
            <scope>provided</scope>
        </dependency>
        
        <dependency>
            <groupId>com.openwes</groupId>
            <artifactId>api-platform-api</artifactId>
            <version>${openwes.version}</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- Add other OpenWES API dependencies as needed -->
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-assembly-plugin</artifactId>
                <version>3.4.2</version>
                <configuration>
                    <descriptorRefs>
                        <descriptorRef>jar-with-dependencies</descriptorRef>
                    </descriptorRefs>
                    <archive>
                        <manifest>
                            <addClasspath>true</addClasspath>
                        </manifest>
                        <manifestEntries>
                            <Plugin-Class>com.yourcompany.plugin.YourPlugin</Plugin-Class>
                            <Plugin-Id>your-plugin-id</Plugin-Id>
                            <Plugin-Version>1.0.0</Plugin-Version>
                        </manifestEntries>
                    </archive>
                </configuration>
                <executions>
                    <execution>
                        <id>make-assembly</id>
                        <phase>package</phase>
                        <goals>
                            <goal>single</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Build Script

```bash
#!/bin/bash
# build-plugin.sh

echo "Building plugin..."

# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package plugin
mvn package

# Copy to plugins directory
cp target/your-plugin-*-jar-with-dependencies.jar ../openwes/plugins/

echo "Plugin built and deployed successfully!"
```

## Deployment and Management

### Plugin Deployment

1. **Development Environment**
```bash
# Copy plugin JAR to plugins directory
cp your-plugin-1.0.0.jar /opt/openwes/plugins/

# Or use hot deployment API
curl -X POST \
  -F "file=@your-plugin-1.0.0.jar" \
  http://localhost:8081/api/plugins/upload
```

2. **Production Environment**
```bash
# Deploy via management API
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your-plugin-1.0.0.jar" \
  https://your-domain.com/api/plugins/deploy
```

### Plugin Management

```bash
# List installed plugins
curl http://localhost:8081/api/plugins

# Start plugin
curl -X POST http://localhost:8081/api/plugins/your-plugin-id/start

# Stop plugin
curl -X POST http://localhost:8081/api/plugins/your-plugin-id/stop

# Uninstall plugin
curl -X DELETE http://localhost:8081/api/plugins/your-plugin-id
```

## Best Practices

### Development Guidelines

1. **Follow Naming Conventions**
   - Plugin ID: `company-plugin-name`
   - Package: `com.company.openwes.plugins.pluginname`

2. **Resource Management**
   - Always cleanup resources in `stop()` method
   - Use try-with-resources for auto-closeable resources
   - Avoid memory leaks in long-running operations

3. **Error Handling**
   - Use proper exception handling
   - Log errors with appropriate levels
   - Provide meaningful error messages

4. **Configuration**
   - Use configuration files for customizable settings
   - Validate configuration on plugin start
   - Provide default values for optional settings

5. **Testing**
   - Write comprehensive unit tests
   - Include integration tests for extensions
   - Test plugin lifecycle (start, stop, reload)

### Security Considerations

1. **Input Validation**
   - Validate all external inputs
   - Sanitize data before database operations
   - Use parameterized queries

2. **Permission Checking**
   - Check user permissions before operations
   - Use OpenWES security context
   - Implement proper authorization

3. **Data Protection**
   - Encrypt sensitive configuration data
   - Use secure communication channels
   - Follow data privacy regulations

## Advanced Topics

### Plugin Communication

```java
// InterPluginCommunication.java
@Service
public class InterPluginCommunication {
    
    @Autowired
    private PluginManager pluginManager;
    
    public void sendMessageToPlugin(String targetPluginId, String message) {
        Plugin targetPlugin = pluginManager.getPlugin(targetPluginId);
        if (targetPlugin != null && targetPlugin instanceof MessageReceiver) {
            ((MessageReceiver) targetPlugin).receiveMessage(message);
        }
    }
    
    public List<String> getAvailablePlugins() {
        return pluginManager.getPlugins().stream()
                .map(pluginWrapper -> pluginWrapper.getPluginId())
                .collect(Collectors.toList());
    }
}
```

### Custom Extension Points

```java
// CustomExtensionPoint.java
@ExtensionPoint
public interface ICustomExtension {
    void processCustomOperation(CustomOperationContext context);
    boolean canHandle(String operationType);
    int getPriority();
}
```

### Plugin Versioning and Migration

```java
// PluginMigration.java
public abstract class PluginMigration {
    
    public abstract String getFromVersion();
    public abstract String getToVersion();
    public abstract void migrate();
    
    protected void executeSQL(String sql) {
        // Execute migration SQL
    }
    
    protected void migrateConfiguration() {
        // Migrate plugin configuration
    }
}
```

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Check plugin.properties file
   - Verify all required dependencies are available
   - Check plugin class path and naming

2. **Extension Not Working**
   - Ensure proper @Extension annotation
   - Verify extension point interface implementation
   - Check plugin is started and active

3. **Configuration Issues**
   - Validate configuration file format
   - Check file permissions and accessibility
   - Verify configuration key naming

### Debugging

```java
// Enable debug logging
# application.yml
logging:
  level:
    org.pf4j: DEBUG
    com.openwes.plugin: DEBUG
    com.yourcompany.plugin: DEBUG
```

### Support Resources

- **Plugin API Documentation**: `/docs/api/plugin-api`
- **Sample Plugins**: `https://github.com/jingsewu/openwes-plugin-examples`
- **Community Forum**: `https://github.com/jingsewu/open-wes/discussions`
- **Issue Tracker**: `https://github.com/jingsewu/open-wes/issues`

This comprehensive guide should help you develop powerful plugins for OpenWES. For additional assistance, consult the API documentation or reach out to the community.