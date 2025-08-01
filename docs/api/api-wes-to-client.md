---
id: api-wes-to-client
title: Api WES To Client
sidebar_position: 2
---

# WES → Client Event Notification API Documentation
**Version: v1.0**  
**Last Updated: 2025-08-01**

> This document describes how the WES actively calls your system to push real-time events such as inbound / outbound completions.  
> You must configure the callback URL and authentication method in the WES portal, and ensure your endpoint is idempotent.

---

## 🔐 Authentication
All requests carry the header configured in the WES portal.

---

## 📡 General Rules

| Item | Description |
|---|---|
| HTTP method | `POST` |
| Encoding | UTF-8 |
| Timeout | 10 s |
| Retry policy | 30 s → 1 min → 2 min → 5 min → 10 min, **max 5 attempts** |
| Idempotency key | `orderNo` (WES guarantees no duplication for the same order) |
| Success response | `{"code":"0","msg":"success"}` |
| Failure response | `{"code":"≠0","msg":"error description"}` |

---

## Unified Wrapper ``CallbackMessage``
Every callback is wrapped in:

```json
{
  "messageId": 1688201234567890,
  "data": { ... /* actual event payload */ }
}
```

| Field | Type | Description |
|---|---|---|
| messageId | long | Globally-unique ID (Snowflake), use for deduplication |
| data | T | The original business object |

Example (`STOCK_ABNORMAL_CALLBACK`):

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

---

## 🎯 Event List

| Event | Trigger | Event Code |
|---|---|---|
| Inbound Plan Completed | Receiving, QC & put-away all done | `INBOUND_PLAN_ORDER_COMPLETED` |
| Outbound Plan Completed | Picking finished | `OUTBOUND_PLAN_ORDER_COMPLETE` |
| Outbound Container Sealed | Picking & sealing done | `OUTBOUND_SEAL_CONTAINER` |
| Stock Abnormal Callback | Exception during picking / counting | `STOCK_ABNORMAL_CALLBACK` |
| Stock Adjustment Callback | Stock adjustment confirmed | `STOCK_ADJUSTMENT_CALLBACK` |
| PTL Control | Light / display instruction | `PTL_CONTROL` |
| Container Task Created | Put-away, picking, counting, etc. | `CONTAINER_TASK_CREATE` |
| Container Task Cancelled | Task revoked | `CONTAINER_TASK_CANCEL` |
| Container Leave | Task done, container departs | `CONTAINER_LEAVE` |
| Call Robot | Summon AGV / AMR | `CALL_ROBOT` |

---

### INBOUND_PLAN_ORDER_COMPLETED

**Request Example**

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

#### Fields

| Field | Type | Description |
|---|---|---|
| orderNo | string | WES internal order number |
| customerOrderNo | string | Original customer PO number |
| warehouseCode | string | Warehouse code |
| customerOrderType | string | `PURCHASE`, `RETURN`, or `TRANSFER` |
| storageType | string | `storage`, `overstock`, `in_transit` |
| lpnCode | string | LPN code |
| skuKindNum | integer | Number of SKU kinds |
| totalQty | integer | Total qty received |
| totalBox | integer | Total boxes received |
| inboundPlanOrderStatus | enum | Always `COMPLETED` |
| details | array | Inbound details |
| extendFields | object | Extension map |

##### details

| Field | Type | Description |
|---|---|---|
| ownerCode | string | Owner code |
| skuCode | string | SKU code |
| qtyRestocked | integer | Actual received qty |
| boxNo | string | Box number |
| batchAttributes | object | Batch attributes |

---

### OUTBOUND_PLAN_ORDER_COMPLETE

**Request Example**

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

#### Fields

| Field | Type | Description |
|---|---|---|
| orderNo | string | WES internal order number |
| customerOrderNo | string | Original customer SO number |
| warehouseCode | string | Warehouse code |
| customerOrderType | string | `SALES`, etc. |
| carrierCode | string | Carrier code |
| waybillNo | string | Tracking number |
| skuKindNum | integer | Number of SKU kinds |
| totalQty | integer | Total qty shipped |
| priority | integer | Priority |
| shortOutbound | boolean | Whether shortage was allowed |
| outboundPlanOrderStatus | enum | Always `COMPLETED` |
| destinations | array | Dock / store list |
| details | array | Outbound details |
| extendFields | object | Extension map |

##### details

| Field | Type | Description |
|---|---|---|
| ownerCode | string | Owner code |
| skuCode | string | SKU code |
| qtyActual | integer | Shipped qty |
| batchAttributes | object | Batch attributes |

---

### OUTBOUND_SEAL_CONTAINER

**Trigger**  
Pushed when an outbound tote/container has been sealed after picking.

**Request Example**

