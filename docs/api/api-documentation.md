# Open Warehouse Execution Management System API Documentation

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

**Base URL**: `https://api.warehouse.example.com/v1`  
**Endpoint**: `POST /execute`  
**Content-Type**: `application/json`

## 📝 Request Format

### Common Headers

```http
Content-Type: application/json
X-API-KEY: <your_api_key>
X-Request-ID: <unique_request_id>
```

### Common Parameters

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| apiType   | String | ✅        | API type identifier              |
| body      | JSON   | ✅        | Request body (varies by apiType) |

## 📦 Available APIs

### SKU Management
---

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

#### 字段说明

| 字段            | 类型     | 必填 | 说明           |
|---------------|--------|----|--------------|
| skuCode       | string | 是  | 商品编码，最大长度64  |
| warehouseCode | string | 是  | 仓库编码，最大长度64  |
| ownerCode     | string | 是  | 货主编码，最大长度64  |
| skuName       | string | 是  | 商品名称，最大长度128 |
| style         | string | 否  | 商品样式         |
| color         | string | 否  | 商品颜色         |
| size          | string | 否  | 商品尺寸         |
| brand         | string | 否  | 商品品牌         |
| weight        | object | 否  | 重量信息         |
| volumeDTO     | object | 否  | 体积信息         |
| skuAttribute  | object | 否  | 商品属性         |
| skuConfig     | object | 否  | 商品配置         |
| skuPackage    | object | 否  | 商品包装         |
| skuBarcode    | object | 否  | 商品条码         |

#### 体积信息(VolumeDTO)

| 字段     | 类型   | 必填 | 说明          |
|--------|------|----|-------------|
| volume | long | 是  | 体积(立方毫米) ≥0 |
| height | long | 是  | 高(毫米) ≥0    |
| width  | long | 是  | 宽(毫米) ≥0    |
| length | long | 是  | 长(毫米) ≥0    |

#### 商品属性(SkuAttributeDTO)

| 字段                      | 类型     | 必填 | 说明     |
|-------------------------|--------|----|--------|
| imageUrl                | string | 否  | 商品图片地址 |
| unit                    | string | 否  | 商品单位   |
| skuFirstCategory        | string | 否  | 一级分类   |
| skuSecondCategory       | string | 否  | 二级分类   |
| skuThirdCategory        | string | 否  | 三级分类   |
| skuAttributeCategory    | string | 否  | 属性类别   |
| skuAttributeSubCategory | string | 否  | 属性子类别  |

#### 商品包装(SkuPackageDTO)

| 字段                | 类型    | 必填 | 说明     |
|-------------------|-------|----|--------|
| skuPackageDetails | array | 否  | 包装明细列表 |

##### 包装明细

| 字段          | 类型      | 必填 | 说明          |
|-------------|---------|----|-------------|
| level       | integer | 是  | 包装级别        |
| packageCode | string  | 是  | 包装编码        |
| unit        | string  | 是  | 包装单位        |
| enableSplit | boolean | 否  | 是否可拆包       |
| height      | long    | 是  | 包装高度(mm) ≥0 |
| width       | long    | 是  | 包装宽度(mm) ≥0 |
| length      | long    | 是  | 包装长度(mm) ≥0 |
| weight      | integer | 是  | 包装重量(mg) ≥0 |

#### 商品条码(BarcodeDTO)

| 字段       | 类型    | 必填 | 说明           |
|----------|-------|----|--------------|
| barcodes | array | 否  | 条码列表(需确保唯一性) |

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
    "storageType": "storage|overstock|in_transit",
    "sender": "供应商A",
    "carrier": "顺丰快递",
    "shippingMethod": "陆运",
    "trackingNumber": "SF123456789",
    "estimatedArrivalDate": 1672531200000,
    "remark": "易碎品，小心搬运",
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
        "skuName": "商品A",
        "style": "2023新款",
        "color": "红色",
        "size": "XL",
        "brand": "品牌A",
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

### 字段说明

#### 主单字段说明

| 字段                   | 类型     | 必填 | 说明                                 |
|----------------------|--------|----|------------------------------------|
| customerOrderNo      | string | 是  | 客户订单号，最大长度64                       |
| lpnCode              | string | 否  | LPN编码，最大长度64                       |
| warehouseCode        | string | 是  | 仓库编码，最大长度64                        |
| customerOrderType    | string | 是  | 入库计划单类型                            |
| storageType          | string | 是  | 存储类型(STORAGE/OVERSTOCK/IN_TRANSIT) |
| sender               | string | 否  | 发货人，最大长度128                        |
| carrier              | string | 否  | 物流公司，最大长度128                       |
| shippingMethod       | string | 否  | 购买方式，最大长度128                       |
| trackingNumber       | string | 否  | 快递单号，最大长度128                       |
| estimatedArrivalDate | long   | 否  | 预计送达日期(时间戳)                        |
| remark               | string | 否  | 备注，最大长度255                         |
| extendFields         | object | 否  | 扩展字段(key-value形式)                  |
| details              | array  | 是  | 入库明细列表                             |

#### 明细字段说明

| 字段              | 类型      | 必填 | 说明                |
|-----------------|---------|----|-------------------|
| ownerCode       | string  | 是  | 货主编码，最大长度64       |
| boxNo           | string  | 否  | 箱号，最大长度64         |
| qtyRestocked    | integer | 是  | 入库数量(≥1)          |
| skuCode         | string  | 是  | 商品编码，最大长度64       |
| skuName         | string  | 否  | 商品名称              |
| style           | string  | 否  | 商品样式              |
| color           | string  | 否  | 商品颜色              |
| size            | string  | 否  | 商品尺寸              |
| brand           | string  | 否  | 商品品牌              |
| batchAttributes | object  | 否  | 批次属性(key-value形式) |
| extendFields    | object  | 否  | 扩展属性(key-value形式) |

#### 存储类型枚举

| 值          | 说明 |
|------------|----|
| storage    | 存储 |
| overstock  | 越库 |
| in_transit | 在途 |

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

### 字段说明

| 字段            | 类型     | 必填 | 说明               |
|---------------|--------|----|------------------|
| identifyNos   | array  | 是  | 要取消的入库单号列表（支持批量） |
| warehouseCode | string | 是  | 仓库编码（用于校验权限）     |

### Success Response

```json
{
  "code": "0",
  "msg": "success"
}
```

## 🔄 Response Format

All APIs return responses in the following format:

```json
{
  "success": "",
  "code": "string",
  "message": "string",
  "data": {},
  "requestId": "string",
  "timestamp": "datetime"
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

- 100 requests per minute per IP
- 1000 requests per hour per token

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

## 📚 Best Practices

1. Always include a unique `X-Request-ID` in headers for request tracking
2. Handle token expiration by implementing refresh token logic
3. Implement exponential backoff for failed requests
4. Cache frequently used data to minimize API calls
5. Use appropriate HTTP methods for different operations

