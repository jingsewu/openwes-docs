---
id: quick-start
title: Quick Start
sidebar_position: 3
---

# Quick Start Guide

Get OpenWES up and running in minutes with this step-by-step guide.

## Prerequisites

- **Docker & Docker Compose** (v20+)
- **Java 17+** (for development)
- **4GB+ RAM** available
- **10GB+ disk space**

## 🚀 1-Minute Setup

```bash
# Clone the repository
git clone https://github.com/openwes/openwes.git
cd openwes

# Start all services
HOST_IP=$(hostname -I | awk '{print $1}') docker-compose up -d

```

## 🎯 First Steps

### 1. Access the Web Interface

Once containers are running, access:
- **WEB**: http://localhost:
- **API Documentation**: http://localhost:9010/swagger-ui/index.html
> you should change localhost to your host ip that the services are running

### 2. Default Login Credentials

```
Username: admin
Password: 123456
```

### 3. Quick Demo Workflow

#### Set up Your system
Follow this video [OpenWes Introduction Video](https://www.bilibili.com/video/BV1pJF3efEow/) to set up your system


#### Create Your First Inbound Order

```bash
# Using the REST API
curl -X POST http://localhost:9010/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: demo-api-key" \
  -d '{
    "apiType": "ORDER_INBOUND_CREATE",
    "body": [
      {
          "customerOrderNo": "CUST-PO-12345",
          "warehouseCode": "WH-001",
          "customerOrderType": "STANDARD",
          "storageType": "STORAGE",
          "details": [
            {
              "ownerCode": "OWNER-001",
              "qtyRestocked": 100,
              "skuCode": "SKU-12345"
            }
          ]
        }
      ]
  }'
```
> you can also check [api-client-to-wes.md](../api/api-client-to-wes.md) for more details

#### Process the Order

Follow this page [operators-guide.md](../operators/operators-guide.md) to learn how to process your first inbound order.


## 📊 Explore Key Features

### Warehouse Operations
- **Inbound Management**: Receiving, Putaway
- **Outbound Fulfillment**: Order processing, Picking, Packing
- **Inventory Tracking**: Real-time stock levels, Locations

### Integration Capabilities
- **REST APIs**: Complete API suite for external systems
- **Webhooks**: Real-time event notifications
- **Message Queues**: Async processing with Redis/RabbitMQ

### Automation Support
- **WCS Integration**: Conveyor and sorting systems
- **Robotics**: AGV/AMR coordination
- **IoT Devices**: Scanners, printers, sensors

## 🎬 Video Walkthrough

For a visual guide, watch our introduction video:

[OpenWes Introduction Video](https://www.bilibili.com/video/BV1pJF3efEow/)

This video provides a visual walkthrough of OpenWes features and how it integrates with your warehouse system.


## 🚨 Troubleshooting

### Common Issues

**Services not starting?**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs wes-server
docker-compose logs mysql
```

**Can't access web interface?**
```bash
# Verify port mapping
docker-compose port nginx 80

# Check if services are healthy
curl http://localhost:9010/actuator/health
```

**Database connection errors?**
```bash
# Reset database
docker-compose down -v
docker-compose up -d mysql
# Wait 30 seconds, then start other services
docker-compose up -d
```

## 📚 Next Steps

Now that you have OpenWES running:

1. **[Installation Guide](./installation.md)** - Production deployment
2. **[User Guide](../concepts/user-guide.md)** - Detailed operations
3. **[API Documentation](../api/api-client-to-wes.md)** - Integration details

## 💡 Need Help?

- 📖 **Documentation**: [docs.openwes.top](https://docs.openwes.top)
- 💬 **Community**: [GitHub Discussions](https://github.com/openwes/openwes/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/openwes/openwes/issues)
- 📧 **Support**: support@openwes.com

---

**Welcome to OpenWES!** 🎉 Your warehouse automation journey starts here.

