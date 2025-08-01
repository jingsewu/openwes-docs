---
id: api-client-to-wes
title: Api Client To WES
sidebar_position: 1
---

# Open Warehouse Execution Management System API 文档

**版本：v1.0**  
**最后更新：2025-08-01**

> 本文档描述了**客户端系统**如何主动调用 WES，以发出入库、出库等关键任务，以及容器任务回调的处理方式。

## 🔐 认证

所有 API 请求必须在请求头中包含 API 密钥：

```http
X-API-KEY: <your_api_key>
```

### 认证错误

| 状态码 | 描述       | 解决方法         |
|--------|------------|------------------|
| 401    | 无效的 API 密钥 | 获取正确的 API 密钥 |

## 🌐 基本信息

**基础 URL**：`https://${url}:${port}/api-platform/api`  
**接口地址**：`POST /execute`  
**Content-Type**：`application/json`

## 📝 请求格式

### 通用请求头

```http
Content-Type: application/json
X-Tenant-Id: <your_tenant_id>   // SaaS 服务必填
X-API-KEY: <your_api_key>
X-Request-ID: <unique_request_id>
```

### 通用参数

| 参数名  | 类型   | 是否必填 | 描述             |
|---------|--------|----------|------------------|
| apiType | String | ✅        | API 类型标识符   |
| body    | JSON   | ✅        | 请求体（根据 apiType 变化） |

-----
## 上游调用 API（WMS/ERP/MES → WES）

### SKU 管理

### apiType: `SKU_CREATE`

创建新的 SKU（库存单位）

**请求体结构：**

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

### 字段说明

| 字段名         | 类型   | 是否必填 | 描述                     |
|----------------|--------|----------|--------------------------|
| skuCode        | string | 是       | SKU 编码，最大长度 64    |
| warehouseCode  | string | 是       | 仓库编码，最大长度 64    |
| ownerCode      | string | 是       | 货主编码，最大长度 64    |
| skuName        | string | 是       | SKU 名称，最大长度 128   |
| style          | string | 否       | SKU 款式                 |
| color          | string | 否       | SKU 颜色                 |
| size           | string | 否       | SKU 尺码                 |
| brand          | string | 否       | SKU 品牌                 |
| weight         | object | 否       | 重量信息                 |
| volumeDTO      | object | 否       | 体积信息                 |
| skuAttribute   | object | 否       | SKU 属性                 |
| skuConfig      | object | 否       | SKU 配置                 |
| skuPackage     | object | 否       | SKU 包装                 |
| skuBarcode     | object | 否       | SKU 条码                 |

#### 体积信息（VolumeDTO）

| 字段名 | 类型 | 是否必填 | 描述               |
|--------|------|----------|--------------------|
| volume | long | 是       | 体积，单位：立方毫米，≥0 |
| height | long | 是       | 高度，单位：毫米，≥0 |
| width  | long | 是       | 宽度，单位：毫米，≥0 |
| length | long | 是       | 长度，单位：毫米，≥0 |

#### SKU 属性（SkuAttributeDTO）

| 字段名                  | 类型   | 是否必填 | 描述         |
|-------------------------|--------|----------|--------------|
| imageUrl                | string | 否       | SKU 图片地址 |
| unit                    | string | 否       | SKU 单位     |
| skuFirstCategory        | string | 否       | 一级分类     |
| skuSecondCategory       | string | 否       | 二级分类     |
| skuThirdCategory        | string | 否       | 三级分类     |
| skuAttributeCategory    | string | 否       | 属性分类     |
| skuAttributeSubCategory | string | 否       | 属性子分类   |

#### SKU 包装（SkuPackageDTO）

| 字段名             | 类型  | 是否必填 | 描述         |
|--------------------|--------|----------|--------------|
| skuPackageDetails  | array  | 否       | 包装明细列表 |

##### 包装明细

