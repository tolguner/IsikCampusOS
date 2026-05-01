# IsikCampusOS Yapilacaklar ve Teknik Yol Haritasi

Bu dosya, mevcut proje analizi sonucunda ortaya cikan teknik borclari, eksik parcalari ve ilerleme siralamasini uygulanabilir bir is listesi olarak toplar. Amac, projeyi dokumanlarda tarif edilen vizyondan calisan ve genisleyebilir MVP seviyesine tasimaktir.

## 1. Mevcut Durum Ozeti

IsikCampusOS dokumantasyon tarafinda genis kapsamli bir microservices dijital kampus platformu olarak tasarlanmis durumda. Mevcut kod tabani ise bu vizyonun erken MVP parcasini iceriyor.

Calisan veya iskeleti bulunan ana parcalar:

- `eureka-server`
- `api-gateway`
- `auth-service`
- `profile-service`
- `event-service`
- `frontend`
- Docker Compose altyapisi: PostgreSQL, Kafka, Zookeeper, Redis, Zipkin

Henuz implement edilmemis ama dokumanlarda planlanan servisler:

- `notification-service`
- `moderation-service`
- `analytics-service`
- `facility-service`
- `food-service`
- `ride-service`
- `projectmatch-service`
- `microjob-service`

## 2. Onceliklendirilmis Yol Haritasi

## Faz 1 - Derlenebilir ve Tutarlı MVP Temeli

Bu fazin amaci, var olan kodun guvenilir sekilde build almasi ve servisler arasi temel sozlesmelerin tutarli hale gelmesidir.

### 1.1 Frontend TypeScript Build Hatalarini Duzelt

Mevcut durumda `npm run build` basarisiz oluyor. Ana neden, frontend `User` tipinin UI tarafinda kullanilan alanlari icermemesi.

Yapilacaklar:

- `frontend/src/store/authStore.ts` icindeki `User` interface'ine eksik alanlari ekle:
  - `firstName`
  - `lastName`
  - `faculty`
  - `department`
  - `enrollmentYear`
- Login response tarafinda backend bu alanlari donmuyorsa iki secenekten biri uygulanmali:
  - Backend `AuthResponse` bu alanlari donecek sekilde genisletilmeli.
  - Frontend bu alanlari opsiyonel okuyup fallback uretmeli.
- Kullanilmayan importlar temizlenmeli:
  - `AppLayout.tsx` icindeki `LogOut`, `GraduationCap`
  - `SettingsPage.tsx` icindeki kullanilmayan importlar
- Lucide ikonlarina dogrudan `title` prop verilmemeli; gerekirse `aria-label`, wrapper veya tooltip kullanilmali.

Kabul kriteri:

- `cd frontend && npm run build` hatasiz tamamlanmali.

### 1.2 Auth ve Profile Kafka Topic Uyumsuzlugunu Gider

`auth-service` ogrenci olusturunca `student.created` topic'ine event gonderiyor. `profile-service` ise `user.registered` topic'ini dinliyor. Bu nedenle otomatik profil olusturma calismayabilir.

Yapilacaklar:

- Tek bir event adi secilmeli.
- Onerilen ad: `user.registered`
- `StudentManagementService` icinde `student.created` yerine `user.registered` kullanilmali.
- Alternatif olarak `profile-service` hem `user.registered` hem `student.created` dinleyecek sekilde genisletilebilir.
- Event payload icin ortak minimum sozlesme sabitlenmeli:
  - `userId`
  - `email`
  - `firstName`
  - `lastName`
  - `studentNumber`

Kabul kriteri:

- Registrar panelinden yeni ogrenci olusturuldugunda `profile_db.profiles` icinde otomatik profil kaydi olusmali.

### 1.3 Backend API Response Modellerini Frontend ile Uyumlu Hale Getir

Frontend, kullanici bilgilerini login response icinde genis sekilde kullanmak istiyor. Backend ise su anda daha sinirli veri donuyor.

