# IsikCampusOS Lokal Calistirma Rehberi

Bu rehber projeyi Codex olmadan kendi bilgisayarinda baslatmak icindir.

## Gerekenler

- Docker Desktop acik olmali.
- Node.js ve npm kurulu olmali.
- Java 21 kurulu olmali.
- Proje klasoru: `C:\Users\tolga\Desktop\IsikCampusOS`

## Tek Komutla Baslatma

PowerShell ac ve proje klasorune gir:

```powershell
cd C:\Users\tolga\Desktop\IsikCampusOS
```

Eger PowerShell script calistirmaya izin vermezse once su komutu calistir:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Sonra projeyi baslat:

```powershell
.\start-dev.ps1
```

Bu script sirasiyla:

- Docker altyapisini baslatir: Postgres, Kafka, Redis, Zipkin, Mailpit
- Backend servislerini derler
- Eureka Server'i baslatir
- API Gateway'i baslatir
- Auth, Profile ve Event servislerini baslatir
- Frontend'i baslatir

## Acilacak Adresler

- Uygulama arayuzu: `http://localhost:8080/`
- Alternatif frontend adresi: `http://localhost:5173/login`
- API Gateway: `http://localhost:8080`
- Eureka paneli: `http://localhost:8761`
- Mailpit paneli: `http://localhost:8025`
- Zipkin paneli: `http://localhost:9411`

## Gmail ile Gercek Mail

Gercek mail gonderimi icin `.env` dosyasinin proje kokunde bulunmasi gerekir.

Dosya yoksa:

```powershell
Copy-Item .env.gmail.example .env
```

Sonra `.env` icindeki `MAIL_PASSWORD` degerini Gmail App Password ile doldur.

Gizli bilgi oldugu icin `.env` dosyasini git'e ekleme.

## Calisip Calismadigini Kontrol Etme

Portlari kontrol etmek icin:

```powershell
Get-NetTCPConnection -LocalPort 5173,8080,8081,8082,8089,8761,5433,6379,9092,8025 -State Listen
```

Beklenen ana portlar:

- `5173`: Frontend
- `8080`: API Gateway
- `8081`: Auth Service
- `8082`: Profile Service
- `8089`: Event Service
- `8761`: Eureka
- `5433`: Postgres
- `6379`: Redis
- `9092`: Kafka
- `8025`: Mailpit UI

## En Sik Sorunlar

### Docker kapaliysa

Docker Desktop'i ac, tamamen hazir olmasini bekle, sonra tekrar:

```powershell
.\start-dev.ps1
```

### Kafka acilmazsa

```powershell
docker compose -f .\infra\docker-compose.infra.yml restart zookeeper kafka
```

### 8080 bos veya siyah ekran gibi gorunurse

Once frontend'in ayakta oldugunu kontrol et:

```powershell
Invoke-WebRequest http://localhost:5173/login -UseBasicParsing
```

Sonra tarayicida:

```text
http://localhost:8080/
```

veya:

```text
http://localhost:5173/login
```

adresini ac.

### Eski servisler takili kalirsa

Ilgili portu kullanan sureci bul:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
```

Gerekirse PID ile kapat:

```powershell
Stop-Process -Id PID_DEGERI -Force
```

Sonra tekrar baslat.

## Kapatma

Backend ve frontend icin acilan terminal pencerelerini kapatabilirsin.

Docker altyapisini durdurmak icin:

```powershell
docker compose -f .\infra\docker-compose.infra.yml stop
```

Verileri de tamamen silmek istersen dikkatli kullan:

```powershell
docker compose -f .\infra\docker-compose.infra.yml down
```