| 字段名       | 类型    | 是否必填 | 描述             |
|--------------|---------|----------|------------------|
| level        | integer | 是       | 包装层级         |
| packageCode  | string  | 是       | 包装编码         |
| unit         | string  | 是       | 包装单位         |
| enableSplit  | boolean | 否       | 是否允许拆分     |
| height       | long    | 是       | 包装高度（毫米）≥0 |
| width        | long    | 是       | 包装宽度（毫米）≥0 |
| length       | long    | 是       | 包装长度（毫米）≥0 |
| weight       | integer | 是       | 包装重量（毫克）≥0 |

#### SKU 条码（BarcodeDTO）

| 字段名   | 类型  | 是否必填 | 描述             |
|----------|--------|----------|------------------|
| barcodes | array  | 否       | 条码列表（需唯一） |

**成功响应：**

```json
{
  "code": "0",
  "msg": "success"
}
```

### 入库管理

### apiType: `ORDER_INBOUND_CREATE`

**请求体结构：**

```json
[
  {
    "customerOrderNo": "CUST-ORDER-001",
    "lpnCode": "LPN123456",
    "warehouseCode": "WH01",
    "customerOrderType": "PURCHASE|RETURN|TRANSFER",
    "storageType": "STORAGE|OVERSTOCK|IN_TRANSIT",
    "sender": "供应商 A",
    "carrier": "顺丰速运",
    "shippingMethod": "陆运",
    "trackingNumber": "SF123456789",
    "estimatedArrivalDate": 1672531200000,
    "remark": "易碎品，轻拿轻放",
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
        "skuName": "产品 A",
        "style": "2023 新款",
        "color": "红色",
        "size": "XL",
        "brand": "品牌 A",
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

#### 主订单字段

| 字段名               | 类型   | 是否必填 | 描述                     |
|----------------------|--------|----------|--------------------------|
| customerOrderNo      | string | 是       | 客户订单号，最大长度 64  |
| lpnCode              | string | 否       | LPN 编码，最大长度 64    |
| warehouseCode        | string | 是       | 仓库编码，最大长度 64    |
| customerOrderType    | string | 是       | 入库订单计划类型         |
| storageType          | string | 是       | 存储类型（STORAGE/OVERSTOCK/IN_TRANSIT） |
| sender               | string | 否       | 发货方，最大长度 128     |
| carrier              | string | 否       | 物流公司，最大长度 128   |
| shippingMethod       | string | 否       | 运输方式，最大长度 128   |
| trackingNumber       | string | 否       | 物流单号，最大长度 128   |
| estimatedArrivalDate | long   | 否       | 预计到达时间（时间戳）   |
| remark               | string | 否       | 备注，最大长度 255       |
| extendFields         | object | 否       | 扩展字段（键值对格式）   |
| details              | array  | 是       | 入库明细列表             |

#### 明细字段

| 字段名          | 类型    | 是否必填 | 描述             |
|-----------------|---------|----------|------------------|
| ownerCode       | string  | 是       | 货主编码，最大长度 64 |
| boxNo           | string  | 否       | 箱号，最大长度 64 |
| qtyRestocked    | integer | 是       | 入库数量（≥1）   |
| skuCode         | string  | 是       | SKU 编码，最大长度 64 |
| skuName         | string  | 否       | 商品名称         |
| style           | string  | 否       | 商品款式         |
| color           | string  | 否       | 商品颜色         |
| size            | string  | 否       | 商品尺码         |
| brand           | string  | 否       | 商品品牌         |
| batchAttributes | object  | 否       | 批次属性（键值对） |
| extendFields    | object  | 否       | 扩展属性（键值对） |

#### 存储类型枚举

| 值         | 描述     |
|------------|----------|
| STORAGE    | 存储     |
| OVERSTOCK  | 越库     |
| IN_TRANSIT | 在途     |

**成功响应：**

```json
{
  "code": "0",
  "msg": "success"
}
```

### apiType: `ORDER_INBOUND_CANCEL`

**请求体结构：**

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

| 字段名         | 类型   | 是否必填 | 描述                           |
|----------------|--------|----------|--------------------------------|
| identifyNos    | array  | 是       | 要取消的入库订单号列表（支持批量） |
| warehouseCode  | string | 是       | 仓库编码（用于权限校验）       |

### 成功响应

```json
{
  "code": "0",
  "msg": "success"
}
```

### 出库管理

### apiType: `ORDER_OUTBOUND_CREATE`

创建一个或多个出库计划订单

**请求体结构：**

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
      "specialInstructions": "轻拿轻放"
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
          "remark": "易碎"
        }
      }
    ]
  }
]
```

