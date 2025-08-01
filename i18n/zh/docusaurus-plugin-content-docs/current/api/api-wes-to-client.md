---
id: api-wes-to-client
title: Api WES To Client
sidebar_position: 2
---

# WES → Client 事件通知 API 文档
**版本：v1.0**  
**最后更新：2025-08-01**  

> 本文档由 WES 主动调用客户系统，用于实时同步入库/出库等关键事件。  
> 客户需在 WES 接口平台中配置对应接口的地址，与验证方式，并保证接口幂等。

---

## 🔐 鉴权方式
所有请求头默认携带：

```http
允许客户在接口平台配置
```

---

## 📡 通用规范

| 项            | 说明 |
|---------------|------|
| HTTP 方法      | `POST` |
| 字符编码       | UTF-8 |
| 超时时间       | 10 s |
| 重试策略       | 30 s → 1 min → 2 min → 5 min → 10 min，共 **5 次** |
| 幂等键         | `orderNo`（WES 保证同一订单事件不重复） |
| 成功响应       | `{"code":"0","msg":"success"}` |
| 失败响应       | `{"code":"≠0","msg":"错误描述"}` |

---

## 🎯 事件列表

| 事件类型 | 触发时机         | 对应事件编码                        |
|----------|--------------|-------------------------------|
| 入库计划单完成 | 收货、质检、上架全部完成 | `INBOUND_PLAN_ORDER_COMPLETED` |
| 出库计划单完成 | 拣选全部完成       | `OUTBOUND_PLAN_ORDER_COMPLETE` |
| 出库封箱 | 拣选封箱         | `OUTBOUND_SEAL_CONTAINER` |
| 库存异常回调 | 拣选盘点发生异常     | `STOCK_ABNORMAL_CALLBACK` |
| 库存调整回调 | 确定完成库存调整     | `STOCK_ADJUSTMENT_CALLBACK` |
| 电子标签控制 | 拣选，封箱        | `PTL_CONTROL` |
| 容器任务创建 | 上架，出库，盘点     | `CONTAINER_TASK_CREATE` |
| 容器任务取消 | 容器任务取消       | `CONTAINER_TASK_CANCEL` |
| 容器离开 | 任务完成，需要离开    | `CONTAINER_LEAVE` |
| 呼叫机器人 | 上架等          | `CALL_ROBOT` |


---

以下内容追加到《WES → Client 事件通知 API 文档》顶部「📡 通用规范」小节，说明 **统一包装类** 的使用方式，并给出示例。

---

## 📦 统一包装类 `CallbackMessage<T>`

所有 WES → Client 的回调事件，**均被包装在 `CallbackMessage<T>` 中** 发送，结构如下：

