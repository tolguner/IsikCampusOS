# 03 — Veritabanı Tasarımı

## 1. Strateji

Mikroservis mimarisinin **servis başına veritabanı (database-per-service)** ilkesi benimsenmiştir. Her servis kendi veritabanına sahiptir ve başka bir servisin tablolarına doğrudan SQL ile erişmez. Servisler arası veri ihtiyacı API çağrısı veya Kafka olayı ile karşılanır.

Geliştirme ortamında tek bir PostgreSQL container içinde birden çok veritabanı oluşturulur (`infra/init.sql`). Şema yönetimi şu an Hibernate `ddl-auto` ile yapılmaktadır; ileride Flyway/Liquibase migration disiplinine geçiş planlanmaktadır.

## 2. Veritabanı Dağılımı

| Veritabanı | Servis | Durum |
|------------|--------|-------|
| `auth_db` | auth-service | ✅ Kullanımda |
| `profile_db` | profile-service | ✅ Kullanımda |
| `event_db` | event-service | ✅ Kullanımda |
| `facility_db` | facility-service | ✅ Kullanımda |
| `food_db`, `ride_db`, `projectmatch_db`, `microjob_db` | (planlanan servisler) | 🔵 `init.sql`'de oluşturulur, henüz kullanılmaz |
| `notification_db`, `moderation_db`, `analytics_db` | (ayrı servis yok) | 🔵 Rezerve |

> `infra/init.sql` 11 veritabanı oluşturur; bunların yalnızca 4'ü fiilen kullanılmaktadır. Diğerleri gelecekteki servisler için rezervedir.

## 3. Çalışan Veri Modeli (kodlanmış entity'ler)

Aşağıdaki varlıklar koddaki gerçek JPA entity'lerine dayanır (`com.isik.kampusos.*.model`).

### 3.1. auth_db (auth-service)

- **Kullanici** — ana kullanıcı kaydı: e-posta, şifre (bcrypt), ad/soyad, roller, öğrenci numarası, fakülte/bölüm/kayıt yılı, durum, e-posta doğrulama ve zorunlu şifre değiştirme bayrakları.
- **DogrulamaKodu** — e-posta doğrulama ve şifre sıfırlama kodları.
- **SertifikaTeslimatGunlugu** — sertifika teslimat kayıtları.
- *(enum)* **KullaniciDurumu** — kullanıcı durumu (aktif/pasif vb.).

### 3.2. profile_db (profile-service)

- **Profil** — kullanıcı profili: ad, soyad, öğrenci numarası, fakülte, bölüm, kayıt yılı, avatar vb.
- **ProfilDegisiklikIstegi** — profil değişiklik talebi ve onay akışı.
- *(enum)* **ProfilDegisiklikIstegiDurumu**.

### 3.3. event_db (event-service)

Bu servis kulüp, etkinlik ve bildirim domainlerini birlikte taşır:

- **Kulup** — kulüp profili: ad, kısa açıklama, vizyon, logo, yönetici (başkan) kullanıcı, danışman bilgileri, aktiflik, soft-delete.
- **KulupUyesi** — kulüp üyeliği: kullanıcı, rol (YONETICI/UYE), durum (AKTIF/BEKLEMEDE vb.).
- **KulupDuyurusu** — kulüp duyuruları.
- **KulupSaglikKaydi** — kulüp sağlık/aktiflik kaydı.
- **KulupProfilDegisiklikIstegi** — kulüp profil güncelleme onay akışı.
- **Etkinlik** — etkinlik: başlık, açıklama, tarih, kapasite, durum (taslak/onay bekleyen/yayında vb.), onaylayan, QR check-in ve sertifika bilgileri.
- **EtkinlikDegisiklikIstegi** — etkinlik değişiklik onay akışı.
- **EtkinlikKatilimi** — RSVP / katılım kaydı, check-in durumu.
- **Bildirim** / **BildirimOkuma** — in-app bildirim ve okundu takibi.
- **AkademikKadro** — kulüp danışmanı olarak atanabilecek akademik personel kaydı.
- **DenetimGunlugu** — kritik aksiyonların audit log kaydı.

### 3.4. facility_db (facility-service)

- **Tesis** — tesis tanımı.
- **TesisKaynagi** — tesise bağlı kaynak (saha, oda vb.).
- **TesisRezervasyon** — rezervasyon kaydı.
- **TesisPolitikasi** — rezervasyon politikaları.
- **TesisKullanilabilirlikKurali** — uygunluk/slot kuralları.
- **RezervasyonYoklama** — check-in / yoklama kaydı.

## 4. Ortak Veri Standartları

- **Birincil anahtar:** UUID temelli kimlikler (dağıtık ortamda çakışmasız).
- **Soft-delete:** Kritik tablolarda fiziksel silme yerine mantıksal silme (`silindi` / `silinmeTarihi`).
- **Denetim izi:** Kritik aksiyonlar `DenetimGunlugu` üzerinden kayıt altına alınır.
- **Referanslar:** Modüller başka servisteki kullanıcıyı `kullaniciId` referansıyla tutar; kullanıcı nesnesini kopyalamaz.

## 5. Planlanan Modüllerin Veri Modeli (taslak)

Aşağıdaki modeller **henüz kodlanmamıştır**; ilgili servisler geliştirildiğinde tasarlanacaktır:

- **food_db:** vendor, menu_item, order, order_item, pickup_slot
- **ride_db:** ride_offer, ride_request, ride_match
- **projectmatch_db:** project, skill_profile, project_application, team
- **microjob_db:** job, proposal, contract, rating

Bu modellerin durum makineleri ve iş kuralları [06-kullanici-akislari.md](06-kullanici-akislari.md) ve [08-yol-haritasi-ve-durum.md](08-yol-haritasi-ve-durum.md) içinde özetlenmiştir.
