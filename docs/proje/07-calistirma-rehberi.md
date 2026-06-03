# 07 — Yerel Çalıştırma Rehberi

Bu rehber, IsikCampusOS'u yerel geliştirme ortamında ayağa kaldırmak içindir.

## 1. Önkoşullar

- **Java 21** (JDK)
- **Node.js 20+** ve **npm**
- **Docker Desktop** (Docker Compose ile altyapı için)
- **Maven** (proje `mvnw.cmd` wrapper'ı içerir)

## 2. Ortam Değişkenleri

Kök dizinde `.env` dosyası bulunur. Gerçek Gmail SMTP ile e-posta göndermek için `.env.gmail.example` örnek alınabilir:

```powershell
Copy-Item .env.gmail.example .env
```

Ardından `.env` içindeki `MAIL_PASSWORD` değerini geçerli bir Gmail App Password ile değiştirin. E-posta testini Gmail olmadan yapmak için varsayılan **Mailpit** (yerel SMTP, arayüz `:8025`) kullanılır.

> **Güvenlik notu:** `JWT_SECRET` üretimde mutlaka environment variable üzerinden verilmelidir; depodaki varsayılan yalnızca yerel geliştirme içindir.

## 3. Altyapıyı Başlatma

Yalnızca altyapı servislerini (PostgreSQL, Kafka, Zookeeper, Redis, Zipkin, Mailpit) başlatmak için:

```powershell
docker compose -f infra/docker-compose.infra.yml up -d
```

## 4. Backend Servislerini Başlatma

### Derleme
```powershell
.\mvnw.cmd -q -DskipTests compile
```

### Servisleri çalıştırma
Servisler şu sırayla ayağa kaldırılmalıdır:
1. `eureka-server` (:8761)
2. `api-gateway` (:8080)
3. `auth-service` (:8081)
4. `profile-service` (:8082)
5. `event-service` (:8089)
6. `facility-service` (:8086)

Her servis kendi dizininde Spring Boot uygulaması olarak çalıştırılabilir. Proje kökünde hazır başlatma betikleri bulunur:

```powershell
.\start-dev.ps1            # geliştirme ortamı
.\start-backend-only.ps1   # yalnızca backend
.\start-dev-headless.ps1   # arka planda
```

## 5. Frontend'i Başlatma

```powershell
cd frontend
npm install
npm run dev
```

Frontend varsayılan olarak `:5173` portunda çalışır ve API isteklerini Gateway (`:8080`) üzerinden yapar.

### Frontend build (üretim)
```powershell
cd frontend
npm run build
```

## 6. Tüm Sistemi Docker ile Başlatma

Tüm stack'i (altyapı + servisler + frontend) tek komutla:

```powershell
docker compose up --build
```

> Bu yöntem her servisin önceden `target/` altında derlenmiş jar dosyasına ihtiyaç duyar (compose, jar'ları volume olarak bağlar).

## 7. Erişim Noktaları

| Bileşen | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:8080 |
| Eureka paneli | http://localhost:8761 |
| Zipkin (tracing) | http://localhost:9411 |
| Mailpit (e-posta) | http://localhost:8025 |

## 8. Sık Karşılaşılan Sorunlar

- **Servis Eureka'ya kaydolmuyor:** Önce `eureka-server`'ın ayakta olduğundan emin olun.
- **401/403 hataları:** Token süresi dolmuş olabilir; yeniden giriş yapın. Gateway korumalı rotalarda JWT zorunludur.
- **DB bağlantı hatası:** `docker compose -f infra/docker-compose.infra.yml ps` ile PostgreSQL'in çalıştığını doğrulayın (port 5433).
- **E-posta gelmiyor:** Mailpit arayüzünü (`:8025`) kontrol edin; Gmail kullanıyorsanız App Password'ün doğru olduğundan emin olun.