```json
{
  "warehouseCode": "WH-EAST-01",
  "transferContainerCode": "TC-20230801001",
  "containerSealedDetailDTOS": [
    {
      "warehouseAreaId": 1001,
      "workStationId": 2001,
      "operator": "Zhang San",
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

#### Fields

##### ContainerSealedDTO

| Field | Type | Description |
|---|---|---|
| warehouseCode | string | Warehouse code |
| transferContainerCode | string | Sealed container/tote code |
| containerSealedDetailDTOS | array | List of sealed details |

##### ContainerSealedDetailDTO

| Field | Type          | Description |
|---|---------------|---|
| warehouseAreaId | long          | Zone ID |
| workStationId | long          | Work-station ID |
| operator | string        | Sealer name |
| putWallSlotCode | string        | Put-wall slot code |
| destinations | set\<string\> | Dock / store list |
| ownerCode | string        | Owner code |
| waveNo | string        | Wave number |
| customerOrderNo | string        | Customer SO number |
| customerOrderType | string        | Order type |
| carrierCode | string        | Carrier code |
| waybillNo | string        | Tracking number |
| origPlatformCode | string        | Original platform code |
| expiredTime | long          | Cut-off timestamp |
| priority | integer       | Priority |
| orderNo | string        | WES internal order number |
| extendFields | object        | Extension map |
| skuCode | string        | SKU code |
| skuName | string        | SKU name |
| batchAttributes | object        | Batch attributes |
| qtyRequired | integer       | Planned qty |
| qtyActual | integer       | Actual qty |

---

### STOCK_ABNORMAL_CALLBACK

**Trigger**  
Pushed immediately when WES detects any stock anomaly (shortage, overage, damage, wrong batch, etc.) during picking, counting, or relocation.

**Request Example**

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
  "reasonDesc": "Short 5 pcs when picking",
  "abnormalOrderNo": "CHK-20230801001"
}]
```

#### Fields

| Field | Type | Description |
|---|---|---|
| warehouseCode | string | Warehouse code |
| ownerCode | string | Owner code |
| orderNo | string | Related order (inbound/outbound/counting) |
| stockAbnormalType | enum | See `StockAbnormalTypeEnum` |
| replayNo | string | Recount number (for deduplication) |
| containerStockId | long | Internal container-stock ID |
| skuBatchStockId | long | Internal SKU-batch-stock ID |
| skuBatchAttributeId | long | Internal batch-attribute ID |
| skuId | long | Internal SKU ID |
| skuCode | string | Public SKU code |
| containerCode | string | Container code |
| containerSlotCode | string | Container slot code |
| locationCode | string | Location code |
| qtyAbnormal | integer | Negative = shortage, positive = overage |
| abnormalReason | string | Reason code, see table |
| reasonDesc | string | Human-readable reason |
| abnormalOrderNo | string | Work order that raised the anomaly |

#### Enums

##### StockAbnormalTypeEnum
| Value | Meaning |
|---|---|
| PICKING | Picking anomaly |
| STOCK_TAKE | Counting anomaly |
| TOTE_RELOCATION | Relocation anomaly |

##### Common abnormalReason Codes
| Code | Meaning |
|---|---|
| SHORTAGE | Shortage |
| OVERAGE | Overage |
| DAMAGED_IN_HANDLING | Damaged during handling |
| EXPIRED_ON_SHELF | Expired in warehouse |

---

### STOCK_ADJUSTMENT_CALLBACK

**Trigger**  
Pushed after WES has generated and confirmed a stock-adjustment order, synchronizing the final adjusted qty and reason.

**Request Example**

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

#### Fields

| Field | Type | Description |
|---|---|---|
| id | long | Unique adjustment detail ID |
| stockAdjustmentOrderId | long | Adjustment order ID |
| stockAbnormalRecordId | long | Related anomaly record ID (nullable) |
| warehouseCode | string | Warehouse code |
| ownerCode | string | Owner code |
| containerCode | string | Container code |
| containerSlotCode | string | Container slot code |
| containerStockId | long | Internal container-stock ID |
| skuBatchStockId | long | Internal SKU-batch-stock ID |
| skuBatchAttributeId | long | Internal batch-attribute ID |
| skuId | long | Internal SKU ID |
| skuCode | string | Public SKU code |
| qtyAdjustment | integer | Delta after vs before (negative = decrease) |
| abnormalReason | enum | Adjustment reason |

---

### PTL_CONTROL

**Trigger**  
Sent in real-time when WES needs to control Pick-to-Light devices (lights, digits, or displays).  
This is a **live command**; no retry queue. PTL gateway should cache or resync after reconnect.

**Request Example**

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

#### Fields

| Field | Type | Description |
|---|---|---|
| workStationId | string | Work-station ID |
| tagCode | string | Light tag / slot code |
| color | enum | See `PtlColorEnum` |
| mode | enum | See `PtlModeEnum` |
| updown | enum | See `PtlUpdownEnum` |
| number | integer | 0-9999 for 7-segment display |
| displayText | string | Additional text (≤ 8 bytes) |

