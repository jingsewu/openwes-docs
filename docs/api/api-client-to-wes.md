---
id: api-client-to-wes
title: Api Client To WES
sidebar_position: 1
---

# Open Warehouse Execution Management System API Documentation

**Version: v1.0**  
**Last Updated: 2025-08-01**

> This document describes how **client systems** actively call WES to issue critical tasks such as inbound/outbound and container task callbacks.

## 🔐 Authentication

All API requests must include an api key in the header:

```http
X-API-KEY: <your_api_key>
```

### Authentication Errors

| Status Code | Description     | Solution                |
|-------------|-----------------|-------------------------|
| 401         | Invalid API Key | Get the correct API key |

## 🌐 Base Information

**Base URL**: `https://${url}:${port}/api-platform/api`  
**Endpoint**: `POST /execute`  
**Content-Type**: `application/json`

## 📝 Request Format

### Common Headers

```http
Content-Type: application/json
X-Tenant-Id: <your_tenant_id>   //Required for SaaS services
X-API-KEY: <your_api_key>
X-Request-ID: <unique_request_id>
```

### Common Parameters

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| apiType   | String | ✅        | API type identifier              |
| body      | JSON   | ✅        | Request body (varies by apiType) |

-----
## Upstream Call APIs (WMS/ERP/MES → WES )

### SKU Management

### apiType: `SKU_CREATE`

Creates a new SKU (Stock Keeping Unit)

**Request Body Schema:**

```json
[
  {
    "skuCode": "SKU-2023-001",
    "warehouseCode": "WH-EAST-01",
    "ownerCode": "ACME_CORP",
    "skuName": "Premium Laptop",
    "color": "Space Gray",
    "brand": "OpenWES",
    "volumeDTO": {
      "volume": 1500000,
      "height": 150,
      "width": 100,
      "length": 100
    },
    "skuAttribute": {
      "imageUrl": "https://storage.example.com/sku123.jpg",
      "skuFirstCategory": "Electronics",
      "skuSecondCategory": "Computers"
    },
    "skuPackage": {
      "skuPackageDetails": [
        {
          "level": 1,
          "packageCode": "LP-BOX-01",
          "unit": "box",
          "height": 200,
          "width": 300,
          "length": 400,
          "weight": 1500
        }
      ]
    },
    "skuBarcode": {
      "barcodes": [
        "1234567890123",
        "2345678901234"
      ]
    }
  }
]
```
### Field Descriptions

| Field            | Type     | Required | Description           |
|------------------|----------|----------|-----------------------|
| skuCode          | string   | Yes      | SKU code, max length 64 |
| warehouseCode    | string   | Yes      | Warehouse code, max length 64 |
| ownerCode        | string   | Yes      | Owner code, max length 64 |
| skuName          | string   | Yes      | SKU name, max length 128 |
| style            | string   | No       | SKU style             |
| color            | string   | No       | SKU color             |
| size             | string   | No       | SKU size              |
| brand            | string   | No       | SKU brand             |
| weight           | object   | No       | Weight information    |
| volumeDTO        | object   | No       | Volume information    |
| skuAttribute     | object   | No       | SKU attributes        |
| skuConfig        | object   | No       | SKU configuration     |
| skuPackage       | object   | No       | SKU packaging         |
| skuBarcode       | object   | No       | SKU barcodes          |

#### Volume Information (VolumeDTO)

| Field  | Type | Required | Description           |
|--------|------|----------|-----------------------|
| volume | long | Yes      | Volume in cubic millimeters, ≥0 |
| height | long | Yes      | Height in millimeters, ≥0 |
| width  | long | Yes      | Width in millimeters, ≥0 |
| length | long | Yes      | Length in millimeters, ≥0 |

#### SKU Attributes (SkuAttributeDTO)

| Field                   | Type   | Required | Description     |
|-------------------------|--------|----------|-----------------|
| imageUrl                | string | No       | SKU image URL   |
| unit                    | string | No       | SKU unit        |
| skuFirstCategory        | string | No       | First-level category |
| skuSecondCategory       | string | No       | Second-level category |
| skuThirdCategory        | string | No       | Third-level category |
| skuAttributeCategory    | string | No       | Attribute category |
| skuAttributeSubCategory | string | No       | Attribute sub-category |

#### SKU Packaging (SkuPackageDTO)

| Field                | Type   | Required | Description         |
|----------------------|--------|----------|---------------------|
| skuPackageDetails    | array  | No       | Packaging details list |

##### Packaging Detail

