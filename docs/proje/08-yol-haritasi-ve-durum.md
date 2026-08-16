# 08 — Yol Haritası ve Mevcut Durum

Bu doküman, projenin güncel durumunu ve devam eden/planlanan süreçleri tek yerde toplar. Eski birden çok planlama dosyası (action-plan, roadmap, implementation-readiness, bitirme-projesi-planlama) bu dosyada konsolide edilmiştir.

Son güncelleme: 2026-06-16

## 1. Mevcut Durum (Özet)

### ✅ Tamamlanan / Çalışan
- **Altyapı:** Docker Compose (PostgreSQL, Kafka, Zookeeper, Redis, Zipkin, Mailpit), Eureka servis keşfi, API Gateway merkezi yönlendirme + JWT doğrulama.
- **auth-service:** Giriş, JWT üretimi, e-posta doğrulama, zorunlu şifre değiştirme, öğrenci yönetimi (Registrar), sertifika doğrulama, `user.registered` Kafka olayı.
- **profile-service:** `user.registered` olayını tüketerek otomatik profil oluşturma, profil CRUD, profil değişiklik onay akışı.
- **club-service:** Kulüp yönetimi, üyelik, SKS onay akışları, etkinlik yaşam döngüsü, RSVP + waitlist, QR check-in, sertifika gönderimi, kulüp/SKS duyuru fan-out, akademik kadro, denetim günlüğü.
- **notification-service:** In-app bildirim kalıcılığı, okundu/okunmadı durumu, SSE bildirim akışı, toplu/destek duyurusu ve `bildirim.olustur` Kafka olayı tüketimi.
- **facility-service:** Tesis, kaynak, rezervasyon, uygunluk kuralları, çakışma kontrolü, check-in/yoklama.
- **food-service:** Satıcı, menü, kategori, kampanya, favori, sipariş, işletme personeli, ciro, değişiklik talebi ve sipariş durum yönetimi.
- **ride-service:** CampusRide ilan/talep akışı, rota önizleme, popüler noktalar, araç/ehliyet doğrulama, puanlama, şikayet ve yönetim logları.
- **message-service:** FOOD/RIDE gibi bağlamlara bağlı konuşma açma/kapatma, mesaj gönderme, okunmamış sayısı ve SSE mesaj akışı.
- **Frontend:** Giriş, e-posta doğrulama, şifre değiştirme, rol bazlı dashboard'lar (Admin, SKS, Registrar, Facility, İşletme, Ride, Student), kulüp/etkinlik ekranları, tesis rezervasyon ekranları, yemek siparişi, işletme paneli, CampusRide, mesajlar, profil, bildirimler, sertifika doğrulama sayfası.

### 🔵 Future Works (tez kapsamı dışı, kodlanmadı)
- `projectmatch-service` (proje eşleştirme) — tez Bölüm 6.3'te tasarım düzeyinde ele alındı
- `microjob-service` (mikro iş pazarı) — tez Bölüm 6.3'te tasarım düzeyinde ele alındı
- Yerel (native) mobil uygulama — platform web tabanlıdır
- İleride ayrı servis adayları: moderation, analytics

Bu başlıklar tezde bilinçli kapsam sınırlaması olarak tanımlanmış ve gelecek çalışma
olarak konumlandırılmıştır (bkz. tez Bölüm 5.1.1, 6.2 ve 6.3).

## 2. Bilinen Teknik Borçlar

Yeni modül eklemeden önce ele alınması önerilen konular:

| # | Konu | Öncelik |
|---|------|---------|
| 1 | ~~JWT secret `application.yml` / `docker-compose.yml` içinde varsayılan değerde~~ ✅ **Kapatıldı (2026-06-16):** sabit varsayılanlar kaldırıldı; `JWT_SECRET` yalnızca env'den okunur, yoksa fail-fast (bkz. `.env.example`) | — |
| 2 | Flyway çoğu serviste aktif olsa da `ddl-auto: validate` ile migration uyumu düzenli kontrol edilmeli | Orta |
| 3 | Otomatik test kapsamı sınırlı — kritik iş kuralları için birim/entegrasyon testleri | Orta |
| 4 | Bazı proje dokümanları ve tez metinleri kodun son halini geriden takip edebilir; kod gerçekliğiyle periyodik hizalama gerekir | Orta |
| 5 | ProjectMatch ve MicroJob future works kapsamındadır; servis/port/DB oluşturma kararı geliştirme fazına bırakıldı | Düşük |

## 3. Geliştirme Yol Haritası