```json
{
  "messageId": 1688201234567890,
  "data": { ... /* 具体事件数据 */ }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| messageId | long | 全局唯一消息 ID，采用雪花算法生成，可用于去重 |
| data | T | 对应事件的原始业务实体 |

### 示例（以 STOCK_ABNORMAL_CALLBACK 为例）

```json
{
  "messageId": 1688201234567890,
  "data": {
    "warehouseCode": "WH-EAST-01",
    "ownerCode": "ACME_CORP",
    "orderNo": "OUT-20230801001",
    "stockAbnormalType": "LOST",
    "qtyAbnormal": -5,
    "abnormalReason": "SHORTAGE",
    "...": "..."
  }
}
```

> 接收方应优先针对 `messageId` 做幂等校验，再解析 `data` 进行业务处理。

## INBOUND_PLAN_ORDER_COMPLETED

### 请求示例

```json
{
  "orderNo": "INB-20230801001",
  "customerOrderNo": "CUST-PO-20230731-001",
  "warehouseCode": "WH-EAST-01",
  "customerOrderType": "PURCHASE",
  "storageType": "storage",
  "lpnCode": "LPN123456",
  "skuKindNum": 3,
  "totalQty": 120,
  "totalBox": 5,
  "inboundPlanOrderStatus": "COMPLETED",
  "details": [
    {
      "ownerCode": "ACME_CORP",
      "skuCode": "SKU-2023-001",
      "qtyRestocked": 50,
      "boxNo": "BOX-001",
      "batchAttributes": {
        "batchNo": "BATCH20230801",
        "productionDate": "2023-07-20"
      }
    }
  ],
  "extendFields": {
    "completionTime": 1690848000000,
    "operator": "SYSTEM"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| orderNo | string | WES 内部订单号 |
| customerOrderNo | string | 客户原始入库订单号 |
| warehouseCode | string | 完成上架的仓库编码 |
| customerOrderType | string | 入库类型（PURCHASE/RETURN/TRANSFER） |
| storageType | string | 存储类型（storage/overstock/in_transit） |
| lpnCode | string | 关联 LPN |
| skuKindNum | integer | SKU 种类数 |
| totalQty | integer | 实际上架总件数 |
| totalBox | integer | 实际上架总箱数 |
| inboundPlanOrderStatus | enum | 固定 `COMPLETED` |
| details | array | 入库明细 |
| extendFields | object | 扩展字段 |

#### details 明细字段

| 字段 | 类型 | 说明 |
|---|---|---|
| ownerCode | string | 货主编码 |
| skuCode | string | 商品编码 |
| qtyRestocked | integer | 实际入库数量 |
| boxNo | string | 箱号 |
| batchAttributes | object | 批次属性 |

---

## OUTBOUND_PLAN_ORDER_COMPLETE

### 请求示例

```json
{
  "orderNo": "OUT-20230801001",
  "customerOrderNo": "CUST-SO-20230731-001",
  "warehouseCode": "WH-EAST-01",
  "customerOrderType": "SALES",
  "carrierCode": "SF-EXPRESS",
  "waybillNo": "SF1234567890",
  "skuKindNum": 2,
  "totalQty": 80,
  "priority": 100,
  "shortOutbound": false,
  "outboundPlanOrderStatus": "COMPLETED",
  "destinations": ["DOCK-A1"],
  "details": [
    {
      "ownerCode": "ACME_CORP",
      "skuCode": "SKU-2023-001",
      "skuName": "Premium Laptop",
      "qtyRequired": 50,
      "qtyActual": 50,
      "batchAttributes": {
        "batchNo": "BATCH20230801"
      }
    }
  ],
  "extendFields": {
    "completionTime": 1690848000000,
    "shippedTime": 1690851600000,
    "operator": "SYSTEM"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| orderNo | string | WES 内部订单号 |
| customerOrderNo | string | 客户原始入库订单号 |
| warehouseCode | string | 完成上架的仓库编码 |
| customerOrderType | string | 入库类型（PURCHASE/RETURN/TRANSFER） |
| storageType | string | 存储类型（storage/overstock/in_transit） |
| lpnCode | string | 关联 LPN |
| skuKindNum | integer | SKU 种类数 |
| totalQty | integer | 实际上架总件数 |
| totalBox | integer | 实际上架总箱数 |
| inboundPlanOrderStatus | enum | 固定 `COMPLETED` |
| details | array | 入库明细 |
| extendFields | object | 扩展字段 |

#### details 明细字段

| 字段 | 类型 | 说明 |
|---|---|---|
| ownerCode | string | 货主编码 |
| skuCode | string | 商品编码 |
| qtyActual | integer | 实际发运数量 |
| batchAttributes | object | 批次属性 |

---

以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与现有章节格式一致。

---

### OUTBOUND_SEAL_CONTAINER

**触发时机**  
当出库周转箱在 WES 内完成拣选封箱后向上游系统推送 **“出库封箱完成”** 事件。

### 请求示例

```json
{
  "warehouseCode": "WH-EAST-01",
  "transferContainerCode": "TC-20230801001",
  "containerSealedDetailDTOS": [
    {
      "warehouseAreaId": 1001,
      "workStationId": 2001,
      "operator": "张三",
      "putWallSlotCode": "A01-S01",
      "destinations": ["DOCK-A1", "DOCK-A2"],
      "ownerCode": "ACME_CORP",
      "waveNo": "W-20230801001",
      "customerOrderNo": "CUST-SO-20230731-001",
      "customerOrderType": "SALES",
      "carrierCode": "SF-EXPRESS",
      "waybillNo": "SF1234567890",
      "origPlatformCode": "TMALL",
      "expiredTime": 1690848000000,
      "priority": 100,
      "orderNo": "OUT-20230801001",
      "extendFields": {
        "sealTime": 1690848000000,
        "sealNo": "SEAL-001"
      },
      "skuCode": "SKU-2023-001",
      "skuName": "Premium Laptop",
      "batchAttributes": {
        "batchNo": "BATCH20230801"
      },
      "qtyRequired": 10,
      "qtyActual": 10
    }
  ]
}
```

### 字段说明

#### 主字段 (ContainerSealedDTO)

| 字段 | 类型 | 说明 |
|---|---|---|
| warehouseCode | string | 仓库编码 |
| transferContainerCode | string | 周转箱编号（封箱后的箱号） |
| containerSealedDetailDTOS | array | 封箱明细列表 |

#### 明细字段 (ContainerSealedDetailDTO)

| 字段 | 类型 | 说明 |
|---|---|---|
| warehouseAreaId | long | 库区 ID |
| workStationId | long | 工作站编号 |
| operator | string | 封箱操作员 |
| putWallSlotCode | string | 播种墙格口号 |
| destinations | set\<string\> | 目的地集合（月台/门店/线路） |
| ownerCode | string | 货主编码 |
| waveNo | string | 波次号 |
| customerOrderNo | string | 客户订单号 |
| customerOrderType | string | 出库单类型 |
| carrierCode | string | 承运商编码 |
| waybillNo | string | 运单号 |
| origPlatformCode | string | 原始平台编码 |
| expiredTime | long | 截单时间（时间戳） |
| priority | integer | 优先级 |
| orderNo | string | WES 内部订单号 |
| extendFields | object | 扩展字段（可放封箱时间、封签号等） |
| skuCode | string | 商品编码 |
| skuName | string | 商品名称 |
| batchAttributes | object | 批次属性 |
| qtyRequired | integer | 计划出库数量 |
| qtyActual | integer | 实际出库数量 |

### 成功响应

```json
{ "code": "0", "msg": "success" }
```
以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### STOCK_ABNORMAL_CALLBACK

**触发时机**  
当 WES 在库内作业（拣选、盘点、移库等）过程中检测到库存差异、批次不符、货损等异常时，立即向上游系统推送 **“库存异常回调”** 事件。


### 请求示例

```json
[{
  "warehouseCode": "WH-EAST-01",
  "ownerCode": "ACME_CORP",
  "orderNo": "OUT-20230801001",
  "stockAbnormalType": "LOST",
  "replayNo": "RP-20230801001",
  "containerStockId": 10001,
  "skuBatchStockId": 20001,
  "skuBatchAttributeId": 30001,
  "skuId": 40001,
  "skuCode": "SKU-2023-001",
  "containerCode": "C-20230801001",
  "containerSlotCode": "A-01",
  "locationCode": "LOC-A-01-01",
  "qtyAbnormal": -5,
  "abnormalReason": "SHORTAGE",
  "reasonDesc": "拣选时发现实物短缺 5 件",
  "abnormalOrderNo": "CHK-20230801001"
}]
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| warehouseCode | string | 仓库编码 |
| ownerCode | string | 货主编码 |
| orderNo | string | 关联订单号（出库/入库/盘点单） |
| stockAbnormalType | enum | 异常类型，见下表 |
| replayNo | string | 复盘编号（多次复盘时用于去重） |
| containerStockId | long | 容器库存 ID（WES 内部） |
| skuBatchStockId | long | SKU 批次库存 ID（WES 内部） |
| skuBatchAttributeId | long | 批次属性 ID（WES 内部） |
| skuId | long | SKU ID（WES 内部） |
| skuCode | string | 商品编码（对外） |
| containerCode | string | 容器编号 |
| containerSlotCode | string | 容器格口编号 |
| locationCode | string | 库位编码 |
| qtyAbnormal | integer | 异常数量（负值表示短缺，正值表示盈余） |
| abnormalReason | string | 异常原因代码，见下表 |
| reasonDesc | string | 异常原因描述 |
| abnormalOrderNo | string | 产生异常的作业单号（盘点单/拣选单等） |

### 枚举值

#### StockAbnormalTypeEnum
| 值 | 说明 |
|---|---|
| PICKING | 拣货异常 |
| STOCK_TAKE | 盘点异常 |
| TOTE_RELOCATION | 理库异常 |


#### 常见 abnormalReason 代码
| 代码 | 说明 |
|---|---|
| SHORTAGE | 短缺 |
| OVERAGE | 多余 |
| DAMAGED_IN_HANDLING | 操作破损 |
| EXPIRED_ON_SHELF | 库内过期 |

### 成功响应

```json
{ "code": "0", "msg": "success" }
```
以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### STOCK_ADJUSTMENT_CALLBACK

**触发时机**  
当 WES 生成调整单并确定之后，向上游系统推送 **“库存调整回调”** 事件，用于同步最新库存数量及调整原因。


### 请求示例

```json
[
  {
    "id": 90001,
    "stockAdjustmentOrderId": 70001,
    "stockAbnormalRecordId": 80001,
    "warehouseCode": "WH-EAST-01",
    "ownerCode": "ACME_CORP",
    "containerCode": "C-20230801001",
    "containerSlotCode": "A-01",
    "containerStockId": 10001,
    "skuBatchStockId": 20001,
    "skuBatchAttributeId": 30001,
    "skuId": 40001,
    "skuCode": "SKU-2023-001",
    "qtyAdjustment": -3,
    "abnormalReason": "LOST"
  }
]
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| id | long | 调整明细唯一 ID |
| stockAdjustmentOrderId | long | 库存调整单 ID |
| stockAbnormalRecordId | long | 关联异常记录 ID（若无异常可空） |
| warehouseCode | string | 仓库编码 |
| ownerCode | string | 货主编码 |
| containerCode | string | 容器编号 |
| containerSlotCode | string | 容器格口编号 |
| containerStockId | long | 容器库存 ID（WES 内部） |
| skuBatchStockId | long | SKU 批次库存 ID（WES 内部） |
| skuBatchAttributeId | long | 批次属性 ID（WES 内部） |
| skuId | long | SKU ID（WES 内部） |
| skuCode | string | 商品编码 |
| qtyAdjustment | integer | **调整后** 与 **调整前** 的差值（负值表示减少，正值表示增加） |
| abnormalReason | enum | 调整原因代码，见 `StockAbnormalReasonEnum` |


### 成功响应

```json
{ "code": "0", "msg": "success" }
```

以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### PTL_CONTROL

**触发时机**  
当 WES 需要控制 PTL（Pick-to-Light）灯光、数码管或显示屏时，向 PTL 设备网关推送指令。  
该事件为 **实时指令**，不进入重试队列；若推送失败，由 PTL 网关自行缓存或重连后同步。


### 请求示例

```json
{
    "workStationId": "WS-001",
    "tagCode": "A01-S01",
    "color": "GREEN",
    "mode": "FLASH",
    "updown": "UP",
    "number": 5,
    "displayText": "5"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| workStationId | string | 工作站编号 |
| tagCode | string | PTL 标签（灯位）编号 |
| color | enum | 灯光颜色，见 `PtlColorEnum` |
| mode | enum | 显示模式，见 `PtlModeEnum` |
| updown | enum | 灯/屏状态，见 `PtlUpdownEnum` |
| number | integer | 数码管数值（0-9999，默认为 0） |
| displayText | string | 额外文本（8 字节以内） |

### PTL 枚举值

#### PtlColorEnum
| 值 | 说明 |
|---|---|
| RED | 红色 |
| GREEN | 绿色 |
| BLUE | 蓝色 |
| YELLOW | 黄色 |
| WHITE | 白色 |

#### PtlModeEnum
| 值 | 说明 |
|---|---|
| ON | 常亮 |
| OFF | 常灭 |
| FLASH | 闪烁 |

#### PtlUpdownEnum
| 值 | 说明 |
|---|---|
| UNTAPABLE | 不允许拍灭 |
| TAPABLE | 允许拍灭 |


以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### CONTAINER_TASK_CREATE

**触发时机**  
当 WES 需要机器人搬运容器（入库、拣选、空箱回库、补货等）时，向 RCS/AGV 系统推送 **“容器任务创建”** 事件。

### 请求示例

```json
[
  {
    "taskCode": "CT-20230801001",
    "taskGroupCode": "TG-20230801001",
    "businessTaskType": "OUTBOUND_PICKING",
    "containerTaskType": "TRANSPORT",
    "taskPriority": 100,
    "taskGroupPriority": 90,
    "containerCode": "C-20230801001",
    "containerFace": "A",
    "startLocation": "LOC-A-01-01",
    "containerSpecCode": "STD-40L",
    "destinations": ["WS-001-A", "WS-001-B"],
    "customerTaskIds": [10001, 10002],
    "parentContainerTaskId": null,
    "nextContainerTasks": []
  }
]
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| taskCode | string | **容器任务编号**，全局唯一，由 WES 生成 |
| taskGroupCode | string | 任务组编号（波次、合单等场景） |
| businessTaskType | enum | 业务任务类型，见 `BusinessTaskTypeEnum` |
| containerTaskType | enum | 容器任务类型，见 `ContainerTaskTypeEnum` |
| taskPriority | integer | 任务优先级（数值越大越优先） |
| taskGroupPriority | integer | 任务组优先级 |
| containerCode | string | 容器编号 |
| containerFace | string | 容器朝向（A/B/C/D，KIVA 场景） |
| startLocation | string | 起点库位 |
| containerSpecCode | string | 容器规格代码（如 STD-40L） |
| destinations | array\<string\> | 目标位置列表（支持多段搬运） |
| customerTaskIds | array\<long\> | 关联的客户业务任务 ID |
| parentContainerTaskId | long | 父任务 ID（空表示无依赖） |
| nextContainerTasks | array\<ContainerTask\> | 后续子任务（可空） |

### 枚举值

#### BusinessTaskTypeEnum
| 值 | 说明   |
|---|------|
| PUT_AWAY | 入库上架 |
| PICKING | 出库拣选 |
| EMPTY_CONTAINER_OUTBOUND | 空箱出库 |
| EMPTY_CONTAINER_INBOUND | 空箱入库 |

#### ContainerTaskTypeEnum
| 值 | 说明 |
|---|---|
| TRANSPORT | 搬运 |
| INBOUND | 入库 |
| OUTBOUND | 出库 |

### 成功响应

RCS 需返回：

```json
{ "code": "0", "msg": "accepted", "taskCode": "CT-20230801001" }
```

- `taskCode` 必须与请求一致，便于 WES 幂等校验。
- 若返回非 0，WES 视为失败，可人工干预或根据业务决定是否重试。

以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### CONTAINER_TASK_CANCEL

**触发时机**  
当 WES 需要取消已下发但尚未被 RCS 开始执行的容器任务时，向 RCS 推送 **“容器任务取消”** 事件。  
RCS 收到后应立即将对应任务标记为 `CANCELLED` 并停止调度；若任务已开始执行，则由 RCS 自行决定是否继续或回退。

### 请求示例

```json
["CT-20230801001","CT-20230801002"]
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| taskCode | string | 需要取消的容器任务编号（与创建时的 taskCode 一致） |

### 成功响应

RCS 需返回：

```json
{ "code": "0", "msg": "cancelled", "taskCode": "CT-20230801001" }
```

- 若任务不存在或已结束，RCS 应返回 `code=0` 并附带提示，避免重试。

以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### CONTAINER_LEAVE

**触发时机**  
当容器（料箱/托盘）因任务完成、调度需求而 **真正离开工作站/库区** 时，WES 向 RCS/WCS 推送 **“容器离开”** 事件，用于同步现场状态、释放资源或触发下一步搬运。


### 请求示例

```json
{
  "workStationId": 2001,
  "groupCode": "GRP-20230801001",
  "containerOperationDetails": [
    {
      "containerCode": "C-20230801001",
      "containerFace": "A",
      "locationCode": "WS-001-OUT",
      "taskCode": "CT-20230801001",
      "operationType": "LEAVE"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| workStationId | long | 容器当前所在工作站 ID |
| groupCode | string | 任务组编码（波次或合单号） |
| containerOperationDetails | array | 离开事件明细列表 |

#### ContainerOperationDetail 明细字段

| 字段 | 类型 | 说明 |
|---|---|---|
| containerCode | string | 容器编号 |
| containerFace | string | 容器朝向（A/B/C/D） |
| locationCode | string | 离开时的实际位置 |
| taskCode | string | 关联容器任务编号 |
| operationType | enum | 操作类型 |

#### ContainerOperationTypeEnum
| 值 | 说明   |
|---|------|
| LEAVE | 容器离开 |
| MOVE_OUT | 容器取出 |
| ABNORMAL | 去异常口 |

### 成功响应

```json
{ "code": "0", "msg": "received" }
```

- 若 WCS/RCS 无需处理，可直接返回 `code=0` 完成确认。

以下内容追加到《WES → Client 事件通知 API 文档》的「🎯 事件列表」小节，保持与前文一致的格式。

---

### CALL_ROBOT

**触发时机**  
当工作站需要机器人（AGV/AMR/KIVA 等）到达指定工位以执行后续搬运任务时，WES 向 RCS 推送 **“呼叫机器人”** 事件。  
该事件为 **实时指令**，RCS 收到后应立即调度最近的空闲机器人前往目标工作站。

### 请求示例

```json
{
  2001
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| workStationId | long | **目标工作站 ID**（RCS 根据该 ID 匹配对应物理坐标） |

### 成功响应

RCS 收到后须返回：

```json
{ "code": "0", "msg": "robot dispatched"}
```

- 若现场无可用机器人或工作站不存在，返回非 0 错误码并附带提示。

## 🔄 错误码

| code | 含义 | 建议 |
|---|---|---|
| 0 | 成功 | - |
| 40001 | 签名错误 | 检查 secret 与算法 |
| 40002 | 幂等重复 | 直接返回成功 |
| 50000 | 内部错误 | 稍后重试 |

---

## 📞 支持

- 技术邮箱：support@openwes.com
- 在线文档：[https://docs.openwes.top/docs/api/api-wes-to-client](https://docs.openwes.top/docs/api/api-wes-to-client)
```