| Field       | Type    | Required | Description           |
|-------------|---------|----------|-----------------------|
| level       | integer | Yes      | Packaging level       |
| packageCode | string  | Yes      | Package code          |
| unit        | string  | Yes      | Package unit          |
| enableSplit | boolean | No       | Whether split is allowed |
| height      | long    | Yes      | Package height(mm) ≥0 |
| width       | long    | Yes      | Package width(mm) ≥0  |
| length      | long    | Yes      | Package length(mm) ≥0 |
| weight      | integer | Yes      | Package weight(mg) ≥0 |

#### SKU Barcode (BarcodeDTO)

| Field    | Type  | Required | Description                   |
|----------|-------|----------|-------------------------------|
| barcodes | array | No       | Barcode list (must be unique) |

**Success Response:**

```json
{
  "code": "0",
  "msg": "success"
}
```

### Inbound Management

### apiType: `ORDER_INBOUND_CREATE`

**Request Body Schema:**

```json
[
  {
    "customerOrderNo": "CUST-ORDER-001",
    "lpnCode": "LPN123456",
    "warehouseCode": "WH01",
    "customerOrderType": "PURCHASE|RETURN|TRANSFER",
    "storageType": "STORAGE|OVERSTOCK|IN_TRANSIT",
    "sender": "Supplier A",
    "carrier": "SF Express",
    "shippingMethod": "Land Transport",
    "trackingNumber": "SF123456789",
    "estimatedArrivalDate": 1672531200000,
    "remark": "Fragile goods, handle with care",
    "extendFields": {
      "customField1": "value1",
      "customField2": 100
    },
    "details": [
      {
        "ownerCode": "OWNER01",
        "boxNo": "BOX001",
        "qtyRestocked": 100,
        "skuCode": "SKU001",
        "skuName": "Product A",
        "style": "2023 New Style",
        "color": "Red",
        "size": "XL",
        "brand": "Brand A",
        "batchAttributes": {
          "batchNo": "BATCH2023",
          "productionDate": "2023-01-01"
        },
        "extendFields": {
          "qualityGrade": "A"
        }
      }
    ]
  }
]
```

### Field Descriptions

#### Main Order Fields

| Field                   | Type     | Required | Description                                 |
|-------------------------|----------|----------|---------------------------------------------|
| customerOrderNo         | string   | Yes      | Customer order number, max length 64        |
| lpnCode                 | string   | No       | LPN code, max length 64                     |
| warehouseCode           | string   | Yes      | Warehouse code, max length 64               |
| customerOrderType       | string   | Yes      | Inbound order plan type                     |
| storageType             | string   | Yes      | Storage type (STORAGE/OVERSTOCK/IN_TRANSIT) |
| sender                  | string   | No       | Sender, max length 128                      |
| carrier                 | string   | No       | Logistics company, max length 128           |
| shippingMethod          | string   | No       | Shipping method, max length 128             |
| trackingNumber          | string   | No       | Tracking number, max length 128             |
| estimatedArrivalDate    | long     | No       | Estimated arrival date (timestamp)          |
| remark                  | string   | No       | Remarks, max length 255                     |
| extendFields            | object   | No       | Extended fields (key-value format)          |
| details                 | array    | Yes      | Inbound details list                        |

#### Detail Fields

| Field              | Type      | Required | Description                    |
|--------------------|-----------|----------|--------------------------------|
| ownerCode          | string    | Yes      | Owner code, max length 64      |
| boxNo              | string    | No       | Box number, max length 64      |
| qtyRestocked       | integer   | Yes      | Inbound quantity (≥1)          |
| skuCode            | string    | Yes      | SKU code, max length 64        |
| skuName            | string    | No       | Product name                   |
| style              | string    | No       | Product style                  |
| color              | string    | No       | Product color                  |
| size               | string    | No       | Product size                   |
| brand              | string    | No       | Product brand                  |
| batchAttributes    | object    | No       | Batch attributes (key-value)   |
| extendFields       | object    | No       | Extended attributes (key-value)|

#### Storage Type Enumeration

| Value      | Description |
|------------|-------------|
| STORAGE    | Storage     |
| OVERSTOCK  | Cross-dock  |
| IN_TRANSIT | In-transit  |

**Success Response:**

```json
{
  "code": "0",
  "msg": "success"
}
```

### apiType: `ORDER_INBOUND_CANCEL`

**Request Body Schema:**

```json
{
  "identifyNos": [
    "INB-2023001",
    "INB-2023002"
  ],
  "warehouseCode": "WH01"
}
```

### Field Descriptions

| Field            | Type     | Required | Description                              |
|------------------|----------|----------|------------------------------------------|
| identifyNos      | array    | Yes      | List of inbound order numbers to cancel (batch support) |
| warehouseCode    | string   | Yes      | Warehouse code (for permission verification) |