#### PTL Enums

##### PtlColorEnum
| Value | Meaning |
|---|---|
| RED | Red |
| GREEN | Green |
| BLUE | Blue |
| YELLOW | Yellow |
| WHITE | White |

##### PtlModeEnum
| Value | Meaning |
|---|---|
| ON | Steady |
| OFF | Off |
| FLASH | Flashing |

##### PtlUpdownEnum
| Value | Meaning |
|---|---|
| UNTAPABLE | Cannot be turned off by tapping |
| TAPABLE | Can be turned off by tapping |

---

### CONTAINER_TASK_CREATE

**Trigger**  
Pushed when WES needs a robot (AGV/AMR/KIVA) to move a container for put-away, picking, empty-return, replenishment, etc.

**Request Example**

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

#### Fields

| Field | Type | Description |
|---|---|---|
| taskCode | string | **Container task code**, globally unique |
| taskGroupCode | string | Group / wave code |
| businessTaskType | enum | See `BusinessTaskTypeEnum` |
| containerTaskType | enum | See `ContainerTaskTypeEnum` |
| taskPriority | integer | Higher = more urgent |
| taskGroupPriority | integer | Group priority |
| containerCode | string | Container code |
| containerFace | string | Face A/B/C/D (KIVA) |
| startLocation | string | From location |
| containerSpecCode | string | Container spec (e.g. STD-40L) |
| destinations | `array<string>` | Target locations (multi-hop allowed) |
| customerTaskIds | `array<long>` | Related customer task IDs |
| parentContainerTaskId | long | Parent task ID (nullable) |
| nextContainerTasks | `array<ContainerTask>` | Child tasks (nullable) |

#### Enums

##### BusinessTaskTypeEnum
| Value | Meaning |
|---|---|
| PUT_AWAY | Put-away |
| PICKING | Picking |
| EMPTY_CONTAINER_OUTBOUND | Empty container outbound |
| EMPTY_CONTAINER_INBOUND | Empty container inbound |

##### ContainerTaskTypeEnum
| Value | Meaning |
|---|---|
| TRANSPORT | Transport |
| INBOUND | Inbound |
| OUTBOUND | Outbound |

**Success Response**

RCS must return:

```json
{ "code": "0", "msg": "accepted", "taskCode": "CT-20230801001" }
```

- `taskCode` must match the request for idempotency.

---

### CONTAINER_TASK_CANCEL

**Trigger**  
Pushed when WES cancels a container task that has not yet started.  
RCS should mark the task `CANCELLED` and stop scheduling.  
If execution has already begun, RCS decides whether to continue or roll back.

**Request Example**

```json
["CT-20230801001","CT-20230801002"]
```

#### Fields

| Field | Type | Description |
|---|---|---|
| taskCode | string | Container task code to cancel |

**Success Response**

RCS must return:

```json
{ "code": "0", "msg": "cancelled", "taskCode": "CT-20230801001" }
```

---

### CONTAINER_LEAVE

**Trigger**  
Pushed when a container physically leaves a workstation / zone after task completion or scheduling needs, to sync state and free resources.

**Request Example**

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

#### Fields

| Field | Type | Description |
|---|---|---|
| workStationId | long | Current workstation ID |
| groupCode | string | Wave or group code |
| containerOperationDetails | array | Leave details |

##### ContainerOperationDetail

| Field | Type | Description |
|---|---|---|
| containerCode | string | Container code |
| containerFace | string | Face A/B/C/D |
| locationCode | string | Actual location when leaving |
| taskCode | string | Related task code |
| operationType | enum | Operation type |

##### ContainerOperationTypeEnum
| Value | Meaning |
|---|---|
| LEAVE | Container leaves |
| MOVE_OUT | Container taken out |
| ABNORMAL | Sent to exception lane |

**Success Response**

```json
{ "code": "0", "msg": "received" }
```

---

### CALL_ROBOT

**Trigger**  
Sent when a workstation needs a robot to arrive for the next step.  
This is a **live command**; RCS should immediately dispatch the nearest idle robot.

**Request Example**

```json
{
  2001
}
```

#### Fields

| Field | Type | Description |
|---|---|---|
| workStationId | long | **Target workstation ID** (RCS maps to physical coordinates) |

**Success Response**

RCS must return:

```json
{ "code": "0", "msg": "robot dispatched"}
```

---

## 🔄 Error Codes

| code | Meaning | Advice |
|---|---|---|
| 0 | Success | - |
| 40001 | Signature error | Check secret & algorithm |
| 40002 | Duplicate / idempotent | Return success directly |
| 50000 | Internal error | Retry later |

---

## 📞 Support

- Tech mail: support@openwes.com
- Online docs: https://docs.openwes.top/docs/api/api-wes-to-client
