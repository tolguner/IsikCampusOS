# 03 — Veritabanı Tasarımı

## 1. Strateji

Mikroservis mimarisinin **servis başına veritabanı (database-per-service)** ilkesi benimsenmiştir. Her servis kendi veritabanına sahiptir ve başka bir servisin tablolarına doğrudan SQL ile erişmez. Servisler arası veri ihtiyacı API çağrısı veya Kafka olayı ile karşılanır.

Geliştirme ortamında tek bir PostgreSQL container içinde birden çok veritabanı oluşturulur (`infra/init.sql`). Çoğu servis Flyway migration dosyalarıyla şema taşır; JPA tarafında `ddl-auto: validate` ile entity-şema uyumu kontrol edilir.

## 2. Veritabanı Dağılımı

| Veritabanı | Servis | Durum |
|------------|--------|-------|
| `auth_db` | auth-service | ✅ Kullanımda |
| `profile_db` | profile-service | ✅ Kullanımda |
| `club_db` | club-service | ✅ Kullanımda |
| `notification_db` | notification-service | ✅ Kullanımda |
| `facility_db` | facility-service | ✅ Kullanımda |
| `food_db` | food-service | ✅ Kullanımda |
| `ride_db` | ride-service | ✅ Kullanımda |
| `mesaj_db` | message-service | ✅ Kullanımda |
| `moderation_db`, `analytics_db` | (ayrı servis yok) | 🔵 Rezerve |

> Kod gerçekliği için `services/*/src/main/resources/db/migration` altındaki Flyway dosyaları esas alınır.

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

### 3.3. club_db (club-service)

Bu servis kulüp, etkinlik ve kulüp/SKS duyuru fan-out domainlerini taşır:

- **Kulup** — kulüp profili: ad, kısa açıklama, vizyon, logo, yönetici (başkan) kullanıcı, danışman bilgileri, aktiflik, soft-delete.
- **KulupUyesi** — kulüp üyeliği: kullanıcı, rol (YONETICI/UYE), durum (AKTIF/BEKLEMEDE vb.).
- **KulupDuyurusu** — kulüp duyuruları.
- **KulupSaglikKaydi** — kulüp sağlık/aktiflik kaydı.
- **KulupProfilDegisiklikIstegi** — kulüp profil güncelleme onay akışı.
- **Etkinlik** — etkinlik: başlık, açıklama, tarih, kapasite, durum (taslak/onay bekleyen/yayında vb.), onaylayan, QR check-in ve sertifika bilgileri.
- **EtkinlikDegisiklikIstegi** — etkinlik değişiklik onay akışı.
- **EtkinlikKatilimi** — RSVP / katılım kaydı, check-in durumu.
- **AkademikKadro** — kulüp danışmanı olarak atanabilecek akademik personel kaydı.
- **DenetimGunlugu** — kritik aksiyonların audit log kaydı.

### 3.4. notification_db (notification-service)

- **Bildirim** — in-app bildirim kaydı: başlık, mesaj, tür, hedef kitle/kullanıcı, bağlantı ve görsel bilgileri.
- **BildirimOkuma** — kullanıcı bazlı okundu/okunmadı takibi.

### 3.5. facility_db (facility-service)

- **Tesis** — tesis tanımı.
- **TesisKaynagi** — tesise bağlı kaynak (saha, oda vb.).
- **TesisRezervasyon** — rezervasyon kaydı.
- **TesisPolitikasi** — rezervasyon politikaları.
- **TesisKullanilabilirlikKurali** — uygunluk/slot kuralları.
- **RezervasyonYoklama** — check-in / yoklama kaydı.

### 3.6. food_db (food-service)

- **Satici** — kampüs içi işletme/satıcı profili, konum, logo/kapak, teslimat ve açık/kapalı bilgileri.
- **CalismaSaati** — satıcı çalışma saatleri.
- **MenuKategorisi**, **MenuOgesi**, **MenuSecenekGrubu**, **MenuSecenegi** — menü, kategori ve seçenek modeli.
- **Kampanya** — kampanya/indirim tanımları.
- **Siparis**, **SiparisKalemi** — sipariş, sipariş kalemleri, tutarlar ve durum yaşam döngüsü.
- **FavoriSatici** — öğrenci favori satıcı ilişkisi.
- **IsletmePersoneli** — satıcı-personel bağı.
- **SaticiDegisiklikIstegi** — işletme profil/menu vb. değişiklik onay akışı.
- **DenetimGunlugu** — işletme yönetimi ve destek işlemleri denetim kaydı.

### 3.7. ride_db (ride-service)

- **YolculukIlani** — sürücünün paylaşımlı yolculuk ilanı.
- **YolculukTalebi** — yolcunun ilana katılım talebi ve kabul/red/tamamlanma durumu.
- **RotaDuragi** — ilan/talep rota durakları.
- **PopulerNokta** — sık kullanılan kampüs/şehir noktaları.
- **SurucuDogrulama** — sürücü doğrulama başvurusu.
- **Arac** — kullanıcı araç kaydı ve onay durumu.
- **YolculukPuani**, **YolculukSikayeti** — puanlama ve şikayet kayıtları.
- **YolculukSistemLogu** — yönetim/audit log kaydı.

### 3.8. mesaj_db (message-service)

- **Konusma** — FOOD/RIDE gibi bir modül ve bağlam kaydına bağlı konuşma.
- **Mesaj** — konuşma içindeki mesaj kayıtları ve okundu durumu.

## 4. Ortak Veri Standartları

- **Birincil anahtar:** UUID temelli kimlikler (dağıtık ortamda çakışmasız).
- **Soft-delete:** Kritik tablolarda fiziksel silme yerine mantıksal silme (`silindi` / `silinmeTarihi`).
- **Denetim izi:** Kritik aksiyonlar `DenetimGunlugu` üzerinden kayıt altına alınır.
- **Referanslar:** Modüller başka servisteki kullanıcıyı `kullaniciId` referansıyla tutar; kullanıcı nesnesini kopyalamaz.

## 5. Future Works Veri Modeli (taslak)

Aşağıdaki modeller **henüz kodlanmamıştır**; ilgili servisler geliştirildiğinde tasarlanacaktır:

- **ProjectMatch:** project, skill_profile, project_application, team
- **MicroJob:** job, proposal, contract, rating

Bu iki modül MVP dışında tutulduğu için geliştirme ortamında `projectmatch_db` ve `microjob_db` veritabanları şu an oluşturulmaz.

Bu modellerin durum makineleri ve iş kuralları [06-kullanici-akislari.md](06-kullanici-akislari.md) ve [08-yol-haritasi-ve-durum.md](08-yol-haritasi-ve-durum.md) içinde özetlenmiştir.
