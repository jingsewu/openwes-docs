---
id: integration-examples
title: Integration Examples and SDKs
sidebar_position: 4
---

# Integration Examples and SDKs

This guide provides practical examples and SDKs for integrating OpenWES with various external systems including WMS, ERP, MES, and equipment control systems.

## SDK and Client Libraries

### Java SDK

#### Maven Dependency

```xml
<dependency>
    <groupId>com.openwes</groupId>
    <artifactId>openwes-java-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Basic Configuration

```java
// OpenWESClient.java
import com.openwes.sdk.OpenWESClient;
import com.openwes.sdk.config.ClientConfig;
import com.openwes.sdk.auth.ApiKeyAuth;

public class OpenWESClientExample {
    
    public static void main(String[] args) {
        // Configure client
        ClientConfig config = ClientConfig.builder()
                .baseUrl("https://your-openwes-instance.com")
                .apiKey("your-api-key")
                .tenantId("your-tenant-id")
                .timeout(30000) // 30 seconds
                .retryAttempts(3)
                .build();
        
        // Create client
        OpenWESClient client = new OpenWESClient(config);
        
        // Use client for operations
        performOperations(client);
    }
    
    private static void performOperations(OpenWESClient client) {
        try {
            // Example operations
            createInboundOrder(client);
            createOutboundOrder(client);
            updateInventory(client);
        } catch (Exception e) {
            System.err.println("Operation failed: " + e.getMessage());
        }
    }
}
```

#### SKU Management

```java
// SKUManagement.java
import com.openwes.sdk.model.sku.*;
import java.util.Arrays;
import java.util.List;

public class SKUManagement {
    
    public void createSKU(OpenWESClient client) {
        // Create SKU with full details
        SKUCreateRequest request = SKUCreateRequest.builder()
                .skuCode("LAPTOP-2024-001")
                .warehouseCode("WH-MAIN")
                .ownerCode("ACME-CORP")
                .skuName("Premium Business Laptop")
                .brand("TechBrand")
                .color("Space Gray")
                .volume(VolumeDTO.builder()
                        .volume(2500000L)
                        .height(20L)
                        .width(300L)
                        .length(400L)
                        .build())
                .skuAttribute(SKUAttributeDTO.builder()
                        .imageUrl("https://cdn.example.com/laptop.jpg")
                        .skuFirstCategory("Electronics")
                        .skuSecondCategory("Computers")
                        .unit("EA")
                        .build())
                .skuPackage(SKUPackageDTO.builder()
                        .skuPackageDetails(Arrays.asList(
                                PackageDetailDTO.builder()
                                        .level(1)
                                        .packageCode("BOX-STD")
                                        .unit("box")
                                        .height(250L)
                                        .width(350L)
                                        .length(450L)
                                        .weight(2500)
                                        .enableSplit(false)
                                        .build()
                        ))
                        .build())
                .skuBarcode(BarcodeDTO.builder()
                        .barcodes(Arrays.asList("1234567890123", "2345678901234"))
                        .build())
                .build();
        
        try {
            ApiResponse response = client.sku().create(Arrays.asList(request));
            if (response.isSuccess()) {
                System.out.println("SKU created successfully");
            } else {
                System.err.println("Failed to create SKU: " + response.getMessage());
            }
        } catch (ApiException e) {
            System.err.println("API error: " + e.getMessage());
        }
    }
    
    public void batchCreateSKUs(OpenWESClient client, List<SKUData> skuDataList) {
        List<SKUCreateRequest> requests = skuDataList.stream()
                .map(this::convertToSKURequest)
                .collect(Collectors.toList());
        
        try {
            // Process in batches of 100
            int batchSize = 100;
            for (int i = 0; i < requests.size(); i += batchSize) {
                List<SKUCreateRequest> batch = requests.subList(
                        i, Math.min(i + batchSize, requests.size()));
                
                ApiResponse response = client.sku().create(batch);
                if (!response.isSuccess()) {
                    System.err.println("Batch " + (i/batchSize + 1) + " failed: " + 
                                     response.getMessage());
                }
            }
        } catch (ApiException e) {
            System.err.println("Batch SKU creation failed: " + e.getMessage());
        }
    }
    
    private SKUCreateRequest convertToSKURequest(SKUData skuData) {
        // Convert your SKU data format to OpenWES format
        return SKUCreateRequest.builder()
                .skuCode(skuData.getCode())
                .skuName(skuData.getName())
                .warehouseCode(skuData.getWarehouse())
                .ownerCode(skuData.getOwner())
                // ... other mappings
                .build();
    }
}
```

#### Inbound Operations

```java
// InboundOperations.java
import com.openwes.sdk.model.inbound.*;
import java.time.Instant;

public class InboundOperations {
    