### 字段说明

#### 主订单字段

| 字段名              | 类型    | 是否必填 | 描述                           |
|---------------------|---------|----------|--------------------------------|
| warehouseCode       | string  | 是       | 仓库编码，最大长度 64          |
| customerWaveNo      | string  | 否       | 外部波次号                     |
| customerOrderNo     | string  | 是       | 客户订单号，最大长度 64        |
| customerOrderType   | string  | 否       | 出库订单类型                   |
| carrierCode         | string  | 否       | 承运商编码                     |
| waybillNo           | string  | 否       | 运单号                         |
| origPlatformCode    | string  | 否       | 原始平台编码                   |
| expiredTime         | long    | 否       | 截止时间（时间戳）             |
| priority            | integer | 否       | 优先级，值越高优先级越高       |
| shortOutbound       | boolean | 否       | 是否允许缺量出库，默认 false   |
| shortWaiting        | boolean | 否       | 是否允许等待补货，默认 false   |
| orderNo             | string  | 是       | 订单号，按系统规则生成         |
| destinations        | array   | 否       | 容器目的地列表                 |
| extendFields        | object  | 否       | 扩展字段（键值对格式）         |
| details             | array   | 是       | 出库计划订单明细列表           |

#### 明细字段

| 字段名          | 类型    | 是否必填 | 描述                     |
|-----------------|---------|----------|--------------------------|
| ownerCode       | string  | 是       | 货主编码，最大长度 64    |
| skuCode         | string  | 是       | SKU 编码，最大长度 64    |
| skuName         | string  | 否       | SKU 名称，最大长度 128   |
| batchAttributes | object  | 否       | 批次属性（键值对）       |
| qtyRequired     | integer | 是       | 需求出库数量（≥1）       |
| qtyAllocated    | integer | 否       | 预分配批次库存数量       |
| qtyActual       | integer | 否       | 实际出库数量             |
| extendFields    | object  | 否       | 扩展字段（键值对）       |

**成功响应：**

```json
{
  "code": "0",
  "msg": "success"
}
```

### apiType: `ORDER_OUTBOUND_CANCEL`

根据客户订单号取消出库计划订单

**请求体结构：**

```json
{
  "customerOrderNos": [
    "CUST-ORDER-001",
    "CUST-ORDER-002"
  ]
}
```

### 字段说明

| 字段名            | 类型  | 是否必填 | 描述                           |
|-------------------|--------|----------|--------------------------------|
| customerOrderNos  | array  | 是       | 要取消的客户订单号列表（支持批量） |

### 成功响应

```json
{
  "code": "0",
  "msg": "success"
}
```

## RCS -> WES

### 容器任务管理

### apiType: `CONTAINER_ARRIVE`

通知系统容器已到达工作站，以触发后续操作。

**请求体结构：**

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

### 字段说明

#### 主字段

| 字段名             | 类型   | 是否必填 | 描述                         |
|--------------------|--------|----------|------------------------------|
| workLocationCode   | string | 是       | 工作位置编码（如工作站、拣货位） |
| workLocationType   | enum   | 否       | 工作位置类型（见枚举）       |
| workStationId      | long   | 否       | 工作站 ID                    |
| warehouseAreaId    | long   | 否       | 库区 ID                      |
| containerDetails   | array  | 是       | 容器详情列表                 |

