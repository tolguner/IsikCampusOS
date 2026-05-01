# IsikCampusOS API Contract Outline

## 1. Amac

Bu dokuman, IsikCampusOS icin kodlamaya baslarken kullanilacak REST kaynak yapisini ve endpoint omurgasini tanimlar. Bu bir final OpenAPI dosyasi degildir; ancak controller, service ve request-response DTO tasarimi icin yeterli baslangic sozlesmesini verir.

## 2. Genel API Kurallari

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <token>` (API Gateway'e gonderilir; Gateway JWT'yi dogrular ve downstream servise `X-User-Id` + `X-User-Roles` headerlarini iletir)
- Content type: `application/json`
- Tum liste endpoint'lerinde pagination zorunludur.
- Filtreleme query param ile yapilir.
- Standart response envelope kullanimi opsiyoneldir; ama hata modeli ortak olmalidir.
- Her servis API Gateway routing kurallarına gore `/api/v1/<kaynak>` pathi ile disariya acilir.
- Downstream servisler JWT almaz; yalnizca gateway tarafindan eklenen headerlari okur.

## 3. Standart Listeleme Parametreleri

- `page`
- `size`
- `sort`
- `q`
- `status`
- `from`
- `to`

Ornek:

```text
GET /api/v1/events?page=0&size=20&sort=startsAt,asc&status=published
```

## 4. Standart Hata Modeli

```json
{
  "timestamp": "2026-04-19T18:00:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/v1/bookings",
  "details": [
    {
      "field": "startAt",
      "message": "must be in the future"
    }
  ]
}
```

## 5. Auth API

### Public

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Admin

- `GET /auth/users`
- `GET /auth/users/{userId}`
- `PATCH /auth/users/{userId}/status`
- `POST /auth/users/{userId}/roles`
- `DELETE /auth/users/{userId}/roles/{roleCode}`

## 6. Profile API

- `GET /profiles/me`
- `PATCH /profiles/me`
- `GET /profiles/{userId}`
- `GET /profiles/{userId}/skills`
- `PUT /profiles/me/skills`
- `GET /profiles/{userId}/interests`
- `PUT /profiles/me/interests`
- `GET /profiles/me/trust`
- `GET /profiles/search`

## 7. Notification API

- `GET /notifications`
- `PATCH /notifications/{notificationId}/read`
- `PATCH /notifications/read-all`
- `GET /notification-preferences`
- `PUT /notification-preferences`

## 8. Moderation API

- `POST /reports`
- `GET /reports/me`
- `GET /moderation/cases`
- `GET /moderation/cases/{caseId}`
- `POST /moderation/cases/{caseId}/actions`
- `PATCH /moderation/cases/{caseId}/assign`
- `PATCH /moderation/cases/{caseId}/close`

## 9. Facility API

### Student

- `GET /facilities`
- `GET /facilities/{facilityId}`
- `GET /facilities/{facilityId}/resources`
- `GET /facility-resources/{resourceId}/availability`
- `POST /bookings`
- `GET /bookings/me`
- `GET /bookings/{bookingId}`
- `PATCH /bookings/{bookingId}/cancel`
- `POST /bookings/{bookingId}/check-in`

### Facility Admin

- `POST /facilities`
- `PATCH /facilities/{facilityId}`
- `POST /facilities/{facilityId}/policies`
- `PUT /facilities/{facilityId}/availability-rules`
- `GET /facility-admin/bookings`
- `PATCH /facility-admin/bookings/{bookingId}/approve`
- `PATCH /facility-admin/bookings/{bookingId}/reject`
- `PATCH /facility-admin/bookings/{bookingId}/mark-no-show`

## 10. Food API

### Student

- `GET /vendors`
- `GET /vendors/{vendorId}`
- `GET /vendors/{vendorId}/menu-items`
- `GET /vendors/{vendorId}/pickup-slots`
- `POST /orders`
- `GET /orders/me`
- `GET /orders/{orderId}`
- `PATCH /orders/{orderId}/cancel`

### Vendor Admin

- `POST /vendor-admin/vendors`
- `PATCH /vendor-admin/vendors/{vendorId}`
- `POST /vendor-admin/vendors/{vendorId}/menu-items`
- `PATCH /vendor-admin/menu-items/{menuItemId}`
- `PUT /vendor-admin/vendors/{vendorId}/pickup-slots`
- `GET /vendor-admin/orders`
- `PATCH /vendor-admin/orders/{orderId}/accept`
- `PATCH /vendor-admin/orders/{orderId}/reject`
- `PATCH /vendor-admin/orders/{orderId}/preparing`
- `PATCH /vendor-admin/orders/{orderId}/ready`
- `PATCH /vendor-admin/orders/{orderId}/picked-up`

## 11. Ride API

- `GET /rides/offers`
- `POST /rides/offers`
- `PATCH /rides/offers/{offerId}`
- `PATCH /rides/offers/{offerId}/cancel`
- `GET /rides/requests`
- `POST /rides/requests`
- `PATCH /rides/requests/{requestId}/cancel`
- `POST /rides/matches`
- `PATCH /rides/matches/{matchId}/accept`
- `PATCH /rides/matches/{matchId}/reject`
- `PATCH /rides/matches/{matchId}/cancel`
- `PATCH /rides/matches/{matchId}/complete`
- `POST /rides/matches/{matchId}/ratings`

## 12. Event API

### Student

- `GET /clubs`
- `GET /events`
- `GET /events/{eventId}`
- `POST /events/{eventId}/rsvps`
- `PATCH /events/{eventId}/rsvps/me`
- `POST /events/{eventId}/feedback`

### Club Admin

- `POST /club-admin/events`
- `PATCH /club-admin/events/{eventId}`
- `PATCH /club-admin/events/{eventId}/submit-for-approval`
- `PATCH /club-admin/events/{eventId}/cancel`
- `GET /club-admin/events/{eventId}/attendances`
- `POST /club-admin/events/{eventId}/check-ins`
- `GET /club-admin/clubs/{clubId}/analytics`

### SKS Admin

- `GET /sks-admin/events/pending`
- `PATCH /sks-admin/events/{eventId}/approve`
- `PATCH /sks-admin/events/{eventId}/reject`
- `GET /sks-admin/clubs`
- `POST /sks-admin/clubs`
- `PATCH /sks-admin/clubs/{clubId}`
- `PATCH /sks-admin/clubs/{clubId}/suspend`
- `POST /sks-admin/clubs/{clubId}/assign-admin`
- `DELETE /sks-admin/clubs/{clubId}/revoke-admin/{userId}`
- `GET /sks-admin/clubs/{clubId}/report`

## 13. ProjectMatch API

- `GET /projectmatch/skill-profile/me`
- `PUT /projectmatch/skill-profile/me`
- `GET /projectmatch/projects`
- `POST /projectmatch/projects`
- `GET /projectmatch/projects/{projectId}`
- `PATCH /projectmatch/projects/{projectId}`
- `PATCH /projectmatch/projects/{projectId}/close`
- `GET /projectmatch/projects/{projectId}/candidates`
- `POST /projectmatch/projects/{projectId}/invitations`
- `PATCH /projectmatch/invitations/{invitationId}/accept`
- `PATCH /projectmatch/invitations/{invitationId}/decline`
- `GET /projectmatch/teams/me`

## 14. MicroJob API

- `GET /jobs`
- `POST /jobs`
- `GET /jobs/{jobId}`
- `PATCH /jobs/{jobId}`
- `PATCH /jobs/{jobId}/cancel`
- `POST /jobs/{jobId}/proposals`
- `GET /jobs/{jobId}/proposals`
- `PATCH /proposals/{proposalId}/withdraw`
- `PATCH /proposals/{proposalId}/accept`
- `GET /contracts/me`
- `GET /contracts/{contractId}`
- `POST /contracts/{contractId}/deliveries`
- `PATCH /contracts/{contractId}/approve-delivery`
- `PATCH /contracts/{contractId}/dispute`
- `POST /contracts/{contractId}/ratings`

## 15. Analytics API

- `GET /admin/analytics/overview`
- `GET /admin/analytics/modules/{moduleName}`
- `GET /admin/analytics/events`
- `GET /admin/analytics/trust`

## 16. Response Tasarim Notlari

Liste response'lari icin ornek:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

Detay response'larinda:

- kaynak ozeti
- status
- owner / actor bilgisi
- timestamps
- opsiyonel action izinleri

Ornek action izinleri:

```json
{
  "id": "booking-123",
  "status": "confirmed",
  "allowedActions": ["cancel", "checkIn"]
}
```

## 17. Backend Paketleme Onerisi (Microservice Yapisina Gore)

Her microservice asagidaki dizin yapisini izler:

```text
services/<servis-adi>/
  src/main/java/com/isik/campusos/<domain>/
    api/
      controller/
      request/
      response/
    application/
      service/
      eventhandler/
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
    db/migration/         # Flyway migration dosyalari
  src/test/
  Dockerfile
  pom.xml
```

Ornek: event-service

```text
services/event-service/src/main/java/com/isik/campusos/event/
  api/
    controller/
    request/
    response/
  application/
    service/
    eventhandler/       # Kafka consumer handler'lari
  domain/
    model/
  infrastructure/
    persistence/
      repository/
    messaging/
      producer/         # Kafka event producer'lari
      consumer/         # Kafka topic consumer'lari
  config/
```

Monorepo kok dizin yapisi:

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
    docker-compose.dev.yml
    docker-compose.infra.yml
    kafka/
    config/
  docs/
  README.md
```

## 18. Kodlamaya Gecis Sirasi

1. Docker Compose altyapisi (Kafka, Eureka, Config Server, Zipkin, per-service DB'ler)
2. api-gateway (routing, JWT dogrulama, X-User header injection)
3. auth-service + profile-service + temel Kafka event yapilandirmasi
4. notification-service skeleton
5. event-service API
6. facility-service API
7. projectmatch-service API
8. moderation-service + analytics-service basics
9. food-service, ride-service, microjob-service

Bu siralama, infra stabilitesini once saglar; ardindan MVP modullerini teslim eder.
