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
| `eureka-server` | 8761 | Servis kayit ve kesif |
| `api-gateway` | 8080 | Yonlendirme, JWT dogrulama, rate limiting |
| `auth-service` | 8081 | Kimlik, token, e-posta dogrulama |
| `profile-service` | 8082 | Profil, beceri, guven skoru |
| `notification-service` | 8083 | In-app bildirim, SSE, Kafka bildirim olaylari |
| `facility-service` | 8086 | Tesis rezervasyon ve check-in |
| `food-service` | 8087 | Satici, menu, kampanya, siparis, isletme paneli |
| `ride-service` | 8088 | Paylasimli yolculuk, rota, arac/ehliyet dogrulama |
| `club-service` | 8089 | Kulup, etkinlik, RSVP |
| `message-service` | 8090 | Baglam bazli konusma ve mesajlasma |

`common-security` bir servis degil, servisler arasinda paylasilan JWT/yetki kutuphanesidir.

## Platform Modulleri

Gerceklestirilen moduller:

- Smart Event Engine (kulup, etkinlik, RSVP, QR check-in, sertifika)
- Smart Facility Booking (cakismasiz tesis rezervasyonu, yoklama)
- Campus Food Hub (menu, kampanya, siparis, isletme paneli)
- CampusRide (planli paylasimli yolculuk, hibrit konum, cift yonlu puan)

Tasarim duzeyinde ele alinan, gerceklestirimi gelecek calismaya birakilan moduller:

- ProjectMatch (etiket tabanli proje eslestirme)
- Campus MicroJob Marketplace (kampus ici mikro is pazari)

Bu iki modulun tasarimi tezin 6.3 (Gelecek Calismalar) bolumunde ele alinmistir; kod tabaninda karsiliklari yoktur.

## Temel Hedef

Isik Universitesi ogrencileri icin daginik kampus sureclerini tek kimlik, tek platform ve olculebilir operasyon mantigi ile birlestirmek.

## Repo Yapisi

```text
isikcampusos/
  services/
    eureka-server/
    api-gateway/
    common-security/
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
    docker-compose.infra.yml   # yalnizca altyapi (DB, Kafka, Zipkin, Mailpit)
    init.sql
  docs/
    proje/                     # teknik dokumantasyon
    tez/                       # bitirme tezi
  docker-compose.yml           # tum sistem
```

## Dokumanlar

Tum dokumanlarin dizini: [docs/00-INDEKS.md](docs/00-INDEKS.md)

Proje dokumantasyonu:

- [Genel Bakis ve Vizyon](docs/proje/01-genel-bakis-ve-vizyon.md)
- [Mimari](docs/proje/02-mimari.md)
- [Veritabani Tasarimi](docs/proje/03-veritabani-tasarimi.md)
- [API Sozlesmesi](docs/proje/04-api-sozlesmesi.md)
- [Roller ve Yetkiler](docs/proje/05-roller-ve-yetkiler.md)
- [Kullanici Akislari](docs/proje/06-kullanici-akislari.md)
- [Calistirma Rehberi](docs/proje/07-calistirma-rehberi.md)
- [Yol Haritasi ve Durum](docs/proje/08-yol-haritasi-ve-durum.md)

Bitirme tezi ve afis:

- [Bitirme Tezi (Word)](docs/tez/IsikCampusOS_Tez.docx) — tezin tam metni
- [Bitirme Projesi Afisi (PDF)](docs/afis.pdf)

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

Kisa vadeli teknik odak, mevcut servislerin test kapsamini ve dokuman tutarliligini iyilestirmektir. Frontend tarafinda ESLint hala temiz degildir (`npm run lint` cogunlukla `react-hooks` ve `no-explicit-any` kaynakli hatalar uretir); bu ayri bir temizlik isidir.

## Kapsam Disi ve Gelecek Calismalar

Asagidaki basliklar tez kapsaminda bilincli olarak kapsam disi birakilmistir ve gelecek calisma olarak konumlanir (bkz. tez Bolum 6.2 ve 6.3):

- **ProjectMatch ve MicroJob servisleri** — tasarimi yapildi, gerceklestirimi yapilmadi. Mevcut servislerin sablonu izlenerek `projectmatch-service` ve `microjob-service` olarak, kendi veri tabanlariyla (`projectmatch_db`, `microjob_db`) eklenmeleri planlanmistir.
- **Yerel (native) mobil uygulama** — platform web tabanlidir; mobil uygulama gelistirilmemistir.
- **Gercek odeme agi gecidi entegrasyonu** — odeme akislari uygulama ici durum takibi ile sinirlidir.
- **SIS/LMS canli veri entegrasyonu** ve fiziksel donanim/IoT baglantilari.
- **Saha calismasi ve ampirik degerlendirme** — degerlendirme islevsel dogrulama ve senaryo temelli inceleme ile sinirlidir.
- **Uretim olcegi operasyonel olgunluk** — yuk testi, gozlemlenebilirlik, coklu kampus (multi-tenant) destegi.

Moderasyon ve analitik yetenekleri de ileride ayri servisler olarak degerlendirilebilir.