### Success Response

```json
{
  "code": "0",
  "msg": "success"
}
```

### Outbound Management

### apiType: `ORDER_OUTBOUND_CREATE`

Creates one or more outbound plan orders

**Request Body Schema:**

```json
[
  {
    "warehouseCode": "WH-EAST-01",
    "customerWaveNo": "WAVE-2023-001",
    "customerOrderNo": "CUST-ORDER-001",
    "customerOrderType": "SALES",
    "carrierCode": "SF-EXPRESS",
    "waybillNo": "SF123456789",
    "origPlatformCode": "TMALL",
    "expiredTime": 1672531200000,
    "priority": 100,
    "shortOutbound": false,
    "shortWaiting": false,
    "orderNo": "ORD-2023-001",
    "destinations": ["SHELF-A1", "SHELF-A2"],
    "extendFields": {
      "deliveryType": "express",
      "specialInstructions": "handle with care"
    },
    "details": [
      {
        "ownerCode": "ACME_CORP",
        "skuCode": "SKU-2023-001",
        "skuName": "Premium Laptop",
        "batchAttributes": {
          "batchNo": "BATCH2023",
          "productionDate": "2023-01-01",
          "expirationDate": "2025-01-01"
        },
        "qtyRequired": 10,
        "qtyAllocated": 0,
        "qtyActual": 0,
        "extendFields": {
          "qualityGrade": "A",
          "remark": "fragile"
        }
      }
    ]
  }
]
```

#### Field Descriptions

#### Main Order Fields 

| Field                   | Type     | Required | Description                                |
|-------------------------|----------|----------|--------------------------------------------|
| warehouseCode           | string   | Yes      | Warehouse code, max length 64              |
| customerWaveNo          | string   | No       | External wave number                       |
| customerOrderNo         | string   | Yes      | Customer order number, max length 64       |
| customerOrderType       | string   | No       | Outbound order type                        |
| carrierCode             | string   | No       | Carrier code                               |
| waybillNo               | string   | No       | Waybill number                             |
| origPlatformCode        | string   | No       | Original platform code                     |
| expiredTime             | long     | No       | Cut-off time (timestamp)                   |
| priority                | integer  | No       | Priority, higher value = higher priority   |
| shortOutbound           | boolean  | No       | Whether short-shipping allowed, default false |
| shortWaiting            | boolean  | No       | Whether backorder waiting allowed, default false |
| orderNo                 | string   | Yes      | Order number, generated according to system rules |
| destinations            | array    | No       | Container destination list                 |
| extendFields            | object   | No       | Extended fields (key-value format)         |
| details                 | array    | Yes      | Outbound plan order details list           |

#### Detail Fields (OutboundPlanOrderDetailDTO)

| Field              | Type     | Required | Description                    |
|--------------------|----------|----------|--------------------------------|
| ownerCode          | string   | Yes      | Owner code, max length 64      |
| skuCode            | string   | Yes      | SKU code, max length 64        |
| skuName            | string   | No       | SKU name, max length 128       |
| batchAttributes    | object   | No       | Batch attributes (key-value)   |
| qtyRequired        | integer  | Yes      | Required outbound quantity (≥1)|
| qtyAllocated       | integer  | No       | Pre-allocated batch stock quantity |
| qtyActual          | integer  | No       | Actual outbound quantity       |
| extendFields       | object   | No       | Extended fields (key-value)    |

**Success Response:**

```json
{
  "code": "0",
  "msg": "success"
}
```

### apiType: `ORDER_OUTBOUND_CANCEL`

Cancels outbound plan orders based on customer order numbers

**Request Body Schema:**

```json
{
  "customerOrderNos": [
    "CUST-ORDER-001",
    "CUST-ORDER-002"
  ]
}
```

### Field Descriptions

| Field             | Type   | Required | Description                              |
|-------------------|--------|----------|------------------------------------------|
| customerOrderNos  | array  | Yes      | List of customer order numbers to cancel (batch support) |

### Success Response

```json
{
  "code": "0",
  "msg": "success"
}
```

## RCS -> WES

### Container TASK Management

### apiType: `CONTAINER_ARRIVE`

Notify the system that a container has arrived at a workstation to trigger subsequent operations.

**Request Body Schema:**