    public void createInboundOrder(OpenWESClient client) {
        InboundOrderCreateRequest request = InboundOrderCreateRequest.builder()
                .customerOrderNo("PO-2024-001")
                .lpnCode("LPN-2024-001")
                .warehouseCode("WH-MAIN")
                .customerOrderType("PURCHASE")
                .storageType("STORAGE")
                .sender("Supplier ABC")
                .carrier("FedEx")
                .shippingMethod("Ground")
                .trackingNumber("1234567890")
                .estimatedArrivalDate(Instant.now().plusDays(2).toEpochMilli())
                .remark("Urgent delivery - fragile items")
                .extendFields(Map.of(
                        "priority", "HIGH",
                        "specialHandling", "FRAGILE"
                ))
                .details(Arrays.asList(
                        InboundDetailDTO.builder()
                                .ownerCode("ACME-CORP")
                                .boxNo("BOX-001")
                                .qtyRestocked(50)
                                .skuCode("LAPTOP-2024-001")
                                .skuName("Premium Business Laptop")
                                .batchAttributes(Map.of(
                                        "batchNo", "BATCH-2024-Q1",
                                        "productionDate", "2024-01-15",
                                        "expirationDate", "2026-01-15"
                                ))
                                .extendFields(Map.of(
                                        "qualityGrade", "A",
                                        "supplier", "TechManufacturer"
                                ))
                                .build(),
                        InboundDetailDTO.builder()
                                .ownerCode("ACME-CORP")
                                .boxNo("BOX-002")
                                .qtyRestocked(25)
                                .skuCode("MOUSE-2024-001")
                                .skuName("Wireless Mouse")
                                .batchAttributes(Map.of(
                                        "batchNo", "BATCH-2024-Q1"
                                ))
                                .build()
                ))
                .build();
        
        try {
            ApiResponse response = client.inbound().create(Arrays.asList(request));
            handleResponse(response, "Inbound order created");
        } catch (ApiException e) {
            handleApiException(e, "create inbound order");
        }
    }
    
    public void cancelInboundOrder(OpenWESClient client, List<String> orderNumbers) {
        InboundCancelRequest request = InboundCancelRequest.builder()
                .identifyNos(orderNumbers)
                .warehouseCode("WH-MAIN")
                .build();
        
        try {
            ApiResponse response = client.inbound().cancel(request);
            handleResponse(response, "Inbound orders cancelled");
        } catch (ApiException e) {
            handleApiException(e, "cancel inbound orders");
        }
    }
    
    public void trackInboundProgress(OpenWESClient client, String orderNo) {
        try {
            InboundOrderStatus status = client.inbound().getStatus(orderNo);
            System.out.println("Order: " + orderNo);
            System.out.println("Status: " + status.getStatus());
            System.out.println("Progress: " + status.getProgress() + "%");
            System.out.println("Last Updated: " + status.getLastUpdated());
            
            if (status.getDetails() != null) {
                status.getDetails().forEach(detail -> {
                    System.out.println("  SKU: " + detail.getSkuCode() + 
                                     " - Received: " + detail.getQtyReceived() + 
                                     "/" + detail.getQtyExpected());
                });
            }
        } catch (ApiException e) {
            handleApiException(e, "track inbound progress");
        }
    }
    
    private void handleResponse(ApiResponse response, String operation) {
        if (response.isSuccess()) {
            System.out.println(operation + " successfully");
        } else {
            System.err.println("Failed to " + operation.toLowerCase() + ": " + 
                             response.getMessage());
        }
    }
    
    private void handleApiException(ApiException e, String operation) {
        System.err.println("API error while trying to " + operation + ": " + 
                         e.getMessage());
        if (e.getErrorCode() != null) {
            System.err.println("Error code: " + e.getErrorCode());
        }
    }
}
```

#### Outbound Operations

```java
// OutboundOperations.java
import com.openwes.sdk.model.outbound.*;

public class OutboundOperations {
    
    public void createOutboundOrder(OpenWESClient client) {
        OutboundOrderCreateRequest request = OutboundOrderCreateRequest.builder()
                .warehouseCode("WH-MAIN")
                .customerWaveNo("WAVE-2024-001")
                .customerOrderNo("SO-2024-001")
                .customerOrderType("SALES")
                .carrierCode("FEDEX")
                .waybillNo("FX123456789")
                .origPlatformCode("SHOPIFY")
                .expiredTime(Instant.now().plusDays(1).toEpochMilli())
                .priority(100)
                .shortOutbound(false)
                .shortWaiting(true)
                .orderNo("ORD-2024-001")
                .destinations(Arrays.asList("DOCK-A", "DOCK-B"))
                .extendFields(Map.of(
                        "customerType", "PREMIUM",
                        "deliveryWindow", "AM"
                ))
                .details(Arrays.asList(
                        OutboundDetailDTO.builder()
                                .ownerCode("ACME-CORP")
                                .skuCode("LAPTOP-2024-001")
                                .skuName("Premium Business Laptop")
                                .qtyRequired(2)
                                .batchAttributes(Map.of(
                                        "batchNo", "BATCH-2024-Q1"
                                ))
                                .extendFields(Map.of(
                                        "giftWrap", "true"
                                ))
                                .build()
                ))
                .build();
        
        try {
            ApiResponse response = client.outbound().create(Arrays.asList(request));
            handleResponse(response, "Outbound order created");
        } catch (ApiException e) {
            handleApiException(e, "create outbound order");
        }
    }
    