### Faz A — Çekirdeği sağlamlaştırma (mevcut odak)
- [x] JWT secret'i tamamen env tabanlı hale getirme (sabit varsayılanlar kaldırıldı, fail-fast)
- [ ] Kritik iş kuralları için test altyapısı (auth giriş, RSVP kapasite/waitlist, rezervasyon çakışma, etkinlik onay yetkisi)
- [ ] Flyway migration disiplinine geçiş (önce auth-service)

### Faz B — Kodlanan yeni modülleri sağlamlaştırma
- [ ] `food-service` için kritik sipariş durum makinesi ve işletme/personel yetki testlerini artırma
- [ ] `ride-service` için rota, talep kabul/red, doğrulama ve şikayet akışlarını entegrasyon testleriyle genişletme
- [ ] `notification-service` ve `message-service` SSE akışlarını uçtan uca doğrulama

### Faz C — Yeni modüller (future works, tez sonrası)
Tez kapsamına alınmayan bu modüller ileride ele alınırsa önerilen sıra:
1. **projectmatch-service** — beceri profili, proje ilanı, eşleştirme
2. **microjob-service** — ilan, teklif, kontrat, itibar

Her ikisi de ortak etiket tabanlı eşleştirme altyapısına dayanır; mevcut
`profile-service` beceri etiketleri üzerine inşa edilmesi planlanmıştır.

### Faz D — Olgunlaştırma
- [ ] Moderasyon/analitik işlevlerinin gözden geçirilmesi ve gerekirse ayrı servislere bölünmesi
- [ ] Dağıtık izleme ve gözlemlenebilirlik (Zipkin + Actuator) genişletme
- [ ] Demo verisi ve sunum senaryosu

## 4. Yeni Modül Eklerken İzlenecek Şablon

Mevcut `club-service` ve `facility-service` referans alınarak her yeni servis için:
1. `services/<servis>/` altında Spring Boot modülü (`com.isik.kampusos.<domain>` paketi, Türkçe sınıf adları).
2. Parent `pom.xml`'e modül ekleme.
3. `application.yml`: kendi DB'si, Eureka kaydı, Kafka ayarları, JWT filtresi.
4. API Gateway'e rota + `KimlikDogrulama` filtresi ekleme.
5. MVP'ye alınan servisler için `infra/init.sql`'de DB'nin var olduğundan emin olma.
6. Domain modeli, repository, servis, controller, DTO katmanları.
7. Frontend: store + sayfa + rota entegrasyonu.

## 5. Mimari Karar Kayıtları (ADR)

### ADR-001 — Bildirim işlevi bağımsız notification-service'e ayrıldı

**Durum:** Güncellendi (2026-06-16)

**Bağlam:**
- Bildirim artık yalnızca kulüp/etkinlik alanına ait değildir; yemek ve yolculuk gibi modüller de kullanıcıya bildirim üretmektedir.
- `notification-service`, `notification_db` üzerinde bildirimleri saklar, `/api/v1/bildirimler/**` uçlarını ve SSE akışını sağlar.
- `club-service` yalnızca kulüp/SKS duyuru fan-out akışı için `/api/v1/bildirimler/duyurular` ucunu taşımaya devam eder.

**Karar:**
Bildirim işlevi bağımsız `notification-service` olarak çalışır. Üretici servisler bildirim oluşturmak için Kafka tabanlı `bildirim.olustur` olayını kullanır.

**Gerekçe:**
- Birden fazla domainin bildirim üretmesiyle bildirim artık ortak platform yeteneğidir.
- Üretici servisler bildirim kalıcılığı ve kullanıcıya iletim detaylarından ayrılır.
- SSE ve okundu/okunmadı durumu tek servis altında merkezileşir.

**Sonuç/etki:** Gateway'de `/api/v1/bildirimler/duyurular` özel rotası `club-service`e, genel `/api/v1/bildirimler/**` rotası `notification-service`e gider. Yeni bildirim üreticileri doğrudan bildirim tablosuna erişmez; olay yayınlar.

## 6. Karar Bekleyen Konular

- Ödeme gerektiren modüllerde (yemek, mikro iş) ödeme öncesi/sonrası akış nasıl modellenecek? (Gerçek ödeme entegrasyonu kapsam dışı.)
- Moderasyon ve analitik ayrı servis olarak ne zaman ayrılacak?

## 7. Tez Çalışması ile İlişki

Bu proje aynı zamanda bir Yönetim Bilişim Sistemleri lisans bitirme tezinin konusudur. Tezin tam metni [docs/tez/IsikCampusOS_Tez.docx](../tez/IsikCampusOS_Tez.docx) dosyasındadır; hangi modüllerin kodlandığı bu dokümanda ve [01-genel-bakis-ve-vizyon.md](01-genel-bakis-ve-vizyon.md) içinde net olarak işaretlenmiştir.