```json
[
  {
    "workLocationCode": "WS-001-A",
    "workLocationType": "STATION",
    "workStationId": 1001,
    "warehouseAreaId": 2001,
    "containerDetails": [
      {
        "containerCode": "C-2023-001",
        "face": "A",
        "robotCode": "RBT-001",
        "robotType": "KIVA",
        "level": 2,
        "bay": 3,
        "locationCode": "LOC-A-01",
        "forwardFace": "FRONT",
        "groupCode": "GRP-001",
        "containerAttributes": {
          "weight": "10.5",
          "fragile": true,
          "priority": "high"
        },
        "taskCodes": ["TASK-001", "TASK-002"]
      }
    ]
  }
]
```

### Field Descriptions

#### Main Fields 

| Field               | Type   | Required | Description                     |
|---------------------|--------|----------|---------------------------------|
| workLocationCode    | string | Yes      | Work location code (e.g., workstation, picking location) |
| workLocationType    | enum   | No       | Work location type (see enumeration) |
| workStationId       | long   | No       | Workstation ID                  |
| warehouseAreaId     | long   | No       | Warehouse area ID               |
| containerDetails    | array  | Yes      | Container details list          |

#### Container Detail Fields

| Field               | Type    | Required | Description                             |
|---------------------|---------|----------|-----------------------------------------|
| containerCode       | string  | Yes      | Container code (e.g., tote, pallet)     |
| face                | string  | No       | Container face (for KIVA rack faces like A/B/C/D) |
| robotCode           | string  | No       | Robot code (e.g., AGV ID)               |
| robotType           | string  | No       | Robot type (e.g., KIVA, AGV, AMR)       |
| level               | integer | No       | Level of container in rack              |
| bay                 | integer | No       | Bay of container in rack                |
| locationCode        | string  | Yes      | Current location code of container (location, workstation) |
| forwardFace         | string  | No       | Forward face of container (A/B for tote orientation) |
| groupCode           | string  | Yes      | Container group code (e.g., wave, task group) |
| containerAttributes | object  | No       | Container extended attributes (weight, fragile, priority, etc.) |
| taskCodes           | array   | No       | List of task codes associated with this container |

#### Work Location Type Enumeration (WorkLocationTypeEnum)

| Value          | Description             |
|----------------|-------------------------|
| BUFFER_SHELVING | Buffer shelving workstation |
| ROBOT          | Robot                   |
| CONVEYOR       | Conveyor                |

**Success Response:**

```json
{
  "code": "0",
  "msg": "success"
}
```

### apiType: `CONTAINER_TASK_STATUS_UPDATE`

Update container task execution status for external systems like WCS/RCS to report task progress.

**Request Body Schema:**

```json
[
  {
    "taskCode": "TASK-2023-001",
    "taskStatus": "EXECUTING",
    "robotCode": "RBT-AGV-01",
    "containerCode": "C-2023-001",
    "workStationId": 1001,
    "locationCode": "LOC-A-01"
  }
]
```

### Field Descriptions 

| Field           | Type                    | Required | Description                                |
|-----------------|-------------------------|----------|--------------------------------------------|
| taskCode        | string                  | Yes      | Task code, globally unique                 |
| taskStatus      | ContainerTaskStatusEnum | Yes      | Current task status, see table below       |
| robotCode       | string                  | No       | Robot code executing the task (AGV/KIVA ID)|
| containerCode   | string                  | No       | Container code bound to the task (tote, pallet)|
| workStationId   | long                    | No       | Task workstation or target workstation ID  |
| locationCode    | string                  | No       | Task or target location code (location, picking station, dock, etc.) |

#### Task Status Enumeration (ContainerTaskStatusEnum)

| Value       | Description |
|-------------|-------------|
| NEW         | New         |
| PROCESSING  | In progress |
| WCS_SUCCEEDED | Completed   |
| WCS_FAILED    | Failed      |

**Success Response:**

```json
{
  "code": "0",
  "msg": "success"
}
```

## ⚠️ Error Handling

### Common Error Codes

| Code | Status                | Description                        |
|------|-----------------------|------------------------------------|
| 200  | Success               | Request processed successfully     |
| 400  | Bad Request           | Invalid parameters or request body |
| 401  | Unauthorized          | Missing or invalid authentication  |
| 403  | Forbidden             | Insufficient permissions           |
| 404  | Not Found             | Resource not found                 |
| 429  | Too Many Requests     | Rate limit exceeded                |
| 500  | Internal Server Error | Server-side error                  |

### Error Response Example

```json
{
  "code": "400",
  "msg": "Invalid request parameters"
}
```

## 📈 Rate Limiting

The API implements rate limiting per token:

- 1000 requests per minute per IP
- 500000 requests per hour per token

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "code": "429",
  "message": "Rate limit exceeded. Please try again in 60 seconds",
  "requestId": "req-123456",
  "timestamp": "2024-02-11T10:30:00Z"
}
```