    public void createWaveBasedOrders(OpenWESClient client, String waveNo, 
                                    List<OrderData> orders) {
        List<OutboundOrderCreateRequest> requests = orders.stream()
                .map(order -> convertToOutboundRequest(order, waveNo))
                .collect(Collectors.toList());
        
        try {
            ApiResponse response = client.outbound().create(requests);
            if (response.isSuccess()) {
                System.out.println("Wave " + waveNo + " created with " + 
                                 orders.size() + " orders");
            } else {
                System.err.println("Failed to create wave: " + response.getMessage());
            }
        } catch (ApiException e) {
            handleApiException(e, "create wave-based orders");
        }
    }
    
    public void cancelOutboundOrders(OpenWESClient client, List<String> customerOrderNos) {
        OutboundCancelRequest request = OutboundCancelRequest.builder()
                .customerOrderNos(customerOrderNos)
                .build();
        
        try {
            ApiResponse response = client.outbound().cancel(request);
            handleResponse(response, "Outbound orders cancelled");
        } catch (ApiException e) {
            handleApiException(e, "cancel outbound orders");
        }
    }
    
    private OutboundOrderCreateRequest convertToOutboundRequest(OrderData order, String waveNo) {
        return OutboundOrderCreateRequest.builder()
                .warehouseCode(order.getWarehouseCode())
                .customerWaveNo(waveNo)
                .customerOrderNo(order.getOrderNumber())
                .customerOrderType("SALES")
                .priority(order.getPriority())
                .details(order.getItems().stream()
                        .map(item -> OutboundDetailDTO.builder()
                                .ownerCode(item.getOwnerCode())
                                .skuCode(item.getSkuCode())
                                .qtyRequired(item.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
```

### Python SDK

#### Installation

```bash
pip install openwes-python-sdk
```

#### Basic Usage

```python
# openwes_client.py
from openwes_sdk import OpenWESClient, ClientConfig
from openwes_sdk.models import SKUCreateRequest, InboundOrderCreateRequest
from openwes_sdk.exceptions import OpenWESException
import asyncio

class OpenWESManager:
    def __init__(self, base_url: str, api_key: str, tenant_id: str):
        config = ClientConfig(
            base_url=base_url,
            api_key=api_key,
            tenant_id=tenant_id,
            timeout=30.0,
            max_retries=3
        )
        self.client = OpenWESClient(config)
    
    async def create_sku(self, sku_data: dict):
        """Create a new SKU"""
        try:
            request = SKUCreateRequest(
                sku_code=sku_data['sku_code'],
                warehouse_code=sku_data['warehouse_code'],
                owner_code=sku_data['owner_code'],
                sku_name=sku_data['sku_name'],
                brand=sku_data.get('brand'),
                color=sku_data.get('color'),
                volume={
                    'volume': sku_data['volume']['volume'],
                    'height': sku_data['volume']['height'],
                    'width': sku_data['volume']['width'],
                    'length': sku_data['volume']['length']
                },
                sku_attribute={
                    'image_url': sku_data.get('image_url'),
                    'sku_first_category': sku_data.get('category'),
                    'unit': sku_data.get('unit', 'EA')
                },
                sku_barcode={
                    'barcodes': sku_data.get('barcodes', [])
                }
            )
            
            response = await self.client.sku.create([request])
            if response.is_success:
                print(f"SKU {sku_data['sku_code']} created successfully")
                return True
            else:
                print(f"Failed to create SKU: {response.message}")
                return False
                
        except OpenWESException as e:
            print(f"API error: {e.message}")
            return False
    
    async def create_inbound_order(self, order_data: dict):
        """Create inbound order"""
        try:
            request = InboundOrderCreateRequest(
                customer_order_no=order_data['order_no'],
                lpn_code=order_data.get('lpn_code'),
                warehouse_code=order_data['warehouse_code'],
                customer_order_type=order_data['order_type'],
                storage_type=order_data['storage_type'],
                sender=order_data.get('sender'),
                carrier=order_data.get('carrier'),
                tracking_number=order_data.get('tracking_number'),
                estimated_arrival_date=order_data.get('estimated_arrival'),
                details=[
                    {
                        'owner_code': item['owner_code'],
                        'qty_restocked': item['quantity'],
                        'sku_code': item['sku_code'],
                        'sku_name': item.get('sku_name'),
                        'batch_attributes': item.get('batch_attributes', {}),
                        'extend_fields': item.get('extend_fields', {})
                    }
                    for item in order_data['details']
                ]
            )
            
            response = await self.client.inbound.create([request])
            return response.is_success
            
        except OpenWESException as e:
            print(f"Failed to create inbound order: {e.message}")
            return False
    
    async def batch_process_skus(self, sku_list: list, batch_size: int = 100):
        """Process SKUs in batches"""
        results = []
        
        for i in range(0, len(sku_list), batch_size):
            batch = sku_list[i:i + batch_size]
            batch_requests = []
            
            for sku_data in batch:
                request = SKUCreateRequest(**sku_data)
                batch_requests.append(request)
            
            try:
                response = await self.client.sku.create(batch_requests)
                results.append({
                    'batch': i // batch_size + 1,
                    'success': response.is_success,
                    'message': response.message
                })
                
                if response.is_success:
                    print(f"Batch {i // batch_size + 1} processed successfully")
                else:
                    print(f"Batch {i // batch_size + 1} failed: {response.message}")
                    
            except OpenWESException as e:
                results.append({
                    'batch': i // batch_size + 1,
                    'success': False,
                    'message': str(e)
                })
        
        return results

# Usage example
async def main():
    # Initialize client
    wes_manager = OpenWESManager(
        base_url="https://your-openwes-instance.com",
        api_key="your-api-key",
        tenant_id="your-tenant-id"
    )
    
    # Create SKU
    sku_data = {
        'sku_code': 'LAPTOP-2024-001',
        'warehouse_code': 'WH-MAIN',
        'owner_code': 'ACME-CORP',
        'sku_name': 'Premium Business Laptop',
        'brand': 'TechBrand',
        'volume': {
            'volume': 2500000,
            'height': 20,
            'width': 300,
            'length': 400
        },
        'category': 'Electronics',
        'barcodes': ['1234567890123']
    }
    
    await wes_manager.create_sku(sku_data)
    
    # Create inbound order
    inbound_data = {
        'order_no': 'PO-2024-001',
        'warehouse_code': 'WH-MAIN',
        'order_type': 'PURCHASE',
        'storage_type': 'STORAGE',
        'sender': 'Supplier ABC',
        'details': [
            {
                'owner_code': 'ACME-CORP',
                'quantity': 50,
                'sku_code': 'LAPTOP-2024-001',
                'batch_attributes': {
                    'batch_no': 'BATCH-2024-Q1'
                }
            }
        ]
    }
    
    await wes_manager.create_inbound_order(inbound_data)

if __name__ == "__main__":
    asyncio.run(main())
```

### Node.js SDK

#### Installation

```bash
npm install @openwes/node-sdk
```

#### Basic Usage

```javascript
// openwes-client.js
const { OpenWESClient, ClientConfig } = require('@openwes/node-sdk');

class OpenWESManager {
    constructor(baseUrl, apiKey, tenantId) {
        const config = new ClientConfig({
            baseUrl: baseUrl,
            apiKey: apiKey,
            tenantId: tenantId,
            timeout: 30000,
            maxRetries: 3
        });
        
        this.client = new OpenWESClient(config);
    }
    
    async createSKU(skuData) {
        try {
            const request = {
                skuCode: skuData.skuCode,
                warehouseCode: skuData.warehouseCode,
                ownerCode: skuData.ownerCode,
                skuName: skuData.skuName,
                brand: skuData.brand,
                color: skuData.color,
                volume: {
                    volume: skuData.volume.volume,
                    height: skuData.volume.height,
                    width: skuData.volume.width,
                    length: skuData.volume.length
                },
                skuAttribute: {
                    imageUrl: skuData.imageUrl,
                    skuFirstCategory: skuData.category,
                    unit: skuData.unit || 'EA'
                },
                skuBarcode: {
                    barcodes: skuData.barcodes || []
                }
            };
            
            const response = await this.client.sku.create([request]);
            
            if (response.success) {
                console.log(`SKU ${skuData.skuCode} created successfully`);
                return true;
            } else {
                console.error(`Failed to create SKU: ${response.message}`);
                return false;
            }
        } catch (error) {
            console.error(`API error: ${error.message}`);
            return false;
        }
    }
    
    async createInboundOrder(orderData) {
        try {
            const request = {
                customerOrderNo: orderData.orderNo,
                lpnCode: orderData.lpnCode,
                warehouseCode: orderData.warehouseCode,
                customerOrderType: orderData.orderType,
                storageType: orderData.storageType,
                sender: orderData.sender,
                carrier: orderData.carrier,
                trackingNumber: orderData.trackingNumber,
                estimatedArrivalDate: orderData.estimatedArrival,
                details: orderData.details.map(item => ({
                    ownerCode: item.ownerCode,
                    qtyRestocked: item.quantity,
                    skuCode: item.skuCode,
                    skuName: item.skuName,
                    batchAttributes: item.batchAttributes || {},
                    extendFields: item.extendFields || {}
                }))
            };
            
            const response = await this.client.inbound.create([request]);
            return response.success;
            
        } catch (error) {
            console.error(`Failed to create inbound order: ${error.message}`);
            return false;
        }
    }
    
    async createOutboundOrder(orderData) {
        try {
            const request = {
                warehouseCode: orderData.warehouseCode,
                customerWaveNo: orderData.waveNo,
                customerOrderNo: orderData.orderNo,
                customerOrderType: orderData.orderType || 'SALES',
                carrierCode: orderData.carrierCode,
                waybillNo: orderData.waybillNo,
                priority: orderData.priority || 100,
                shortOutbound: orderData.shortOutbound || false,
                shortWaiting: orderData.shortWaiting || true,
                details: orderData.details.map(item => ({
                    ownerCode: item.ownerCode,
                    skuCode: item.skuCode,
                    skuName: item.skuName,
                    qtyRequired: item.quantity,
                    batchAttributes: item.batchAttributes || {},
                    extendFields: item.extendFields || {}
                }))
            };
            
            const response = await this.client.outbound.create([request]);
            return response.success;
            
        } catch (error) {
            console.error(`Failed to create outbound order: ${error.message}`);
            return false;
        }
    }
    
    async trackOrderStatus(orderNo, orderType = 'inbound') {
        try {
            let response;
            if (orderType === 'inbound') {
                response = await this.client.inbound.getStatus(orderNo);
            } else {
                response = await this.client.outbound.getStatus(orderNo);
            }
            
            console.log(`Order: ${orderNo}`);
            console.log(`Status: ${response.status}`);
            console.log(`Progress: ${response.progress}%`);
            console.log(`Last Updated: ${response.lastUpdated}`);
            
            return response;
        } catch (error) {
            console.error(`Failed to track order status: ${error.message}`);
            return null;
        }
    }
}

module.exports = { OpenWESManager };

// Usage example
async function main() {
    const wesManager = new OpenWESManager(
        'https://your-openwes-instance.com',
        'your-api-key',
        'your-tenant-id'
    );
    
    // Create SKU
    const skuData = {
        skuCode: 'LAPTOP-2024-001',
        warehouseCode: 'WH-MAIN',
        ownerCode: 'ACME-CORP',
        skuName: 'Premium Business Laptop',
        brand: 'TechBrand',
        volume: {
            volume: 2500000,
            height: 20,
            width: 300,
            length: 400
        },
        category: 'Electronics',
        barcodes: ['1234567890123']
    };
    
    await wesManager.createSKU(skuData);
    
    // Create inbound order
    const inboundData = {
        orderNo: 'PO-2024-001',
        warehouseCode: 'WH-MAIN',
        orderType: 'PURCHASE',
        storageType: 'STORAGE',
        sender: 'Supplier ABC',
        details: [{
            ownerCode: 'ACME-CORP',
            quantity: 50,
            skuCode: 'LAPTOP-2024-001',
            batchAttributes: {
                batchNo: 'BATCH-2024-Q1'
            }
        }]
    };
    
    await wesManager.createInboundOrder(inboundData);
}

if (require.main === module) {
    main().catch(console.error);
}
```

## ERP Integration Examples

### SAP Integration

```java
// SAPIntegration.java
import com.sap.conn.jco.*;
import com.openwes.sdk.OpenWESClient;

public class SAPOpenWESIntegration {
    
    private final JCoDestination sapDestination;
    private final OpenWESClient wesClient;
    
    public SAPOpenWESIntegration(JCoDestination sapDestination, OpenWESClient wesClient) {
        this.sapDestination = sapDestination;
        this.wesClient = wesClient;
    }
    
    public void syncPurchaseOrdersFromSAP() {
        try {
            // Call SAP RFC to get purchase orders
            JCoFunction function = sapDestination.getRepository()
                    .getFunction("BAPI_PO_GETDETAIL");
            
            JCoParameterList input = function.getImportParameterList();
            input.setValue("PURCHASEORDER", getPurchaseOrderNumber());
            
            function.execute(sapDestination);
            
            // Process SAP response and create OpenWES inbound orders
            JCoTable poItems = function.getTableParameterList().getTable("PO_ITEMS");
            
            List<InboundOrderCreateRequest> wesOrders = new ArrayList<>();
            
            for (int i = 0; i < poItems.getNumRows(); i++) {
                poItems.setRow(i);
                
                InboundOrderCreateRequest order = convertSAPPOToWESInbound(poItems);
                wesOrders.add(order);
            }
            
            // Send to OpenWES
            ApiResponse response = wesClient.inbound().create(wesOrders);
            if (response.isSuccess()) {
                updateSAPPOStatus("SENT_TO_WES");
            }
            
        } catch (JCoException | ApiException e) {
            handleIntegrationError(e);
        }
    }
    
    private InboundOrderCreateRequest convertSAPPOToWESInbound(JCoTable poItem) {
        return InboundOrderCreateRequest.builder()
                .customerOrderNo(poItem.getString("PO_NUMBER"))
                .warehouseCode(mapSAPPlantToWarehouse(poItem.getString("PLANT")))
                .customerOrderType("PURCHASE")
                .storageType("STORAGE")
                .sender(poItem.getString("VENDOR_NAME"))
                .estimatedArrivalDate(convertSAPDateToTimestamp(poItem.getDate("DELIV_DATE")))
                .details(Arrays.asList(
                        InboundDetailDTO.builder()
                                .ownerCode(getOwnerFromSAPCompany())
                                .skuCode(poItem.getString("MATERIAL"))
                                .qtyRestocked(poItem.getInt("QUANTITY"))
                                .batchAttributes(Map.of(
                                        "poNumber", poItem.getString("PO_NUMBER"),
                                        "poLine", poItem.getString("PO_ITEM")
                                ))
                                .build()
                ))
                .build();
    }
    
    public void sendInventoryUpdatesToSAP() {
        try {
            // Get inventory updates from OpenWES
            List<InventoryUpdate> updates = wesClient.inventory().getUpdates();
            
            for (InventoryUpdate update : updates) {
                // Call SAP RFC to update inventory
                JCoFunction function = sapDestination.getRepository()
                        .getFunction("BAPI_GOODSMVT_CREATE");
                
                JCoParameterList input = function.getImportParameterList();
                
                // Set movement header
                JCoStructure header = input.getStructure("GOODSMVT_HEADER");
                header.setValue("PSTNG_DATE", getCurrentSAPDate());
                header.setValue("DOC_DATE", getCurrentSAPDate());
                header.setValue("PR_UNAME", "OPENWES");
                
                // Set movement items
                JCoTable items = function.getTableParameterList().getTable("GOODSMVT_ITEM");
                items.appendRow();
                items.setValue("MATERIAL", update.getSkuCode());
                items.setValue("PLANT", mapWarehouseToSAPPlant(update.getWarehouseCode()));
                items.setValue("STGE_LOC", update.getLocationCode());
                items.setValue("MOVE_TYPE", getSAPMovementType(update.getUpdateType()));
                items.setValue("ENTRY_QNT", Math.abs(update.getQuantityChange()));
                items.setValue("ENTRY_UOM", "EA");
                
                function.execute(sapDestination);
                
                // Check for errors
                JCoTable returnMessages = function.getTableParameterList().getTable("RETURN");
                if (hasErrors(returnMessages)) {
                    handleSAPError(returnMessages, update);
                } else {
                    // Mark update as processed in OpenWES
                    wesClient.inventory().markUpdateProcessed(update.getId());
                }
            }
            
        } catch (JCoException | ApiException e) {
            handleIntegrationError(e);
        }
    }
}
```

### Oracle ERP Integration

```java
// OracleERPIntegration.java
import oracle.jdbc.OracleConnection;
import oracle.jdbc.pool.OracleDataSource;

public class OracleERPIntegration {
    
    private final OracleConnection erpConnection;
    private final OpenWESClient wesClient;
    
    public void syncSalesOrdersFromOracle() {
        String sql = """
            SELECT 
                oh.order_number,
                oh.order_date,
                oh.customer_id,
                ol.inventory_item_id,
                ol.ordered_quantity,
                ol.unit_selling_price,
                ol.ship_to_org_id
            FROM 
                oe_order_headers_all oh
                JOIN oe_order_lines_all ol ON oh.header_id = ol.header_id
            WHERE 
                oh.flow_status_code = 'BOOKED'
                AND oh.last_update_date > ?
            ORDER BY oh.order_number
            """;
        
        try (PreparedStatement stmt = erpConnection.prepareStatement(sql)) {
            stmt.setTimestamp(1, getLastSyncTimestamp());
            
            try (ResultSet rs = stmt.executeQuery()) {
                Map<String, List<OrderLine>> orderMap = new HashMap<>();
                
                while (rs.next()) {
                    String orderNumber = rs.getString("order_number");
                    OrderLine line = new OrderLine(
                        rs.getString("inventory_item_id"),
                        rs.getInt("ordered_quantity"),
                        rs.getBigDecimal("unit_selling_price")
                    );
                    
                    orderMap.computeIfAbsent(orderNumber, k -> new ArrayList<>()).add(line);
                }
                
                // Convert to OpenWES outbound orders
                List<OutboundOrderCreateRequest> wesOrders = orderMap.entrySet().stream()
                        .map(this::convertOracleOrderToWESOutbound)
                        .collect(Collectors.toList());
                
                // Send to OpenWES
                ApiResponse response = wesClient.outbound().create(wesOrders);
                if (response.isSuccess()) {
                    updateLastSyncTimestamp();
                }
            }
        } catch (SQLException | ApiException e) {
            handleIntegrationError(e);
        }
    }
    
    private OutboundOrderCreateRequest convertOracleOrderToWESOutbound(
            Map.Entry<String, List<OrderLine>> orderEntry) {
        
        String orderNumber = orderEntry.getKey();
        List<OrderLine> lines = orderEntry.getValue();
        
        List<OutboundDetailDTO> details = lines.stream()
                .map(line -> OutboundDetailDTO.builder()
                        .ownerCode(getDefaultOwnerCode())
                        .skuCode(line.getItemId())
                        .qtyRequired(line.getQuantity())
                        .extendFields(Map.of(
                                "unitPrice", line.getUnitPrice().toString(),
                                "orderLine", String.valueOf(line.getLineNumber())
                        ))
                        .build())
                .collect(Collectors.toList());
        
        return OutboundOrderCreateRequest.builder()
                .warehouseCode(getDefaultWarehouseCode())
                .customerOrderNo(orderNumber)
                .customerOrderType("SALES")
                .priority(calculatePriority(lines))
                .details(details)
                .build();
    }
}
```

## Equipment Integration Examples

### AGV/Robot Integration

```java
// AGVIntegration.java
import com.openwes.sdk.OpenWESClient;
import com.openwes.sdk.model.equipment.*;

public class AGVIntegration {
    
    private final OpenWESClient wesClient;
    private final AGVControlSystem agvSystem;
    
    public void handleContainerArrival(AGVArrivalEvent event) {
        try {
            ContainerArriveRequest request = ContainerArriveRequest.builder()
                    .workLocationCode(event.getWorkstationCode())
                    .workLocationType("STATION")
                    .workStationId(event.getWorkstationId())
                    .containerDetails(Arrays.asList(
                            ContainerDetailDTO.builder()
                                    .containerCode(event.getContainerCode())
                                    .robotCode(event.getAgvId())
                                    .robotType("AGV")
                                    .locationCode(event.getWorkstationCode())
                                    .groupCode(event.getTaskGroupCode())
                                    .containerAttributes(Map.of(
                                            "agvType", event.getAgvType(),
                                            "arrivalTime", String.valueOf(System.currentTimeMillis()),
                                            "batteryLevel", String.valueOf(event.getBatteryLevel())
                                    ))
                                    .taskCodes(event.getTaskCodes())
                                    .build()
                    ))
                    .build();
            
            ApiResponse response = wesClient.equipment().containerArrive(Arrays.asList(request));
            
            if (response.isSuccess()) {
                // Notify AGV that arrival is confirmed
                agvSystem.confirmArrival(event.getAgvId(), event.getTaskId());
            } else {
                // Handle error - maybe retry or alert operators
                handleArrivalError(event, response.getMessage());
            }
            
        } catch (ApiException e) {
            handleIntegrationError(e, event);
        }
    }
    
    public void updateTaskStatus(String taskCode, TaskStatus status, String agvId) {
        try {
            ContainerTaskStatusUpdateRequest request = ContainerTaskStatusUpdateRequest.builder()
                    .taskCode(taskCode)
                    .taskStatus(mapToWESTaskStatus(status))
                    .robotCode(agvId)
                    .build();
            
            ApiResponse response = wesClient.equipment().updateTaskStatus(Arrays.asList(request));
            
            if (!response.isSuccess()) {
                // Log error and potentially retry
                logger.error("Failed to update task status for task {} on AGV {}: {}", 
                           taskCode, agvId, response.getMessage());
            }
            
        } catch (ApiException e) {
            handleIntegrationError(e, taskCode, agvId);
        }
    }
    
    public void handleNewTaskAssignment(TaskAssignmentEvent event) {
        // Receive task assignment from OpenWES and send to AGV
        try {
            AGVTask agvTask = AGVTask.builder()
                    .taskId(event.getTaskCode())
                    .sourceLocation(event.getSourceLocation())
                    .destinationLocation(event.getDestinationLocation())
                    .containerCode(event.getContainerCode())
                    .priority(event.getPriority())
                    .estimatedDuration(event.getEstimatedDuration())
                    .specialInstructions(event.getSpecialInstructions())
                    .build();
            
            boolean assigned = agvSystem.assignTask(agvTask);
            
            if (assigned) {
                // Update task status to PROCESSING
                updateTaskStatus(event.getTaskCode(), TaskStatus.PROCESSING, 
                               agvTask.getAssignedAgvId());
            } else {
                // Handle assignment failure
                updateTaskStatus(event.getTaskCode(), TaskStatus.FAILED, null);
            }
            
        } catch (Exception e) {
            handleTaskAssignmentError(event, e);
        }
    }
    
    private String mapToWESTaskStatus(TaskStatus agvStatus) {
        return switch (agvStatus) {
            case NEW -> "NEW";
            case IN_PROGRESS -> "PROCESSING";
            case COMPLETED -> "WCS_SUCCEEDED";
            case FAILED -> "WCS_FAILED";
            default -> "NEW";
        };
    }
}
```

### Conveyor System Integration

```java
// ConveyorIntegration.java
public class ConveyorIntegration {
    
    private final OpenWESClient wesClient;
    private final ConveyorController conveyorController;
    
    public void handleContainerArrivalAtSortingPoint(ConveyorEvent event) {
        try {
            // Scan barcode to identify container
            String containerCode = scanBarcode(event.getScannerData());
            
            if (containerCode != null) {
                // Notify OpenWES of container arrival
                ContainerArriveRequest request = ContainerArriveRequest.builder()
                        .workLocationCode(event.getConveyorZone())
                        .workLocationType("CONVEYOR")
                        .containerDetails(Arrays.asList(
                                ContainerDetailDTO.builder()
                                        .containerCode(containerCode)
                                        .locationCode(event.getConveyorZone())
                                        .containerAttributes(Map.of(
                                                "conveyorSpeed", String.valueOf(event.getConveyorSpeed()),
                                                "scannerReading", event.getScannerData(),
                                                "weight", String.valueOf(event.getWeight())
                                        ))
                                        .build()
                        ))
                        .build();
                
                ApiResponse response = wesClient.equipment().containerArrive(Arrays.asList(request));
                
                if (response.isSuccess()) {
                    // Get routing decision from OpenWES
                    RoutingDecision decision = wesClient.equipment()
                            .getRoutingDecision(containerCode, event.getConveyorZone());
                    
                    // Control conveyor based on decision
                    controlConveyorRouting(event.getConveyorId(), decision);
                } else {
                    // Default action - send to manual handling area
                    conveyorController.routeToManualHandling(event.getConveyorId());
                }
            } else {
                // Barcode read failure - route to exception handling
                conveyorController.routeToException(event.getConveyorId(), "BARCODE_READ_FAILURE");
            }
            
        } catch (Exception e) {
            handleConveyorError(event, e);
        }
    }
    
    private void controlConveyorRouting(String conveyorId, RoutingDecision decision) {
        switch (decision.getAction()) {
            case "ROUTE_TO_STATION":
                conveyorController.routeToStation(conveyorId, decision.getTargetStation());
                break;
            case "ROUTE_TO_STORAGE":
                conveyorController.routeToStorage(conveyorId, decision.getStorageZone());
                break;
            case "ROUTE_TO_SHIPPING":
                conveyorController.routeToShipping(conveyorId, decision.getShippingDock());
                break;
            case "HOLD":
                conveyorController.holdContainer(conveyorId, decision.getHoldReason());
                break;
            default:
                conveyorController.routeToManualHandling(conveyorId);
        }
    }
}
```

## Error Handling and Retry Strategies

### Resilient Integration Patterns

```java
// ResilientIntegration.java
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.bulkhead.Bulkhead;

public class ResilientOpenWESIntegration {
    
    private final OpenWESClient wesClient;
    private final Retry retry;
    private final CircuitBreaker circuitBreaker;
    private final Bulkhead bulkhead;
    
    public ResilientOpenWESIntegration(OpenWESClient wesClient) {
        this.wesClient = wesClient;
        
        // Configure retry policy
        this.retry = Retry.ofDefaults("openWESRetry");
        
        // Configure circuit breaker
        this.circuitBreaker = CircuitBreaker.ofDefaults("openWESCircuitBreaker");
        
        // Configure bulkhead for rate limiting
        this.bulkhead = Bulkhead.ofDefaults("openWESBulkhead");
    }
    
    public CompletableFuture<ApiResponse> createInboundOrderWithResilience(
            InboundOrderCreateRequest request) {
        
        Supplier<ApiResponse> supplier = () -> {
            try {
                return wesClient.inbound().create(Arrays.asList(request));
            } catch (ApiException e) {
                throw new RuntimeException(e);
            }
        };
        
        // Apply resilience patterns
        Supplier<ApiResponse> decoratedSupplier = Bulkhead
                .decorateSupplier(bulkhead, supplier);
        decoratedSupplier = CircuitBreaker
                .decorateSupplier(circuitBreaker, decoratedSupplier);
        decoratedSupplier = Retry
                .decorateSupplier(retry, decoratedSupplier);
        
        return CompletableFuture.supplyAsync(decoratedSupplier);
    }
    
    public void handleFailedOperation(String operationType, Object requestData, Exception error) {
        // Log the failure
        logger.error("Operation {} failed: {}", operationType, error.getMessage(), error);
        
        // Store failed operation for retry
        FailedOperation failedOp = FailedOperation.builder()
                .operationType(operationType)
                .requestData(serializeRequestData(requestData))
                .errorMessage(error.getMessage())
                .attemptCount(1)
                .nextRetryTime(calculateNextRetryTime())
                .build();
        
        failedOperationRepository.save(failedOp);
        
        // Send alert if needed
        if (isAlertRequired(error)) {
            alertService.sendAlert("OpenWES Integration Failure", 
                                 "Operation: " + operationType + 
                                 ", Error: " + error.getMessage());
        }
    }
    
    @Scheduled(fixedDelay = 60000) // Run every minute
    public void retryFailedOperations() {
        List<FailedOperation> failedOps = failedOperationRepository
                .findByNextRetryTimeBefore(Instant.now());
        
        for (FailedOperation failedOp : failedOps) {
            try {
                boolean success = retryOperation(failedOp);
                
                if (success) {
                    failedOperationRepository.delete(failedOp);
                    logger.info("Successfully retried operation: {}", failedOp.getOperationType());
                } else {
                    // Increment attempt count and schedule next retry
                    failedOp.setAttemptCount(failedOp.getAttemptCount() + 1);
                    
                    if (failedOp.getAttemptCount() > MAX_RETRY_ATTEMPTS) {
                        // Move to dead letter queue or alert
                        moveToDeadLetterQueue(failedOp);
                        failedOperationRepository.delete(failedOp);
                    } else {
                        failedOp.setNextRetryTime(calculateNextRetryTime(failedOp.getAttemptCount()));
                        failedOperationRepository.save(failedOp);
                    }
                }
                
            } catch (Exception e) {
                logger.error("Error during retry of operation {}: {}", 
                           failedOp.getOperationType(), e.getMessage());
            }
        }
    }
}
```

This comprehensive integration guide provides practical examples for connecting OpenWES with various external systems. The SDKs and examples demonstrate best practices for error handling, retry strategies, and resilient integration patterns.