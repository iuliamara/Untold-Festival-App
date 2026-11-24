# Volume 6: Rate Limiting, Centralized Logging and Monitoring
## Bucket4j + Actuator/Prometheus + Loki/Promtail + Grafana

> **Complete English translation of the historical note.** The [Romanian original](6_rate_limiting_and_observability.md) is preserved alongside this translation. Historical configurations, examples and conclusions below are not current execution results; see [current observability](../observability.md). Credential examples are redacted.

This document describes infrastructure/DevOps functionality concerned with observability—understanding application activity—and protection against a client or bot sending excessive requests.

There are three independent pieces, connected in the same Grafana dashboard:

1. Rate limiting with Bucket4j, returning 429 Too Many Requests for a client exceeding five requests per second on ticket routes.
2. Centralized JSON logs through Promtail and Loki, collecting backend, database and frontend container logs in one searchable location.
3. Monitoring through Actuator, Micrometer, Prometheus and Grafana for JVM memory, HikariCP connections and endpoint response time.

## 1. Rate Limiting (Bucket4j)

### 1.1 What it does

The historical configuration gave each client IP a five-token bucket refilled continuously at five tokens per second. Each ticket request consumed one token. An empty bucket returned 429 before the request reached the database.

### 1.2 Where it is implemented

- [RateLimitingFilter](../../backend/src/main/java/com/untold/backend/security/RateLimitingFilter.java): the filter itself.
- [RateLimitingConfig](../../backend/src/main/java/com/untold/backend/configs/RateLimitingConfig.java): registers a raw servlet FilterRegistrationBean rather than a Spring Security filter, with Ordered.HIGHEST_PRECEDENCE.

### 1.3 Why these choices were made

The key is per IP rather than per user because limiting runs before JWT authentication. The intent was to reject excessive traffic before token parsing or other work; at that stage the filter does not know the authenticated account. It uses forwarded-address information for proxied requests and remote address otherwise.

The note records a Bucket4j API change from Bucket4j.builder() to Bucket.builder() in version 8.x. It also records selecting the bucket4j_jdk11-core artifact for Java 17 compatibility rather than an assumed jdk17-named artifact. These are historical implementation notes, not a new survey of artifact availability.

The original implementation found an instrumentation issue: requests rejected before DispatcherServlet did not reach normal MVC request instrumentation. Without a custom metric, a dashboard relying on that request count would not show the filter's rejections. A dedicated Micrometer Counter named ratelimit.rejected, exposed as ratelimit_rejected_total, was incremented for each 429.

### 1.4 How the historical note proposed testing it

The original examples below used an unauthenticated ticket endpoint and the older five-token capacity. They are retained as historical examples and are not current test results.

```bash
# A normal client with spaced sequential requests should not notice limiting:
curl http://localhost:8080/api/tickets/user/1

# Historical concurrent-request example:
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " http://localhost:8080/api/tickets/user/1 & done; wait
# Historical expectation: mostly 200 responses and some 429 responses.
```

The note's 429 response example:

```json
{"type":"ERROR","message":"Prea multe cereri. Încearcă din nou peste o secundă.","data":null,"responseType":"ERROR"}
```

The response message remains in its original language because it illustrates the original wire payload.

## 2. Centralized Logging (JSON + Promtail + Loki)

### 2.1 What it does

The backend writes structured JSON to stdout rather than only plain text. A separate Promtail container discovers Docker containers and forwards their logs to Loki, a log-oriented storage system. Grafana can search/filter the records centrally instead of inspecting each service separately with docker compose logs.

### 2.2 Where it is implemented

- [logback-spring.xml](../../backend/src/main/resources/logback-spring.xml): LogstashEncoder renders structured fields such as timestamp, level, logger, message and thread, plus service: untold-backend.
- [Promtail configuration](../../monitoring/promtail/promtail-config.yml): Docker discovery queries the Docker socket, applies container-name labels and reads stdout/stderr.
- [Compose](../../docker-compose.yml): adds Loki and Promtail services.

### 2.3 Why these choices were made

JSON permits field-based LogQL queries such as `| json | level="ERROR"`, rather than only matching text.

Docker discovery allows one agent to discover current containers instead of adding a collector to each Dockerfile. The original rationale was that backend, database and both web containers could be added/removed while discovery adapted.

