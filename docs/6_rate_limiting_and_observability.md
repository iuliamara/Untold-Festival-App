# Volume 6: Rate Limiting, Logare Centralizată & Monitorizare
## Bucket4j + Actuator/Prometheus + Loki/Promtail + Grafana

Acest document descrie o funcționalitate pur de infrastructură/DevOps, orientată spre
**observabilitate** (poți vedea în timp real ce face aplicația și de ce) și **protecție** (aplicația
se apără singură împotriva unui client/bot care o bombardează cu cereri).

Sunt 3 piese independente, care totuși se leagă între ele în același dashboard Grafana:

1. **Rate limiting** (Bucket4j) — blochează cu `429 Too Many Requests` un client care depășește
   5 cereri/secundă către `/api/tickets/**`.
2. **Logare centralizată** (loguri JSON + Promtail + Loki) — toate containerele (backend, db,
   frontend-uri) își trimit log-urile într-un singur loc, interogabil.
3. **Monitorizare** (Spring Actuator + Micrometer + Prometheus + Grafana) — metrici live: memorie
   JVM, conexiuni HikariCP, timp de răspuns per endpoint, dashboard vizual.

---

## 1. Rate Limiting (Bucket4j)

### Ce face
Fiecare IP client primește propriul "bucket" (găleată) cu 5 token-uri, care se realimentează
continuu cu 5 token-uri/secundă. Fiecare cerere HTTP către `/api/tickets/**` consumă 1 token. Dacă
bucket-ul e gol, cererea primește `429` fără să mai ajungă la baza de date.

### Unde e implementat
- [`RateLimitingFilter.java`](../backend/src/main/java/com/untold/backend/security/RateLimitingFilter.java)
  — filtrul propriu-zis.
- [`RateLimitingConfig.java`](../backend/src/main/java/com/untold/backend/configs/RateLimitingConfig.java)
  — îl înregistrează ca filtru servlet brut (`FilterRegistrationBean`), **nu** ca filtru Spring
  Security, cu prioritatea cea mai mare posibilă (`Ordered.HIGHEST_PRECEDENCE`).

### De ce așa, nu altfel
- **Cheie per-IP, nu per-user**: filtrul rulează *înaintea* autentificării JWT (intenționat — o
  cerere spam trebuie respinsă cât mai devreme, înainte să consume orice altă resursă, inclusiv
  parsarea tokenului). Deci nu poate ști cine e userul logat, doar IP-ul (cu fallback pe
  `X-Forwarded-For` dacă cererea vine printr-un proxy).
- **`Bucket4j.builder()` → `Bucket.builder()`**: în Bucket4j 8.x API-ul vechi (`Bucket4j.builder()`)
  a fost înlocuit cu `Bucket.builder()`.
- **Artifact-ul corect**: `com.bucket4j:bucket4j_jdk11-core` (nu `bucket4j_jdk17-core`, care nu
  există în Maven Central — proiectul rulează pe Java 17, dar artifact-ul Bucket4j compatibil se
  numește totuși `_jdk11`).
- **Bug găsit și reparat în timpul implementării**: filtrul rulează înaintea `DispatcherServlet`-ului
  Spring MVC, deci cererile respinse cu 429 **nu** ajung niciodată la instrumentarea automată
  Micrometer (`http_server_requests_seconds_count`). Fără o metrică proprie, panoul din Grafana
  "Rate-Limited Requests" ar fi arătat mereu 0, deși limitarea chiar funcționa. Soluția: un
  `Counter` Micrometer dedicat (`ratelimit.rejected`, expus ca `ratelimit_rejected_total` în
  Prometheus), incrementat manual în filtru la fiecare 429.

### Cum testezi
```bash
# Un client normal (cereri secvențiale, cu pauze) nu observă nicio limitare:
curl http://localhost:8080/api/tickets/user/1

# Bombardează endpoint-ul cu cereri CONCURENTE (secvențial nu declanșează limita, pentru că
# bucket-ul se realimentează suficient de repede între cereri):
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " http://localhost:8080/api/tickets/user/1 & done; wait
# Rezultat așteptat: majoritatea 200, câteva 429 printre ele.
```
Corpul unui răspuns 429:
```json
{"type":"ERROR","message":"Prea multe cereri. Încearcă din nou peste o secundă.","data":null,"responseType":"ERROR"}
```

