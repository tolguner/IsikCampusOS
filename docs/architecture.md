# IsikCampusOS Teknik Mimari

## 1. Mimari Yaklasim

Bu proje `microservices` mimarisi ile insa edilir.

Gerekceler:

- Her domain servisi bagimsiz olarak gelistirilebilir, deploy edilebilir ve olceklendirilebilir.
- Domain sinirlari en basindan teknik olarak zorunlu hale getirilir; cross-domain bagimlilik dogrudan kod ile degil, API veya event araciligiyla kurulur.
- Servis bazli veritabani izolasyonu, tek bir veri katmanindaki riski dagitir.
- Ilerleyen fazlarda yeni modullerin sisteme eklenmesi mevcut servisleri etkilemez.

Mimari kararlar:

- **Repo yapisi**: Monorepo — tum servisler tek Git deposunda, `services/` dizini altinda yonetilir.
- **Veritabani izolasyonu**: Her microservice kendi bagimsiz PostgreSQL instance'ina sahiptir.
- **Deployment**: Docker Compose ile tum sistem tek komutla ayaga kaldirilir.
- **Auth**: JWT token dogrulama API Gateway katmaninda merkezi olarak yapilir; downstream servisler `X-User-Id` ve `X-User-Roles` headerlari ile calisir.

## 2. Onerilen Teknoloji Yigini

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS veya Material UI tabanli component sistemi

### Backend (Her Servis)

- Java 21
- Spring Boot 3
- Spring Web
- Spring Security
- Spring Data JPA
- Bean Validation

### API Katmani

- Spring Cloud Gateway (API Gateway)
- Spring Cloud Netflix Eureka (Service Registry / Service Discovery)
- Spring Cloud Config (Merkezi konfigurасyon yonetimi)

### Mesajlasma