The original note required both Docker socket and container-log mounts: the socket identifies containers, while the log directory supplies files. It described Docker Desktop's Linux VM as resolving those mounts similarly to Linux. That historical assertion is preserved here; actual support still depends on the current Docker environment and permissions.

### 2.4 How the historical note proposed testing it

```bash
curl -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={container=~".*backend.*"}' \
  --data-urlencode 'limit=5'
```

Alternatively, Grafana Explore selects Loki and uses `{container=~".*backend.*"}`. The historical note described the provisioned Backend Logs panel showing that stream. No successful ingestion is asserted by this translation.

## 3. Monitoring (Actuator + Prometheus + Grafana)

### 3.1 What it does

Actuator exposes technical metrics for JVM memory, active database-pool connections and endpoint response time on the Prometheus endpoint. Prometheus scrapes every five seconds and stores time series; Grafana queries them to draw charts.

### 3.2 Where it is implemented

- [POM](../../backend/pom.xml): Actuator and Prometheus registry dependencies.
- [application.properties](../../backend/src/main/resources/application.properties): exposed health/info/metrics/prometheus endpoints, HTTP histogram/percentile settings and the named UntoldHikariPool.
- [SecurityConfig](../../backend/src/main/java/com/untold/backend/configs/SecurityConfig.java): public Actuator access for the development scrape.
- [Prometheus configuration](../../monitoring/prometheus/prometheus.yml): backend scrape target.
- [Grafana provisioning](../../monitoring/grafana/provisioning/): datasources and dashboard definitions.
- [Compose](../../docker-compose.yml): Prometheus and Grafana containers.

### 3.3 Provisioned dashboard panels

| Panel | Historical description |
|---|---|
| HTTP Request Rate | Requests per second by endpoint |
| HTTP p95 Latency | Slowest five-percent latency boundary |
| JVM Heap Memory Used | Active application heap memory |
| HikariCP Active/Idle Connections | Connections in use versus available |
| Rate-Limited Requests (429) | Requests rejected by the limiter |
| Backend Logs | Loki log stream in the dashboard |

### 3.4 Why these choices were made

The original note explains that Actuator had to be explicitly public because the previous API-only permit rule did not match its paths. Otherwise Prometheus could receive 403 rather than scrape metrics. The active security rules have since changed; current behavior is described separately.

Fixed datasource UIDs, prometheus and loki, avoid randomly generated identifiers breaking dashboard JSON references after restart.

Anonymous Grafana access was enabled for quick local inspection. The historical note explicitly treated that as development configuration rather than a production recommendation. Credential values are intentionally not repeated.

### 3.5 How the historical note proposed testing it

```bash
# Historical expected status: 200 for the metrics endpoint.
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/actuator/prometheus

# Historical expectation: health "up" for the scrape target.
curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"'

# Supply your own local monitoring credentials; no values are documented.
curl -s -u "<local-monitoring-user>:<local-monitoring-password>" http://localhost:3000/api/datasources
curl -s -u "<local-monitoring-user>:<local-monitoring-password>" http://localhost:3000/api/search
```

The visual procedure was to open Grafana at localhost:3000, use the configured local access or anonymous viewing, and select Untold Backend Overview. These examples and expectations have not been executed for the documentation correction.

## 4. Startup and additional ports

The original startup command was:

```bash
docker compose up -d
```

| Service | Port/address | Intended use |
|---|---|---|
| Prometheus | `http://localhost:9090` | Raw query UI and target status |
| Grafana | `http://localhost:3000` | Provisioned visual dashboard; local credentials omitted |
| Loki | `http://localhost:3100` | Internal log API, usually viewed through Grafana |
| Actuator | `http://localhost:8080/actuator/prometheus` | Raw Prometheus metrics |

## 5. Known limitations recorded in the original

Rate limiting is in-memory per backend instance. With N instances behind a load balancer, each has an independent bucket; the original note described an aggregate sustained limit of N times five requests/second. It mentioned distributed backends such as Redis/Hazelcast as possible future designs, outside the local project's scope.

Prometheus/Loki data had no dedicated volumes; Grafana had grafana_data. Removing development volumes could lose history, while provisioned dashboard/configuration files remained available in the repository.

The [current observability guide](../observability.md) adds current burst capacity, OPTIONS behavior, plain-console logging boundaries, monitoring exposure and persistence details. This translation preserves the earlier rationale without silently converting historical expectations into verified results.
