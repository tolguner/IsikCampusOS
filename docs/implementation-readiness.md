# IsikCampusOS Implementation Readiness

## 1. Dokumanin Amaci

Bu dokuman, IsikCampusOS projesini "fikir / taslak" seviyesinden "kodlamaya hazir urun tanimi" seviyesine tasimak icin hazirlanmistir.

Bu belge su sorulara net cevap verir:

- Sistem hangi problemleri cozer?
- Hangi kullanici, hangi modulu, hangi yetki ile kullanir?
- Hangi moduller MVP kapsamindadir?
- Hangi temel is kurallari uygulanir?
- Kodlama baslamadan once hangi teknik ve urunsel kararlar sabitlenmistir?

## 2. Urun Pozisyonlamasi

IsikCampusOS bir kampus uygulamasi degil, bir "kampus operating system" olarak konumlanir.

Platformun ana degeri:

- kampus icindeki daginik surecleri tek dijital omurgada toplamak
- ogrenci, kulup ve kampus ici isletmeler arasinda koordinasyonu hizlandirmak
- manuel surecleri olculebilir dijital akislara cevirmek
- kampus ici guveni ve izlenebilirligi artirmak

## 3. Kapsam Siniri

### In Scope

- Tekil kullanici kimligi ve rol yonetimi
- Kampus ici operasyon modulleri
- Bildirim ve guven altyapisi
- Admin ve moderasyon paneli
- Raporlama ve temel analitik

### Out of Scope

- Odeme altyapisi ile gercek para transferi
- Harici devlet / banka / sigorta entegrasyonlari
- Tam gelismis sohbet sistemi
- AI tabanli gelismis tavsiye motoru
- Universite ERP / OBS ile derin entegrasyon

Bu kalemler ileriki fazlara tasinabilir.

## 4. Kesinlestirilmis Urun Kararlari

### Mimari Kararlar

- Mimari `microservices` olacak; her domain bagimsiz bir Spring Boot servisi olarak deploy edilir.
- Repo yapisi `monorepo` — tum servisler tek Git deposunda `services/` dizini altinda yonetilir.
- Frontend `React + TypeScript` olacak ve `frontend/` dizininde konumlandirilacak.
- **Geliştirme Stratejisi:** Backend (API) ve Frontend (Arayüz) paralel ilerleyecektir. Herhangi bir modülün API'si yazıldıktan hemen sonra arayüz entegrasyonu yapılarak uçtan uca (full-stack) test edilecektir.
- Her microservice `Spring Boot + kendi PostgreSQL instance'i` kullanacak (per-service database).
- API tarzi ilk fazda `REST` olacak; servisler arasi asenkron iletisim `Kafka` uzerinden yapilacak.
- Istemci talepleri `API Gateway` (Spring Cloud Gateway) uzerinden yonlendirilecek.
- JWT dogrulama API Gateway katmaninda merkezi olarak yapilacak; downstream servisler `X-User-Id` ve `X-User-Roles` headerlari ile calisacak.
- Servis kayit ve kesif `Eureka` ile yapilacak.
- Distributed tracing `Zipkin` ile saglanacak.
- Deployment `Docker Compose` ile yapilacak.
- Tum servisler ortak bir `auth`, `profile`, `notification`, `moderation`, `analytics` omurgasina Kafka event'leri araciligiyla baglanacak.

### Urunsel Kararlar

- Kayit yalnizca universite e-postasi ile yapilacak.
- Her kullanici temel rolde `student` olarak dogacak.
- Ek roller basvuru, onay veya admin atamasi ile verilecek.
- Tum moduller ayri feature flag ile acilip kapatilabilir olacak.
- Guven puani tek bir merkezi mantik ile toplanacak, ancak her modul kendi sinyallerini uretecek.

## 5. Yetki Modeli

### Temel Roller

- `student` (ayrica kulup bazinda `admin` rolu alabilir)
- `sks_admin`
- `vendor_admin`
- `facility_admin`
- `moderator`
- `admin`

### Yetki Prensipleri