---

## 2. Logare Centralizată (JSON + Promtail + Loki)

### Ce face
Backend-ul scrie loguri structurate JSON pe stdout (în loc de text simplu). **Promtail** (un
container separat) descoperă automat *toate* containerele din `docker-compose` prin API-ul Docker
și le trimite log-urile către **Loki** (o bază de date optimizată pentru loguri). Grafana le poate
căuta/filtra dintr-un singur loc, fără să mai dai `docker compose logs` pe fiecare serviciu separat.

### Unde e implementat
- [`logback-spring.xml`](../backend/src/main/resources/logback-spring.xml) — encoder
  `LogstashEncoder`, transformă fiecare linie de log într-un obiect JSON (`timestamp`, `level`,
  `logger_name`, `message`, `thread_name`, plus câmpul custom `service: "untold-backend"`).
- [`monitoring/promtail/promtail-config.yml`](../monitoring/promtail/promtail-config.yml) —
  configurare `docker_sd_configs`: Promtail interoghează `/var/run/docker.sock` ca să afle ce
  containere rulează, le etichetează cu `container: <nume>`, și tail-ează stdout-ul fiecăruia.
- `docker-compose.yml` — servicii noi `loki` și `promtail`.

### De ce așa, nu altfel
- **JSON, nu text simplu**: un log JSON poate fi interogat pe câmpuri individuale în Grafana
  (`| json | level="ERROR"`), nu doar căutat ca text brut.
- **Promtail + `docker_sd_configs` în loc de un agent per-serviciu**: un singur Promtail
  descoperă automat toate containerele curente (backend, db, ambele frontend-uri) fără să
  modifici Dockerfile-urile lor — se activează/dezactivează containere și Promtail se adaptează
  singur.
- **Mount dublu necesar**: `/var/run/docker.sock` (ca Promtail să *afle* ce containere există) +
  `/var/lib/docker/containers` (ca să *citească* fișierele efective de log). Pe Docker Desktop
  (Windows/Mac), ambele căi sunt rezolvate în interiorul mașinii virtuale Linux pe care Docker
  Desktop o gestionează, deci mount-urile funcționează identic ca pe Linux nativ.

### Cum testezi
```bash
# Direct din Loki (fără Grafana):
curl -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={container=~".*backend.*"}' \
  --data-urlencode 'limit=5'
```
Sau vizual: Grafana → **Explore** → sursa de date **Loki** → query `{container=~".*backend.*"}`.
Panoul "Backend Logs" din dashboard-ul provisionat arată deja acest flux live.

---

## 3. Monitorizare (Actuator + Prometheus + Grafana)

### Ce face
Spring Boot Actuator expune metrici tehnice (memorie JVM, conexiuni active în pool-ul de bază de
date, timp de răspuns per endpoint) pe `/actuator/prometheus`, într-un format text pe care
**Prometheus** îl "scrape-uiește" (interoghează) la fiecare 5 secunde și îl stochează ca serie de
timp. **Grafana** citește din Prometheus și desenează grafice.

### Unde e implementat
- `pom.xml` — `spring-boot-starter-actuator` + `micrometer-registry-prometheus`.
- `application.properties` — expune explicit `health,info,metrics,prometheus`, activează
  histograme + percentile (p50/p95/p99) pentru latența HTTP, numește pool-ul HikariCP
  (`UntoldHikariPool`) ca să fie ușor de găsit în query-uri.
- [`SecurityConfig.java`](../backend/src/main/java/com/untold/backend/configs/SecurityConfig.java)
  — `/actuator/**` adăugat la `permitAll` (altfel Prometheus primea `403` la fiecare scrape, pentru
  că orice rută din afara `/api/**` cerea autentificare).
