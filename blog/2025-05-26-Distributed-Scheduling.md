---
title: 'Mastering Distributed Task Scheduling in Spring Boot: A ShedLock-Powered Revolution'
author: 'Kinser'
author_title: 'Software Engineer'
tags: [ShedLock, SchedulerLock, Redis, Distributing]
date: '2025-05-26'
permalink: '/blog/Distributed-Scheduling'
---

### **Introduction**

🚀 **Say Goodbye to Duplicate Tasks & Scaling Headaches!**  
In modern distributed systems, ensuring that scheduled tasks run *once and only once* across multiple instances is a critical challenge. Traditional cron jobs fall short in clustered environments, risking task duplication, resource contention, and operational chaos. Enter **Spring Boot + ShedLock + Redis** – but with a *twist*. Let’s explore how our new `@DistributedScheduled` annotation simplifies bulletproof scheduling!

---

### 🔑 **Why Distributed Scheduling Matters**
- **Avoid Duplicate Execution**: Prevent multiple instances from running the same task simultaneously.
- **Dynamic Scaling**: Safely scale your microservices without manual cron job coordination.
- **Fault Tolerance**: Handle node failures gracefully with lock timeouts and retries.

---

### 🛠 **Introducing the Ultimate Annotation: `@DistributedScheduled`**
We’ve supercharged Spring’s `@Scheduled` and ShedLock into **one sleek, declarative annotation**:

```java
@DistributedScheduled(
    cron = "${order.sync.cron}", 
    name = "ORDER_SYNC_TASK",
    lockAtMostFor = "30m"
)
public void syncOrders() {
    // Your mission-critical task
}
```

#### **Key Features**:
1. **Unified Configuration**: Combine cron expressions, lock names, and timeouts in one place.
2. **Redis-Powered Locks**: Leverage Redis for distributed lock coordination (no more JDBC hassle!).
3. **Thread Pool Control**: Dedicated `defaultScheduler` with configurable pool size.
4. **Production-Ready Defaults**: 15-minute max lock duration, 10-minute minimum ownership.

---

### ⚡ **How It Works Under the Hood**
1. **Redis Lock Provider**:
   ```java
   @Bean
   public LockProvider lockProvider(RedisConnectionFactory factory) {
       return new RedisLockProvider(factory, "shedlock"); // Namespaced keys
   }
   ```  
   *Why Redis?* Blazing speed, atomic operations, and TTL support make it perfect for locks.

2. **Smart Thread Pooling**:
   ```java
   @Bean(name = "defaultScheduler")
   public TaskScheduler defaultScheduler() {
       ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
       scheduler.setPoolSize(5); // Scale based on workload
       scheduler.setThreadNamePrefix("scheduler-default-");
       return scheduler;
   }
   ```  
   Avoid thread starvation with dedicated scheduling threads.

3. **Annotation Magic**:
   - Inherits `@Scheduled`’s cron flexibility.
   - Enforces ShedLock’s safety net with **alias-driven overrides**.

---

### 🏆 **Why Choose This Over Vanilla ShedLock?**
| **Traditional Approach** | **Our Solution** |
|--------------------------|-------------------|
| Duplicate `@Scheduled` + `@SchedulerLock` annotations | **Single annotation** to rule them all |
| Manual lock configuration | Sensible **defaults** + easy customization |
| Risk of misconfigured pools | Built-in **thread pool isolation** |

---

### 🚨 **Pro Tips for Production**
- **Lock Duration**: Set `lockAtMostFor` longer than your worst-case task runtime.
- **Monitor Redis**: Watch for lock contention with Redis CLI (`KEYS shedlock:*`).
- **Dynamic Cron**: Use `cron = "${...}"` to externalize schedules.

---

### 🌟 **Real-World Use Case**
**Problem**: A payment reconciliation job ran twice daily, but duplicates caused $200K in over-refunds.  
**Solution**:
```java
@DistributedScheduled(
    cron = "0 0 2,14 * * *", 
    name = "PAYMENT_RECON",
    lockAtMostFor = "2h"
)
public void reconcilePayments() {
    // Safely process $1M/hour transactions
}
```
**Result**: Zero duplicates, effortless scaling to 10 service instances. 💸

---

### 🔮 **Future-Proof Your Scheduling**
Our framework isn’t just code – it’s a **philosophy**:
1. **Embrace Declarative Programming**
2. **Design for Idempotency**
3. **Assume Distributed Everything**

---

**🚀 Get Started Today!**  
Clone our [GitHub](https://github.com/jingsewu/open-wes/tree/master/server/modules-utils/distribute-scheduler) or add the annotation to your Spring Boot app. Transform your cron jobs from liability to asset in 10 lines of code.

*Because in distributed systems, timing isn’t just everything – it’s the only thing.* 💫

---

**💬 Let’s Discuss!**  
How are YOU handling distributed scheduling? Share your war stories on https://github.com/jingsewu/open-wes/issues
