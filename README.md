# IsikCampusOS

IsikCampusOS, kampus ici sosyal koordinasyon ve hizmet erisimini tek platformda birlestiren, microservices mimarisi uzerine kurulu moduler bir dijital kampus platformudur.

Bu repo, projenin:

- urun vizyonunu
- MVP kapsam ve gereksinimlerini
- teknik mimari kararlarini
- veri modeli ve servis sinirlarini
- fazlara ayrilmis gelistirme yol haritasini

tek yerde toplamak icin baslatilmistir.

## Mimari

Sistem **microservices** mimarisini benimser:

- Her domain bagimsiz bir Spring Boot servisi olarak deploy edilir.
- Tum trafik **API Gateway** (Spring Cloud Gateway) uzerinden akar; JWT dogrulama gateway katmaninda merkezi olarak yapilir.
- Servisler arasi asenkron iletisim **Kafka** ile saglanir.
- Servis kayit ve kesif **Eureka** ile yonetilir.
- Distributed tracing **Zipkin** ile izlenir.
- Her servis kendi bagimsiz **PostgreSQL** instance'ini kullanir.
- Tum servisler tek Git deposunda (**monorepo**) `services/` dizini altinda yonetilir.
- Deployment **Docker Compose** ile yapilir.

## Servis Katalogu

| Servis | Port | Sorumluluk |
|--------|------|------------|
| `api-gateway` | 8080 | Yonlendirme, JWT dogrulama, rate limiting |
| `auth-service` | 8081 | Kimlik, token, e-posta dogrulama |
| `profile-service` | 8082 | Profil, beceri, guven skoru |
| `notification-service` | 8083 | In-app ve e-posta bildirimi |
| `moderation-service` | 8084 | Rapor, vaka, yaptirim |
| `analytics-service` | 8085 | Olay toplama, metrik, dashboard |
| `facility-service` | 8086 | Tesis rezervasyon ve check-in |
| `food-service` | 8087 | Vendor, menu, siparis |
| `ride-service` | 8088 | Paylasimli yolculuk eslestirme |
| `event-service` | 8089 | Kulup, etkinlik, RSVP |
| `projectmatch-service` | 8090 | Proje ilani, ekip eslestirme |
| `microjob-service` | 8091 | Is ilani, teklif, kontrat |

## Platform Modulleri

- Smart Facility Booking
- Campus Food Hub
- CampusRide
- Smart Event Engine
- ProjectMatch
- Campus MicroJob Marketplace

## Temel Hedef

Isik Universitesi ogrencileri icin daginik kampus sureclerini tek kimlik, tek platform ve olculebilir operasyon mantigi ile birlestirmek.

## Repo Yapisi

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
  docs/
```

## Dokumanlar

- [Urun Gereksinimleri](docs/product-spec.md)
- [Teknik Mimari](docs/architecture.md)
- [Gelisim Yol Haritasi](docs/roadmap.md)
- [Implementation Readiness](docs/implementation-readiness.md)
- [Sistem Blueprint](docs/system-blueprint.md)
- [Veritabani Tasarimi](docs/database-design.md)
- [Kullanici Akislari](docs/user-flows.md)
- [API Contract Outline](docs/api-contract-outline.md)

## Baslatma

```bash
# Sadece altyapi servislerini baslat (Kafka, Eureka, DB'ler, Zipkin)
docker compose -f infra/docker-compose.infra.yml up -d

# Tum sistemi baslat
docker compose -f infra/docker-compose.yml up --build
```

## Gmail SMTP ile Gercek E-posta

Auth servisindeki dogrulama ve sifre sifirlama kodlarini gercek Gmail hesabi uzerinden gondermek icin:

```powershell
Copy-Item .env.gmail.example .env
```

Ardindan `.env` icindeki `MAIL_PASSWORD` degerini `isikcampusos@gmail.com` hesabi icin uretilmis Gmail App Password ile degistir.

Gerekli Gmail ayarlari:

- `MAIL_USERNAME=isikcampusos@gmail.com`
- `MAIL_FROM=isikcampusos@gmail.com`
- `MAIL_HOST=smtp.gmail.com`
- `MAIL_PORT=587`
- `MAIL_SMTP_AUTH=true`
- `MAIL_SMTP_STARTTLS=true`
- `MAIL_SMTP_STARTTLS_REQUIRED=true`

`.env` dosyasi `start-dev.ps1` ve `start-backend-only.ps1` tarafindan otomatik yuklenir. Bu dosya gizli bilgi icerdigi icin git'e eklenmez.

## Sonraki Adim

Bu dokuman tabani uzerinden bir sonraki asamada asagidaki islerden birine gecebiliriz:

1. Docker Compose stack ve servis iskeletlerini olusturmak
2. api-gateway routing ve JWT konfigurasyonunu yazmak
3. auth-service ve profile-service MVP kodlarini baslatmak
4. Kafka topic tanimlarini ve ortak event modellerini olusturmak