- [`monitoring/prometheus/prometheus.yml`](../monitoring/prometheus/prometheus.yml) — configurează
  job-ul de scrape către `backend:8080/actuator/prometheus`.
- [`monitoring/grafana/provisioning/`](../monitoring/grafana/provisioning/) — Grafana pornește deja
  cu sursele de date (Prometheus + Loki) și un dashboard ("Untold Backend Overview") gata create,
  fără click-uri manuale în UI.
- `docker-compose.yml` — servicii noi `prometheus` și `grafana`.

### Dashboard-ul provisionat conține
| Panou | Ce arată |
|---|---|
| HTTP Request Rate | cereri/secundă, grupate pe endpoint |
| HTTP p95 Latency | timpul de răspuns pentru cele mai lente 5% din cereri |
| JVM Heap Memory Used | memoria activ folosită de aplicație |
| HikariCP Active/Idle Connections | câte conexiuni la baza de date sunt în uz vs. libere |
| Rate-Limited Requests (429) | câte cereri a blocat limitatorul din secțiunea 1 |
| Backend Logs | log-urile live din Loki, direct în același dashboard |

### De ce așa, nu altfel
- **`/actuator/**` trebuia adăugat explicit la `permitAll`**: regula existentă din
  `SecurityConfig` era `.requestMatchers("/api/**").permitAll()` + `.anyRequest().authenticated()`
  — actuator nu se potrivea cu `/api/**`, deci Prometheus primea `403`, nu `200`, la fiecare
  încercare de scrape.
- **UID-uri fixe pe sursele de date** (`prometheus`, `loki` în `datasources.yml`): fără ele,
  Grafana generează UID-uri aleatorii la fiecare pornire, iar dashboard-ul JSON (care referă
  sursele de date după UID) s-ar rupe la un restart.
- **`GF_AUTH_ANONYMOUS_ENABLED=true`**: doar pentru development local — permite să deschizi
  Grafana fără login pentru a te uita rapid pe dashboard. **Nu se folosește niciodată în producție.**

### Cum testezi
```bash
# 1. Actuator expune metrici (ar trebui 200, nu 403):
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/actuator/prometheus

# 2. Prometheus scrape-uiește cu succes backend-ul:
curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"'
# -> "health":"up"

# 3. Grafana are ambele surse de date + dashboard-ul:
curl -s -u admin:admin http://localhost:3000/api/datasources
curl -s -u admin:admin http://localhost:3000/api/search
```
Vizual: deschide **http://localhost:3000** (user `admin` / parolă `admin`, sau direct fără login —
anonim e activat) → dashboard-ul **"Untold Backend Overview"** e deja acolo.

---

## 4. Pornire & porturi noi

```bash
docker compose up -d
```

| Serviciu | Port | Ce vezi |
|---|---|---|
| Prometheus | `http://localhost:9090` | UI brut de interogare metrici (Status → Targets ca să confirmi că backend-ul e "UP") |
| Grafana | `http://localhost:3000` | Dashboard-ul vizual (`admin`/`admin`) |
| Loki | `http://localhost:3100` | API intern, nu are UI propriu — se accesează prin Grafana |
| Backend Actuator | `http://localhost:8080/actuator/prometheus` | Metricile brute, format text Prometheus |

## 5. Limitări cunoscute

- Rate limiting-ul e **in-memory**, per instanță de backend — dacă ai rula mai multe instanțe
  în spatele unui load balancer, fiecare ar avea propriul bucket (limita reală ar fi
  `N instanțe × 5 req/s`, nu 5 global). Pentru producție cu scalare orizontală, Bucket4j suportă
  un backend distribuit (Redis/Hazelcast), dar asta depășește scopul unui proiect local.
- Datele Prometheus/Loki **nu sunt persistate** cu volum dedicat (doar Grafana are volum,
  `grafana_data`) — la `docker compose down -v` se pierd metricile/logurile istorice, dar
  dashboard-urile și configurația rămân (sunt fișiere provisionate din `monitoring/`, nu date
  din DB).
