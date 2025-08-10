---
id: user-guide
title: User Guide
sidebar_position: 5
---

# OpenWES User Guide

Complete guide for warehouse operators, managers, and administrators using OpenWES in daily operations.

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Daily Operations](#daily-operations) 
- [Inbound Operations](#inbound-operations)
- [Outbound Operations](#outbound-operations)
- [Inventory Management](#inventory-management)
- [Station Operations](#station-operations)
- [Reporting & Analytics](#reporting--analytics)
- [System Administration](#system-administration)

## Getting Started

### User Roles & Permissions

OpenWES uses role-based access control (RBAC) with the following main roles:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Warehouse Operator** | Station operations, task execution | Daily warehouse work |
| **Warehouse Supervisor** | Operations + monitoring, reports | Shift management |
| **Warehouse Manager** | Full warehouse operations | Overall warehouse management |
| **System Administrator** | System configuration, user management | Technical administration |

### Dashboard Overview

The main dashboard provides real-time insights:

- **Order Status**: Inbound/outbound order progress
- **Inventory Levels**: Current stock levels by SKU/owner
- **Task Queue**: Pending tasks by priority
- **Performance Metrics**: Throughput, accuracy, efficiency
- **System Health**: Service status and alerts

### Navigation Menu

```
├── Dashboard
├── Inbound
│   ├── Orders
│   ├── Receiving
│   └── Putaway
├── Outbound  
│   ├── Orders
│   ├── Picking
│   └── Packing
├── Inventory
│   ├── Stock Levels
│   ├── Locations
│   └── Movements
├── Tasks
│   ├── Active Tasks
│   ├── Completed
│   └── Queue
├── Reports
│   ├── Performance
│   ├── Inventory
│   └── Operations
└── Settings
    ├── Users
    ├── Configuration
    └── System
```

## Daily Operations

### Starting Your Shift

1. **Login** with your credentials
2. **Select Warehouse** (if multi-warehouse setup)
3. **Review Dashboard** for overnight changes
4. **Check Task Queue** for priority items
5. **Verify Equipment** status (scanners, printers)

### Common Tasks

#### Task Management
- **View Tasks**: Navigate to Tasks > Active Tasks
- **Filter Tasks**: By priority, type, or assignment
- **Accept Task**: Click "Accept" to start working
- **Complete Task**: Follow on-screen instructions and confirm

#### Quick Actions
- **Emergency Stop**: Red button for safety issues
- **System Status**: Check health indicators
- **Support**: Help button for assistance

## Inbound Operations

### Processing Inbound Orders

#### 1. Order Creation
```
Inbound > Orders > Create New Order
```

**Required Fields:**
- Customer Order Number
- Warehouse Code  
- Estimated Arrival Date
- Owner/Supplier Code
- Order Details (SKU, Quantity, Box info)

#### 2. Receiving Process

**Steps:**
1. **Scan ASN/Order** to begin receiving
2. **Verify Items** against expected quantities
3. **Record Discrepancies** if quantities don't match
4. **Quality Check** (if configured)
5. **Generate LPN** for received items
6. **Confirm Receipt** to complete

**Screen Flow:**
```
Order List → Select Order → Begin Receiving → 
Item Verification → Quality Check → LPN Generation → 
Completion Confirmation
```

#### 3. Putaway Operations

**Process:**
1. **Scan LPN** to start putaway
2. **System Suggests Location** based on rules
3. **Navigate to Location** using provided directions
4. **Scan Location** to confirm
5. **Place Items** and confirm completion

### Quality Control

#### QC Workflow
- **Inspection Points**: Configurable checkpoints
- **Pass/Fail Criteria**: Define quality standards
- **Documentation**: Photo/note capture
- **Escalation**: Failed items routing

#### Common QC Checks
- **Visual Inspection**: Damage, packaging
- **Quantity Verification**: Count accuracy
- **Batch/Expiry Check**: Date validation
- **Documentation Review**: Paperwork completeness

## Outbound Operations

### Order Processing

#### 1. Order Creation & Allocation
```
Outbound > Orders > Create New Order
```

**Order Types:**
- **Sales Orders**: Customer shipments
- **Transfer Orders**: Inter-warehouse moves  
- **Return Orders**: Customer returns
- **Sample Orders**: Product samples

#### 2. Wave Planning

**Wave Management:**
- **Create Wave**: Group orders for efficiency
- **Order Priority**: Set processing sequence
- **Resource Allocation**: Assign pickers/equipment
- **Release Wave**: Start picking process

#### 3. Picking Operations

**Picking Methods:**
- **Single Order Picking**: One order at a time
- **Batch Picking**: Multiple orders together
- **Zone Picking**: Area-based picking
- **Wave Picking**: Coordinated group picking

**Picking Process:**
1. **Receive Pick List** on mobile device/paper
2. **Navigate to Locations** following optimal route
3. **Scan Items** to verify correct SKU
4. **Pick Quantity** as instructed
5. **Confirm Pick** and move to next item
6. **Handle Exceptions** (short picks, damaged items)

#### 4. Packing & Shipping

**Packing Process:**
1. **Scan Container/Box** to begin packing
2. **Verify Items** against pick list
3. **Select Packaging** based on rules
4. **Pack Items** efficiently
5. **Generate Labels** (shipping, tracking)
6. **Weigh Package** for verification
7. **Stage for Shipping** in designated area

### Pick-to-Light (PTL) Operations

When PTL system is configured:
- **Light Activation**: System illuminates pick locations
- **Quantity Display**: Shows pick quantity on display
- **Confirmation**: Press button to confirm pick
- **Error Handling**: Red light for issues

## Inventory Management

### Stock Monitoring

#### Real-time Inventory
- **Current Levels**: Available, allocated, on-hold
- **Location Tracking**: Where items are stored
- **Movement History**: Track all transactions
- **Batch/Serial Tracking**: Lot-level visibility

#### Inventory Adjustments
```
Inventory > Stock Levels > Adjust Stock
```

**Adjustment Types:**
- **Physical Count**: Cycle count corrections
- **Damage**: Damaged goods write-off
- **Lost**: Missing inventory
- **Found**: Discovered inventory
- **Transfer**: Location moves

### Cycle Counting

#### Planning Counts
- **ABC Analysis**: Prioritize high-value items
- **Frequency Settings**: Daily, weekly, monthly
- **Zone-based**: Count by warehouse area
- **Random Sampling**: Statistical counting

#### Counting Process
1. **Generate Count Tasks** based on plan
2. **Assign Counters** to specific areas
3. **Execute Counts** using mobile devices
4. **Record Variances** when found
5. **Investigate Discrepancies** with supervisors
6. **Approve Adjustments** after review

### Location Management

#### Location Types
- **Receiving**: Inbound staging areas
- **Storage**: Primary inventory locations
- **Picking**: Forward pick locations
- **Packing**: Outbound staging areas
- **Shipping**: Final staging before dispatch

#### Location Maintenance
- **Capacity Management**: Monitor utilization
- **ABC Optimization**: Place fast movers optimally
- **Replenishment**: Maintain pick face stock
- **Blocking/Unblocking**: Manage damaged locations

## Station Operations

### Workstation Types

#### Receiving Stations
- **ASN Processing**: Handle advance ship notices
- **Quality Inspection**: QC workbenches
- **LPN Generation**: Label printing stations

#### Picking Stations  
- **Pick & Pack**: Combined operations
- **Batch Stations**: Multi-order processing
- **PTL Stations**: Light-directed picking

#### Packing Stations
- **Carton Sizing**: Automated box selection
- **Weighing**: Package verification
- **Label Printing**: Shipping documentation

### Station Configuration

#### Hardware Setup
- **Scanners**: Barcode/QR code readers
- **Printers**: Label and document printing
- **Scales**: Weight verification
- **PTL Systems**: Light-directed operations
- **Displays**: Task information screens

#### Software Configuration
- **User Assignment**: Station access control
- **Task Types**: Supported operations
- **Print Templates**: Label formats
- **Validation Rules**: Quality checks

## Reporting & Analytics

### Standard Reports

#### Operational Reports
- **Daily Operations Summary**: Key metrics overview
- **Order Status Report**: Inbound/outbound progress
- **Inventory Report**: Stock levels and movements
- **Performance Report**: Productivity metrics
- **Exception Report**: Issues requiring attention

#### Management Reports
- **Warehouse KPIs**: Performance indicators
- **Cost Analysis**: Labor and operational costs
- **Throughput Analysis**: Volume trends
- **Accuracy Metrics**: Error rates and quality
- **Utilization Report**: Resource efficiency

### Real-time Dashboards

#### Operations Dashboard
- **Live Order Status**: Real-time progress
- **Task Queue Status**: Pending work
- **Performance Metrics**: Current vs. target
- **Alert Summary**: Issues requiring attention

#### Management Dashboard
- **Executive Summary**: High-level KPIs
- **Trend Analysis**: Historical comparisons
- **Resource Utilization**: Labor and equipment
- **Financial Impact**: Cost and savings metrics

### Custom Reporting

#### Report Builder
- **Drag & Drop Interface**: Easy report creation
- **Data Sources**: Multiple system tables
- **Filtering Options**: Customizable criteria
- **Export Formats**: PDF, Excel, CSV
- **Scheduling**: Automated report generation

## System Administration

### User Management

#### User Creation
```
Settings > Users > Add New User
```

**Required Information:**
- Username and password
- Full name and contact info
- Role assignment
- Warehouse access
- Start/end dates

#### Permission Management
- **Role-based Access**: Assign roles to users
- **Custom Permissions**: Fine-grained control
- **Warehouse Restrictions**: Limit facility access
- **Feature Toggles**: Enable/disable functions

### System Configuration

#### Warehouse Setup
- **Facility Information**: Basic warehouse data
- **Zone Configuration**: Operational areas
- **Location Management**: Storage positions
- **Equipment Setup**: Scanners, printers, etc.

#### Business Rules
- **Picking Strategies**: FIFO, LIFO, optimal routing
- **Putaway Rules**: Location assignment logic
- **Allocation Rules**: Inventory reservation
- **Quality Rules**: QC requirements

#### Integration Settings
- **API Endpoints**: External system connections
- **Data Sync**: Master data management
- **Webhook Configuration**: Event notifications
- **Security Settings**: Authentication/authorization

### Troubleshooting Guide

#### Common Issues

**Login Problems:**
- Check username/password
- Verify account status
- Clear browser cache
- Contact administrator

**Performance Issues:**
- Check internet connection
- Verify server status
- Clear browser data
- Use supported browsers

**Scanner Issues:**
- Check battery level
- Verify WiFi connection
- Test barcode quality
- Restart scanner

**Printer Issues:**
- Check paper/ribbon
- Verify network connection
- Test print queue
- Restart printer

## Mobile Application Guide

### Mobile Device Setup

#### Device Requirements
- **Android 8.0+** or **iOS 12.0+**
- **WiFi connectivity** (802.11n minimum)
- **Camera** for barcode scanning
- **4GB RAM** minimum
- **32GB storage** minimum

#### App Installation
1. **Download** from company app store/MDM
2. **Install** following device prompts
3. **Configure** server connection
4. **Login** with user credentials
5. **Test** all functions

### Mobile Operations

#### Core Functions
- **Barcode Scanning**: Items, locations, containers
- **Task Management**: View, accept, complete tasks
- **Data Entry**: Quantities, notes, exceptions
- **Photo Capture**: Quality issues, damage
- **Offline Mode**: Limited functionality without WiFi

#### Best Practices
- **Keep Charged**: Maintain battery levels
- **WiFi Coverage**: Stay in signal range
- **Regular Sync**: Update data frequently
- **Clean Scanner**: Maintain camera lens
- **Report Issues**: Technical problems promptly

## Video Training Resources

For visual learning, watch our comprehensive training videos:

[OpenWes Introduction Video](https://www.bilibili.com/video/BV1pJF3efEow/)

**Training Series Includes:**
- System Navigation Basics
- Inbound Operations Walkthrough  
- Outbound Operations Guide
- Inventory Management Training
- Reporting & Analytics Tutorial
- Mobile App Usage Guide

## Support & Resources

### Getting Help

#### Self-Service
- **Knowledge Base**: Searchable documentation
- **Video Tutorials**: Step-by-step guides
- **FAQ Section**: Common questions
- **User Forum**: Community discussions

#### Direct Support
- **Help Desk**: In-app support button
- **Email Support**: support@openwes.com
- **Phone Support**: Available during business hours
- **Live Chat**: Real-time assistance

#### Training Resources
- **User Manuals**: Detailed documentation  
- **Training Videos**: Visual guides
- **Webinar Series**: Live training sessions
- **On-site Training**: Customized programs

### Best Practices

#### Daily Operations
- **Start with Dashboard**: Review status before beginning
- **Follow Procedures**: Adhere to established workflows
- **Report Issues**: Communicate problems immediately
- **Keep Learning**: Stay updated on new features

#### Safety Guidelines
- **Emergency Procedures**: Know safety protocols
- **Equipment Handling**: Follow safety guidelines
- **Reporting Hazards**: Identify and report risks
- **Training Requirements**: Maintain certifications

---

This user guide covers the essential aspects of using OpenWES in daily warehouse operations. For specific workflows or advanced features, refer to the detailed technical documentation or contact support.