#### 容器详情字段

| 字段名              | 类型    | 是否必填 | 描述                           |
|---------------------|---------|----------|--------------------------------|
| containerCode       | string  | 是       | 容器编码（如周转箱、托盘）     |
| face                | string  | 否       | 容器面（如 KIVA 货架面 A/B/C/D） |
| robotCode           | string  | 否       | 机器人编码（如 AGV 编号）      |
| robotType           | string  | 否       | 机器人类型（如 KIVA、AGV、AMR） |
| level               | integer | 否       | 容器在货架中的层               |
| bay                 | integer | 否       | 容器在货架中的列               |
| locationCode        | string  | 是       | 容器当前位置编码（库位、工作站） |
| forwardFace         | string  | 否       | 容器朝向（A/B 表示周转箱朝向） |
| groupCode           | string  | 是       | 容器组编码（如波次、任务组）   |
| containerAttributes | object  | 否       | 容器扩展属性（重量、易碎、优先级等） |
| taskCodes           | array   | 否       | 与此容器关联的任务编码列表     |

#### 工作位置类型枚举（WorkLocationTypeEnum）

| 值             | 描述         |
|----------------|--------------|
| BUFFER_SHELVING | 缓冲上架工作站 |
| ROBOT          | 机器人       |
| CONVEYOR       | 输送线       |

**成功响应：**

```json
{
  "code": "0",
  "msg": "success"
}
```

### apiType: `CONTAINER_TASK_STATUS_UPDATE`

更新容器任务执行状态，供 WCS/RCS 等外部系统上报任务进度。

**请求体结构：**

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

### 字段说明

| 字段名        | 类型                    | 是否必填 | 描述                          |
|---------------|-------------------------|----------|-------------------------------|
| taskCode      | string                  | 是       | 任务编码，全局唯一            |
| taskStatus    | ContainerTaskStatusEnum | 是       | 当前任务状态，见下表          |
| robotCode     | string                  | 否       | 执行任务的机器人编码（AGV/KIVA 编号） |
| containerCode | string                  | 否       | 与任务绑定的容器编码（周转箱、托盘） |
| workStationId | long                    | 否       | 任务工作站或目标工作站 ID     |
| locationCode  | string                  | 否       | 任务或目标位置编码（库位、拣货位、月台等） |

#### 任务状态枚举（ContainerTaskStatusEnum）

| 值             | 描述   |
|----------------|--------|
| NEW            | 新建   |
| PROCESSING     | 进行中 |
| WCS_SUCCEEDED  | 已完成 |
| WCS_FAILED     | 失败   |

**成功响应：**

```json
{
  "code": "0",
  "msg": "success"
}
```

## ⚠️ 错误处理

### 常见错误码

| 状态码 | 描述         | 说明               |
|--------|--------------|--------------------|
| 200    | 成功         | 请求处理成功       |
| 400    | 请求错误     | 参数无效或请求体错误 |
| 401    | 未授权       | 认证失败或缺失     |
| 403    | 禁止访问     | 权限不足           |
| 404    | 未找到       | 资源不存在         |
| 429    | 请求过多     | 超过频率限制       |
| 500    | 服务器错误   | 服务端异常         |

### 错误响应示例

```json
{
  "code": "400",
  "msg": "请求参数无效"
}
```

## 📈 频率限制

API 对每个 token 实施频率限制：

- 每个 IP 每分钟最多 1000 次请求
- 每个 token 每小时最多 500000 次请求

当超出频率限制时，API 返回：

```json
{
  "success": false,
  "code": "429",
  "message": "频率超限，请 60 秒后重试",
  "requestId": "req-123456",
  "timestamp": "2024-02-11T10:30:00Z"
}
```
