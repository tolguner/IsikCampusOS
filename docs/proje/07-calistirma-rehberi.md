# 07 — Yerel Çalıştırma Rehberi

Bu rehber, IsikCampusOS'u yerel geliştirme ortamında ayağa kaldırmak içindir.

## 1. Önkoşullar

- **Java 21** (JDK)
- **Node.js 20+** ve **npm**
- **Docker Desktop** (Docker Compose ile altyapı için)
- **Maven** (proje `mvnw.cmd` wrapper'ı içerir)

## 2. Ortam Değişkenleri

Kök dizinde `.env` dosyası bulunur (git'e gönderilmez). Şablon için `.env.example` kopyalanır:

```powershell
Copy-Item .env.example .env
```

### `POSTGRES_PASSWORD` / `SPRING_DATASOURCE_PASSWORD` (zorunlu)

Veritabanı parolasının kod içinde **varsayılanı yoktur**. Tanımlanmazsa `docker compose`
ve servisler başlatılırken hata verir (fail-fast); böylece hiçbir kurulum "herkesin
bildiği" bir parolayla çalışmaz.

```bash
openssl rand -base64 24
```

Üretilen değeri `.env` içinde **hem** `POSTGRES_PASSWORD` **hem de**
`SPRING_DATASOURCE_PASSWORD` olarak tanımlayın — ikisi aynı olmalıdır; ilki veritabanı
konteynerini, ikincisi servisleri besler.

> Var olan bir veritabanı hacmi (volume) üzerinde parolayı değiştirirseniz PostgreSQL
> eski parolayı korur; hacmi sıfırlamanız gerekir (`docker compose down -v`).

### `JWT_SECRET` (zorunlu)

`JWT_SECRET` artık **hiçbir yerde sabit varsayılana sahip değildir**; tüm servisler ve API Gateway bu değeri yalnızca ortam değişkeninden okur. Ayarlanmazsa `docker compose` ve servisler **başlatılırken hata verir** (fail-fast). Güçlü bir değer üretip `.env` içine ekleyin:

```powershell
# Bash / Git Bash
openssl rand -hex 32
```

Üretilen değeri `.env` içinde `JWT_SECRET=...` olarak tanımlayın. **Tüm servisler ve gateway aynı değeri kullanmalıdır**, aksi halde token doğrulaması başarısız olur. Yerel `mvnw` ile (docker olmadan) çalıştırırken de aynı `JWT_SECRET` ortamda tanımlı olmalıdır.

### Mail (opsiyonel)

Gerçek Gmail SMTP ile e-posta göndermek için `.env.gmail.example` örnek alınıp `.env` içindeki `MAIL_PASSWORD` geçerli bir Gmail App Password ile değiştirilir. E-posta testini Gmail olmadan yapmak için varsayılan **Mailpit** (yerel SMTP, arayüz `:8025`) kullanılır.

## 3. Altyapıyı Başlatma

Yalnızca altyapı servislerini (PostgreSQL, Kafka, Zookeeper, Redis, Zipkin, Mailpit) başlatmak için:

```powershell
docker compose -f infra/docker-compose.infra.yml up -d
```

## 4. Backend Servislerini Başlatma

### Derleme

```powershell
.\mvnw.cmd clean package -DskipTests
```

> `compile` değil **`package`** kullanın: Docker Compose her servisin `target/` altındaki
> JAR dosyasını hacim olarak bağlar, JAR üretilmezse konteynerler
> `Unable to access jarfile` hatasıyla yeniden başlama döngüsüne girer.

### Servisleri çalıştırma
Servisler şu sırayla ayağa kaldırılmalıdır:
1. `eureka-server` (:8761)
2. `api-gateway` (:8080)
3. `auth-service` (:8081)
4. `profile-service` (:8082)
5. `notification-service` (:8083)
6. `facility-service` (:8086)
7. `food-service` (:8087)
8. `ride-service` (:8088)
9. `club-service` (:8089)
10. `message-service` (:8090)

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
| notification-service | http://localhost:8083 |
| facility-service | http://localhost:8086 |
| food-service | http://localhost:8087 |
| ride-service | http://localhost:8088 |
| club-service | http://localhost:8089 |
| message-service | http://localhost:8090 |

## 8. Hesaplar ve İlk Giriş

Kurumsal roller (sistem yöneticisi, öğrenci işleri, SKS, tesis yönetimi, işletme,
destek hizmetleri) `auth-service` migration'larıyla (`V7`, `V9`, `V10`) veritabanı ilk
kez oluşturulurken otomatik eklenir. Bu hesapların **başlangıç parolaları depoda
yayımlanmaz**; yerel geliştirme kopyasında `docs/proje/DEMO-HESAPLAR.local.md`
dosyasında tutulur (git'e gönderilmez).

Depoyu yeni klonladıysanız giriş yapmak için ilgili kullanıcının parolasını kendiniz
belirlemeniz gerekir — `auth_db.kullanicilar` tablosundaki `sifre` alanına kendi
ürettiğiniz BCrypt hash'ini yazmanız yeterlidir:

```sql
UPDATE kullanicilar SET sifre = '<kendi-bcrypt-hashiniz>'
WHERE eposta = 'admin@isikun.edu.tr';
```

Öğrenci hesapları migration ile gelmez; **Öğrenci İşleri** (`ROLE_REGISTRAR`) rolüyle
giriş yapılıp panelden oluşturulur. Yeni kullanıcıların e-posta doğrulama kodları
geliştirme ortamında Mailpit arayüzüne (`:8025`) düşer.

## 9. Sık Karşılaşılan Sorunlar

- **Servis Eureka'ya kaydolmuyor:** Önce `eureka-server`'ın ayakta olduğundan emin olun.
- **401/403 hataları:** Token süresi dolmuş olabilir; yeniden giriş yapın. Gateway korumalı rotalarda JWT zorunludur.
- **DB bağlantı hatası:** `docker compose -f infra/docker-compose.infra.yml ps` ile PostgreSQL'in çalıştığını doğrulayın (port 5433). Servis açılmıyorsa `.env` içinde `SPRING_DATASOURCE_PASSWORD` tanımlı mı ve `POSTGRES_PASSWORD` ile aynı mı kontrol edin.
- **`Unable to access jarfile` / konteyner yeniden başlama döngüsü:** JAR'lar üretilmemiştir (`.\mvnw.cmd clean package -DskipTests`) ya da konteynerler proje farklı bir dizindeyken oluşturulmuştur. İkinci durumda `docker compose down` (hacimleri silmeden) ve ardından `docker compose up -d` ile konteynerleri yeniden oluşturun.
- **`Migration checksum mismatch`:** Uygulanmış bir migration dosyası sonradan değiştirilmiştir. Hata mesajındaki "Resolved locally" değerini `flyway_schema_history` tablosuna yazın; migration'lar yeniden çalışmaz, veri korunur.
- **E-posta gelmiyor:** Mailpit arayüzünü (`:8025`) kontrol edin; Gmail kullanıyorsanız App Password'ün doğru olduğundan emin olun.