- Bir kullanici birden fazla role sahip olabilir.
- Kullanici kendi kaydini degistirebilir ama sistem rollerini degistiremez.
- Modul yoneticileri yalnizca kendi bagli nesnelerini yonetebilir.
- `student` rolundeki bir kisi, `sks_admin` tarafindan bir kulubun `admin`i olarak atanabilir.
- KURAL: Her kulubun yalnizca 1 `admin`i vardir.
- KURAL: Bir kisi ayni anda yalnizca 1 kulubun `admin`i olabilir.
- KURAL: Bir kisi birden fazla kulubun normal `member`i olabilir.
- `sks_admin` etkinlik onay/red yetkisine sahiptir; etkinlik `sks_admin` onayi olmadan yayinlanamaz.
- Moderator, icerik ve kullanici davranisi denetler ama sistem ayarlarini degistirmez.
- Admin, tum sistemi, rolleri ve analytics dashboard'u yonetir.

## 6. Ortak Is Akislari

### Kayit ve Aktivasyon

1. Kullanici universite e-postasi ile kaydolur.
2. Sistem dogrulama maili uretir.
3. Kullanici e-postayi dogrular.
4. Ilk giriste profil tamamlama zorunludur.
5. Ilgi alanlari, bolum, sinif, temel tercihler kaydedilir.
6. Kullanici ortak feed ve ilgili modullere erisim kazanir.

### Profil Tamamlama

- Temel profil: ad, soyad, bolum, sinif, avatar
- Akademik profil: yetkinlikler, ilgi alanlari, hedefler
- Guven verisi: dogrulanmis e-posta, tamamlanan aktiviteler, rating ozeti

### Bildirim Akisi

1. Bir domain olayi olusur.
2. Olay notification policy tarafindan yorumlanir.
3. Hedef kullanicilar belirlenir.
4. In-app bildirim kaydi olusur.
5. Gerekirse e-posta kuyruguna eklenir.

### Moderasyon Akisi

1. Icerik veya kullanici raporlanir.
2. Rapor kategoriye ayrilir.
3. Oncelik puani atanir.
4. Moderator inceleme yapar.
5. Sonuc: red, warning, hide, suspend veya escalate.
6. Audit log olusturulur.

## 7. Modul Bazli State Machine Ozetleri

### Facility Booking

- booking_status:
  - `draft`
  - `pending`
  - `confirmed`
  - `cancelled`
  - `completed`
  - `no_show`
- checkin_status:
  - `pending`
  - `checked_in`
  - `failed`

Kurallar:

- Ayni slotta ayni tesise cakisan iki aktif rezervasyon olamaz.
- Kullanici aktif rezervasyon limiti asamaz.
- Belirlenen sure icinde check-in yapilmadiysa rezervasyon `no_show` olabilir.

### Food Hub

- order_status:
  - `draft`
  - `placed`
  - `accepted`
  - `preparing`
  - `ready`
  - `picked_up`
  - `cancelled`
  - `refunded`

Kurallar:

- Siparis kapandiktan sonra urun degisikligi kisitli olur.
- Teslim slot kapasitesi doluysa yeni siparis alinmaz.
- Vendor yalnizca kendi siparislerini yonetir.

### CampusRide

- ride_offer_status:
  - `draft`
  - `open`
  - `matched`
  - `closed`
  - `cancelled`
- ride_request_status:
  - `open`
  - `matched`
  - `expired`
  - `cancelled`
- ride_match_status:
  - `proposed`
  - `accepted`
  - `rejected`
  - `cancelled`
  - `completed`

Kurallar:

- Surucu kontenjan ust siniri tanimlar.
- Yolcu kabul edilmeden kesin koltuk sahibi olmaz.
- Yolculuk sonrasi cift tarafli puanlama guven skoruna etki eder.

### Event Engine

- event_status:
  - `draft`
  - `pending_sks_approval`
  - `rejected`
  - `published`
  - `full`
  - `completed`
  - `cancelled`
- rsvp_status:
  - `going`
  - `maybe`
  - `not_going`
  - `waitlisted`

Kurallar:

- Yalniz `club_admin` etkinlik taslagi olusturabilir.
- Etkinlik yayinlanmadan once `sks_admin` onayi zorunludur.
- `sks_admin` etkinligi reddederse sebep notu eklenir.
- RSVP kapasitesi doldugunda bekleme listesi opsiyoneldir.
- Check-in verisi attendance raporunu besler.

### ProjectMatch

- project_status:
  - `draft`
  - `open`
  - `in_review`
  - `closed`
  - `archived`
- invite_status:
  - `pending`
  - `accepted`
  - `declined`
  - `expired`
  - `revoked`

Kurallar:

- Skill profile eksikse uyum skoru hesaplanmaz.
- Davet kabul edilmeden takima kesin uye eklenmez.
- Takim kapasitesi dolduysa yeni kabul yapilamaz.

### MicroJob Marketplace

- job_status:
  - `draft`
  - `open`
  - `in_review`
  - `awarded`
  - `in_progress`
  - `completed`
  - `cancelled`
  - `expired`
- contract_status:
  - `pending`
  - `active`
  - `paused`
  - `completed`
  - `cancelled`
  - `disputed`

Kurallar:

- Is sahibi acik is icin teklif toplar.
- Teklif kabul edilince kontrat olusur.
- Teslim sonrasi onay veya itiraz penceresi bulunur.

## 8. Ortak Guven Kurallari

- Universite e-posta dogrulamasi minimum guven kosuludur.
- Rating, report ve completion verileri merkezi trust skoruna katkida bulunur.
- Tek bir kotu olay kullaniciyi tamamen bloklamaz; esik bazli degerlendirme uygulanir.
- Kritik alanlarda dusuk trust skoruna sahip kullanicilara kisit uygulanabilir.

Ornek kisitlar:

- ride ilan limiti
- aktif mikro is limiti
- rezervasyon ust limiti

## 9. Analitik Omurgasi

Her modulde iki veri seviyesi uretilir:

- operasyonel veri
- urun analitigi eventi

Temel event ornekleri:

- `user.registered`
- `profile.completed`
- `booking.created`
- `booking.cancelled`
- `order.created`
- `ride.offer.created`
- `event.rsvp.created`
- `project.invite.accepted`
- `job.closed`

Temel dashboard gruplari:

- kullanim
- donusum
- doluluk
- memnuniyet
- guven / abuse

## 10. MVP Kesin Siniri

Kodlamaya hazir MVP kapsaminda yer alacak alanlar:

- auth
- profile
- notification
- moderation basics
- analytics basics
- smart event engine
- smart facility booking
- projectmatch

MVP sonrasi ikinci dalga:

- food hub
- campusride
- microjob marketplace

Bu tercih kapsam kontrolu ve gelistirme hizini korumak icin sabitlenmistir.

## 11. API Hazirlik Beklentisi

Her modul icin en az su kaynaklar tanimlanmalidir:

- listeleme endpointleri
- detay endpointleri
- olusturma endpointleri
- durum guncelleme endpointleri
- filtreleme ve sayfalama

Ortak zorunluluklar:

- JWT tabanli auth
- rol ve ownership kontrolu
- standart hata modeli
- request validation
- audit log tetikleme

## 12. Kodlamaya Baslamadan Once Hazir Olmasi Gerekenler

### Zorunlu

- ER modelinin netlesmesi
- enum ve status listelerinin sabitlenmesi
- rol matrisinin sabitlenmesi
- MVP modullerinin dondurulmesi
- API naming convention karari
- UI navigation agacinin netlesmesi

### Fayda Saglayacak

- wireframe seti
- admin panel ekran listesi
- notification template listesi
- raporlama KPI tablosu

## 13. Onerilen Kodlama Sirasi

1. Altyapi kurulumu: Docker Compose dosyalari, Eureka, Config Server, Kafka, Zipkin
2. api-gateway: routing, JWT dogrulama, X-User header injection
3. auth-service: kayit, giris, e-posta dogrulama, token uretimi
4. profile-service: `user.registered` event'i ile otomatik profil olusturma, profil CRUD
5. notification-service: Kafka consumer, in-app ve e-posta dagitimi
6. moderation-service: rapor alma, vaka yonetimi
7. analytics-service: event capture, gunluk metrik
8. event-service: kulup, etkinlik, RSVP, SKS onay akisi
9. facility-service: tesis, rezervasyon, check-in
10. projectmatch-service: skill profili, proje ilani, davet
11. food-service, ride-service, microjob-service (ikinci dalga)

## 14. Kabul Kriteri

Bu proje teorik olarak kodlamaya hazir sayilacaktir, eger:

- her modulun aktorleri ve akislari tanimliysa
- tablo ve iliski modeli belirliyse
- rol ve yetki kurallari netse
- durum makineleri belliyse
- MVP siniri sabitse
- ortak servislerin sorumlulugu ayrilmissa

Bu belge ve bagli dokumanlar birlikte bu hazirlik seviyesine ulasmak icin kullanilacaktir.