Yapilacaklar:

- `AuthResponse` modeli gozden gecirilmeli.
- UI'da kullanilan alanlar backend response'a eklenmeli veya frontend bu alanlari `profile-service` uzerinden cekmeli.
- Tercih edilen MVP yaklasimi:
  - Login response temel auth bilgilerini dondursun.
  - Profil ve akademik detaylar `/api/v1/profiles/me` veya auth-service icindeki uygun endpoint'ten cekilsin.
- Frontend tarafinda login sonrasi kullanici state'i tutarli hale getirilmeli.

Kabul kriteri:

- Login sonrasi dashboard, navbar ve profil sayfasi TypeScript hatasi ve runtime hata olmadan acilmali.

## Faz 2 - Guvenlik ve Yetkilendirme Sertlestirme

Bu faz, MVP'nin gercek kullanima daha yakin hale gelmesi icin kritik.

### 2.1 Event Service Rol Kontrollerini Tamamla

`event-service` icinde bazi kritik endpointler yorum seviyesinde korunuyor ama kod seviyesinde rol kontrolu eksik.

Riskli alanlar:

- Event approve
- Event check-in
- Club admin aksiyonlari
- SKS admin aksiyonlari

Yapilacaklar:

- Gateway'in ekledigi `X-User-Roles` header'i controller veya service seviyesinde okunmali.
- `approveEvent` yalnizca `ROLE_SKS_ADMIN` veya `ROLE_ADMIN` ile calismali.
- `checkInUser` yalnizca ilgili kulubun admini veya yetkili rol ile calismali.
- Yetkisiz isteklerde 403 donmeli.

Kabul kriteri:

- Normal student token'i ile event approve denenince 403 donmeli.
- SKS/admin token'i ile approve basarili olmali.

### 2.2 Gateway Auth Stratejisini Netlestir

Gateway su anda `/profiles`, `/events`, `/clubs` route'larinda auth filtresi kullaniyor. Gelecek servisler icin ayni kural standart hale getirilmeli.

Yapilacaklar:

- Public endpoint listesi belirlenmeli.
- Public olmayan tum route'lar `AuthenticationFilter` ile korunmali.
- `auth-service` icinde de sadece gerekli endpointler public kalmali:
  - login
  - forgot-password
  - reset-password
  - verify-email
- Gateway ve service-level security arasindaki sorumluluk netlestirilmeli.

Kabul kriteri:

- Token olmadan protected endpointler 401 donmeli.
- Token varsa downstream servise `X-User-Id` ve `X-User-Roles` ulasmali.

### 2.3 JWT Secret ve Config Degerlerini Disari Al

JWT secret hem auth-service hem gateway icinde kodda sabit.

Yapilacaklar:

- Secret degeri environment variable veya merkezi config ile okunmali.
- Lokal dev icin fallback olabilir ama production default olmamali.
- `application.yml` dosyalarinda ortak property adi belirlenmeli:
  - `security.jwt.secret`
  - `security.jwt.expiration`

Kabul kriteri:

- Secret kod icinde hard-coded kalmamali.
- Gateway ve auth-service ayni secret'i config uzerinden okumali.

## Faz 3 - Veri Modeli ve Migration Disiplini

### 3.1 `ddl-auto: update` Yerine Migration Yapisi Kur

Mevcut servislerde Hibernate `ddl-auto: update` kullaniyor. Bu hizli prototipleme icin iyi ama surdurulebilir degil.

Yapilacaklar:

- Flyway veya Liquibase secilmeli.
- Oneri: Flyway ile baslamak.
- Her serviste `src/main/resources/db/migration` dizini olusturulmali.
- Ilk migration dosyalari yazilmali:
  - auth-service: users, verification_codes
  - profile-service: profiles
  - event-service: clubs, club_members, events, rsvps
