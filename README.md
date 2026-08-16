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
| `notification-service` | 8083 | In-app bildirim, SSE, Kafka bildirim olaylari |
| `facility-service` | 8086 | Tesis rezervasyon ve check-in |
| `food-service` | 8087 | Satici, menu, kampanya, siparis, isletme paneli |
| `ride-service` | 8088 | Paylasimli yolculuk, rota, arac/ehliyet dogrulama |
| `club-service` | 8089 | Kulup, etkinlik, RSVP |
| `message-service` | 8090 | Baglam bazli konusma ve mesajlasma |

Planlanan servisler: `projectmatch-service`, `microjob-service`. Moderasyon ve analitik ileride ayri servisler olarak degerlendirilebilir.

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
    facility-service/
    food-service/
    ride-service/
    club-service/
    message-service/
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
docker compose up --build
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

## Guncel Durum

`auth`, `profile`, `club`, `notification`, `facility`, `food`, `ride` ve `message` servisleri kod tabaninda mevcuttur ve API Gateway uzerinden route edilir. Frontend; giris, rol bazli paneller, kulup/etkinlik, tesis, yemek, CampusRide, bildirim ve mesajlasma ekranlarini icerir.

Frontend uretim derlemesi rota bazli kod bolunmesi kullanir: her sayfa `React.lazy` ile kendi chunk'ina ayrilir, `xlsx` gibi agir kutuphaneler ise yalnizca kullanildiklari anda dinamik olarak indirilir. Ilk acilista inen paket 1.66 MB'tan ~445 kB'a (gzip ~141 kB) dusmustur.

Siradaki ana genisleme adaylari `projectmatch-service` ve `microjob-service`tir. Kisa vadeli teknik odak ise mevcut servislerin test kapsamini ve dokuman tutarliligini iyilestirmektir. Frontend tarafinda ESLint hala temiz degildir (`npm run lint` cogunlukla `react-hooks` ve `no-explicit-any` kaynakli hatalar uretir); bu ayri bir temizlik isidir.