- Apache Kafka (domain event'leri ve asenkron servisler arasi iletisim)
- Zookeeper (Kafka koordinasyonu)

### Veri Katmani

- PostgreSQL (her servis icin ayri instance)
- Redis (opsiyonel: gateway rate limiting ve gecici oturum)

### Gozlemlenebilirlik

- Micrometer + Zipkin (distributed tracing)
- Spring Boot Actuator (health, metrics)
- Structured logging + correlation ID

### DevOps

- Docker
- Docker Compose
- GitHub Actions

## 3. Servis Katalogu

| Servis | Port | Sorumluluk |
|--------|------|------------|
| `api-gateway` | 8080 | Yonlendirme, JWT dogrulama, rate limiting |
| `auth-service` | 8081 | Kimlik, token, e-posta dogrulama, sifre |
| `profile-service` | 8082 | Profil, beceri, ilgi alanlari, guven skoru |
| `notification-service` | 8083 | In-app ve e-posta bildirim dagitimi |
| `moderation-service` | 8084 | Rapor, vaka yonetimi, yaptirim |
| `analytics-service` | 8085 | Olay toplama, metrik hesaplama, dashboard |
| `facility-service` | 8086 | Tesis rezervasyon ve check-in |
| `food-service` | 8087 | Vendor, menu, siparis yonetimi |
| `ride-service` | 8088 | Ride offer, request ve eslestirme |
| `event-service` | 8089 | Kulup, etkinlik, RSVP |
| `projectmatch-service` | 8090 | Proje ilani, davet, ekip eslestirme |
| `microjob-service` | 8091 | Is ilani, teklif, kontrat, teslimat |

Altyapi servisleri:

| Servis | Port | Rol |
|--------|------|-----|
| `eureka-server` | 8761 | Servis kayit ve kesif |
| `config-server` | 8888 | Merkezi konfigurасyon |
| `kafka` | 9092 | Mesaj broker |
| `zookeeper` | 2181 | Kafka koordinasyonu |
| `zipkin` | 9411 | Distributed tracing UI |

## 4. Iletisim Tasarimi

### Senkron Iletisim (REST)

- Istemci → API Gateway → Downstream Servis
- API Gateway JWT'yi dogrular, `X-User-Id` ve `X-User-Roles` headerlarini ekler.
- Servisler arasi senkron cagri minimumda tutulur; yalnizca gercek zamanli veri gereken durumlarda kullanilir.

### Asenkron Iletisim (Kafka)

- Servisler domain event'leri Kafka'ya yayar (producer).
- Ilgili servisler topic'lere abone olur (consumer).
- Event'ler geri alinabilir ve retry-safe olmalidir.

Kafka topic ornekleri:

- `user.registered`
- `email.verified`
- `profile.completed`
- `booking.created`
- `booking.cancelled`
- `order.placed`
- `order.status.changed`
- `ride.match.created`
- `event.rsvp.created`
- `project.invite.sent`
- `job.contract.closed`
- `report.created`
- `moderation.case.opened`
- `notification.dispatch.requested`

### Circuit Breaker

- Servisler arasi senkron cagrilarda Resilience4j kullanilmalidir.
- Fallback mekanizmasi kritik akislarda tanimlanmalidir.

## 5. Veritabani Stratejisi

- Her microservice kendi bagimsiz PostgreSQL instance'ini kullanir.
- Servisler birbirinin veritabanina dogrudan erisemez.
- Servisler arasi veri gereksinimleri API veya Kafka event'leri araciligiyla karsilanir.
- Her servis kendi Flyway/Liquibase migration'larini bagimsiz yonetir.

| Servis | Veritabani Adi |
|--------|----------------|
| auth-service | `auth_db` |
| profile-service | `profile_db` |
| notification-service | `notification_db` |
| moderation-service | `moderation_db` |
| analytics-service | `analytics_db` |
| facility-service | `facility_db` |
| food-service | `food_db` |
| ride-service | `ride_db` |
| event-service | `event_db` |
| projectmatch-service | `projectmatch_db` |
| microjob-service | `microjob_db` |

## 6. Guvenlik Tasarimi

- Universite domain kontrolu (auth-service)
- E-posta dogrulama zorunlulugu
- JWT uretim ve dogrulama API Gateway uzerinden
- RBAC (Roller: student, sks_admin, vendor_admin, facility_admin, moderator, admin)
- SKS Onay Mekanizmasi: Kulup olusturma ve etkinlik yayinlama SKS denetimine tabidir
- Rate limiting (API Gateway katmaninda)
- Input validation (her serviste Bean Validation)
- Owner-based authorization (her servis kendi kaynaklarini korur)
- Kritik islem loglari (audit log event'leri ile)

## 7. API Tasarim Standartlari

- Base path: `/api/v1/...`
- Kaynak bazli endpoint tasarimi (RESTful)
- Standart hata cevabi modeli
- Sayfalama, filtreleme ve siralama destegi
- OpenAPI / Swagger dokumantasyonu (her serviste)
- Tum liste endpoint'lerinde pagination zorunludur

Ornek kaynaklar (API Gateway routing ile):

- `/api/v1/facilities` → facility-service
- `/api/v1/bookings` → facility-service
- `/api/v1/vendors` → food-service
- `/api/v1/orders` → food-service
- `/api/v1/rides` → ride-service
- `/api/v1/events` → event-service
- `/api/v1/clubs` → event-service
- `/api/v1/projects` → projectmatch-service
- `/api/v1/jobs` → microjob-service
- `/api/v1/notifications` → notification-service
- `/api/v1/reports` → moderation-service
- `/api/v1/profiles` → profile-service
- `/api/v1/auth` → auth-service

## 8. Frontend Bilgi Mimarisi

Ana uygulama navigasyonu:

- Home / Feed
- Facilities
- Food
- Rides
- Events
- Projects
- MicroJobs
- Notifications
- Profile
- Admin

Temel ekran prensipleri:

- Her modulu ayni tasarim sistemi icinde sunmak
- Ortak kart, liste, filtre ve durum bilesenleri kullanmak
- Ogrencinin ana akisi icin mobil oncelemek

## 9. Onerilen Repo Yapisi (Monorepo)

```text
isikcampusos/
  services/
    api-gateway/
    auth-service/
    profile-service/
    notification-service/
    moderation-service/
    analytics-service/
    facility-service/
    food-service/
    ride-service/
    event-service/
    projectmatch-service/
    microjob-service/
  frontend/
  infra/
    docker-compose.yml
    docker-compose.override.yml
    kafka/
    config/
  docs/
  README.md
```

Detayli servis yapisi (ornek: event-service):

```text
services/event-service/
  src/main/java/com/isik/campusos/event/
    api/
      controller/
      request/
      response/
    application/
      service/
      event/
    domain/
      model/
    infrastructure/
      persistence/
        repository/
      messaging/
        producer/
        consumer/
    config/
  src/main/resources/
    application.yml
  src/test/
  Dockerfile
  pom.xml
```

## 10. Docker Compose Yapisi

```text
infra/
  docker-compose.yml        # Uretim benzeri tam stack
  docker-compose.dev.yml    # Gelistirici ortami overrides
  docker-compose.infra.yml  # Sadece altyapi (Kafka, DB, Zipkin)
```

Ornek calisma komutu:

```bash
docker compose -f infra/docker-compose.yml up --build
```

## 11. Mimari Karar Ozeti

- Microservices mimarisi ile baslamak
- Her servis bagimsiz PostgreSQL instance'i kullanir
- Monorepo yapisi ile tum servisler tek depoda yonetilir
- Docker Compose ile yerel gelistirme ve demo ortami
- API Gateway JWT dogrulama merkezi olarak yapar
- Kafka ile asenkron servisler arasi iletisim
- Eureka ile servis kayit ve kesif
- Zipkin ile distributed tracing
- auth, profile, notification ve analytics temelini once kurmak
- En yuksek ogrenci etkisi olan modulleri once MVP olarak teslim etmek