- `ddl-auto` dev disinda kapatilmali.

Kabul kriteri:

- Bos database ile servisler migration calistirarak ayağa kalkmali.
- Tablo yapisi Hibernate update'e bagimli olmamali.

### 3.2 Entity Modellerini Dokumanlarla Uyumlu Hale Getir

Mevcut entity'ler MVP icin sade tutulmus. Dokumanlardaki hedef model daha kapsamli.

Yapilacaklar:

- `User` modeli ile dokumandaki auth schema karsilastirilmali.
- `Profile` modeli skill/interests/links gibi alanlara hazir hale getirilmeli.
- `Event` modeli `approvedBy`, `approvedAt`, `rejectionReason`, `visibility`, `capacity` gibi alanlarla genisletilmeli.
- `Rsvp` icin unique constraint eklenmeli:
  - `eventId + userId`
- `ClubMember` icin unique constraint eklenmeli:
  - `clubId + userId`

Kabul kriteri:

- Duplicate RSVP ve duplicate club membership DB seviyesinde de engellenmeli.

## Faz 4 - Test Altyapisi

Su anda servislerde test dosyasi bulunmuyor.

### 4.1 Backend Unit ve Integration Testleri Ekle

Oncelik verilecek testler:

- Auth login basarili/basarisiz
- Password change
- Student create
- Student status transition
- Profile event consumer idempotency
- Event RSVP capacity/waitlist
- Event approve authorization

Kabul kriteri:

- `mvn test` calismali.
- Kritik business rule'lar test ile korunmali.

### 4.2 Frontend Smoke Testleri Ekle

Onerilen araclar:

- Vitest
- React Testing Library
- Playwright ileriki fazda e2e icin

Oncelik verilecek senaryolar:

- Login form render
- Auth store login hata durumu
- Protected route redirect
- Registrar dashboard table render

Kabul kriteri:

- Frontend icin temel test komutu tanimli olmali.

## Faz 5 - Eksik MVP Servisleri

Dokumanlara gore MVP icinde en az su servislerin gelmesi bekleniyor:

- notification-service
- moderation-service basics
- analytics-service basics
- facility-service
- projectmatch-service

Ancak mevcut durum dikkate alindiginda onerilen siralama:

1. notification-service skeleton
2. event-service tamamlanmasi
3. facility-service MVP
4. analytics-service event capture
5. moderation-service report basics
6. projectmatch-service MVP

### 5.1 Notification Service Skeleton

Yapilacaklar:

- Kafka consumer altyapisi
- Notification entity
- In-app notification endpointleri:
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/{id}/read`
- `event.published`, `event.rsvp.promoted` gibi eventleri dinleme

Kabul kriteri:

- Event yayinlaninca ilgili kullanicilar icin notification kaydi olusmali.

### 5.2 Facility Service MVP

Yapilacaklar:

- Facility
- Resource
- Booking
- Availability rule
- Conflict check
- Booking cancel

Kabul kriteri:

- Ayni kaynak ve ayni zaman araliginda iki aktif rezervasyon olusmamali.

## Faz 6 - Frontend Urun Akislarini Tamamlama

Frontend su anda auth ve registrar agirlikli.

Eksik ana ekranlar:

- Event feed
- Event detail
- RSVP / cancel RSVP
- Club detail
- Facility list
- Booking flow
- Notification dropdown
- Role-based dashboard ayrimi

Yapilacaklar:

- API base URL tek yerde toplanmali.
- Su anda auth ve student store direkt `8081` kullanıyor. Gateway uzerinden calisma hedefleniyorsa base URL `8080` olmalı.
- Axios interceptor token ekliyor, bu iyi; ama hata handling ve logout-on-401 eklenmeli.
- Role bazli navigation netlestirilmeli.

Kabul kriteri:

- Ogrenci kullanici login olduktan sonra event feed gorebilmeli.
- Registrar kullanici ogrenci paneline yonlenmeli.
- Yetkisiz kullanici admin ekranlarini gorememeli.

## 3. Kritik Teknik Borclar

Bu maddeler proje buyumeden once ele alinmali.

- Frontend build kirik.
- Auth-profile Kafka event topic uyumsuz.
- Role authorization eksik.
- JWT secret hard-coded.
- Migration yok.
- Test yok.
- Docker Compose dokumanlarla birebir uyumlu degil.
- Tek PostgreSQL container icinde coklu DB var; bu dev icin uygun ama dokumandaki per-service instance hedefinden farkli.
- Turkish text encoding terminalde bozuk gorunuyor; dosya encoding ve frontend render kontrol edilmeli.
- Gateway route listesi dokumanlardaki servis kataloguna gore eksik.

## 4. Onerilen Ilk 10 Is

1. Frontend TypeScript build hatalarini gider.
2. `User` modeli ve `AuthResponse` uyumunu sagla.
3. `student.created` / `user.registered` topic kararini ver ve uygula.
4. Event approve endpointine rol kontrolu ekle.
5. Check-in endpointine kulup admini veya yetkili rol kontrolu ekle.
6. JWT secret'i config/env uzerinden oku.
7. Flyway migration altyapisini auth-service icin baslat.
8. Auth-service icin temel unit testleri ekle.
9. Profile event consumer icin idempotency testi ekle.
10. Frontend API base URL stratejisini gateway merkezli hale getir.

## 5. Orta Vadeli Teknik Hedef

Projenin saglikli MVP seviyesine gelmesi icin hedef durum:

- Backend ve frontend build komutlari temiz geciyor.
- Gateway uzerinden tek giris noktasi var.
- Auth, profile ve event servisleri entegre calisiyor.
- Yeni ogrenci olusturulunca profil otomatik olusuyor.
- Event olusturma, onaylama, yayinlama, RSVP ve waitlist akisi calisiyor.
- Temel bildirim servisi Kafka eventlerinden notification uretiyor.
- Kritik business rule'lar testlerle korunuyor.
- Database schema migration ile yonetiliyor.

## 6. Komut Kontrol Listesi

Backend derleme:

```bash
.\mvnw.cmd -q -DskipTests compile
```

Backend testleri:

```bash
.\mvnw.cmd test
```

Frontend build:

```bash
cd frontend
npm run build
```

Frontend dev server:

```bash
cd frontend
npm run dev
```

Altyapi:

```bash
docker compose -f infra/docker-compose.infra.yml up -d
```

## 7. Karar Bekleyen Konular

Bu konular teknik ilerleme sirasinda netlestirilmeli:

- Java hedefi Java 21 mi kalacak, Java 25 mi olacak?
- Frontend API istekleri direkt servislere mi, gateway'e mi gidecek?
- Register flow kullanici tarafindan self-service mi olacak, yoksa ogrenci isleri tarafindan hesap acma modeli mi kalacak?
- `club_admin` sistem rolu mu olacak, yoksa club membership domain rolu mu?
- Notification servisinin ilk fazi sadece in-app mi olacak, e-posta da dahil mi?
- PostgreSQL dev ortaminda tek container coklu DB olarak mi kalacak, yoksa her servis icin ayri container'a gecilecek mi?

## 8. Sonuc

IsikCampusOS'un dokumantasyon temeli guclu, urun vizyonu net ve mevcut kod tabani bu vizyonun ilk calisan parcalarini barindiriyor. En dogru ilerleme, yeni modul eklemeden once var olan MVP cekirdegini derlenebilir, guvenli, test edilebilir ve servisler arasi tutarli hale getirmektir.

Once build ve sozlesme uyumsuzluklari giderilmeli; ardindan authorization, migration ve test altyapisi kurulmalidir. Bundan sonra notification, facility ve projectmatch gibi yeni moduller cok daha kontrollu eklenebilir.
