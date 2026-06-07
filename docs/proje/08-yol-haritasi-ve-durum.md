# 08 — Yol Haritası ve Mevcut Durum

Bu doküman, projenin güncel durumunu ve devam eden/planlanan süreçleri tek yerde toplar. Eski birden çok planlama dosyası (action-plan, roadmap, implementation-readiness, bitirme-projesi-planlama) bu dosyada konsolide edilmiştir.

Son güncelleme: 2026-06-01

## 1. Mevcut Durum (Özet)

### ✅ Tamamlanan / Çalışan
- **Altyapı:** Docker Compose (PostgreSQL, Kafka, Zookeeper, Redis, Zipkin, Mailpit), Eureka servis keşfi, API Gateway merkezi yönlendirme + JWT doğrulama.
- **auth-service:** Giriş, JWT üretimi, e-posta doğrulama, zorunlu şifre değiştirme, öğrenci yönetimi (Registrar), sertifika doğrulama, `user.registered` Kafka olayı.
- **profile-service:** `user.registered` olayını tüketerek otomatik profil oluşturma, profil CRUD, profil değişiklik onay akışı.
- **club-service:** Kulüp yönetimi, üyelik, SKS onay akışları, etkinlik yaşam döngüsü, RSVP + waitlist, QR check-in, sertifika gönderimi, in-app bildirim, akademik kadro, denetim günlüğü. (En olgun modül.)
- **facility-service:** Tesis, kaynak, rezervasyon, uygunluk kuralları, çakışma kontrolü, check-in/yoklama.
- **Frontend:** Giriş, e-posta doğrulama, şifre değiştirme, rol bazlı dashboard'lar (SKS, Registrar, Facility, Student), kulüp/etkinlik ekranları, tesis rezervasyon ekranları, profil, bildirimler, sertifika doğrulama sayfası.

### 🔵 Planlanan (henüz kodlanmadı)
- `food-service` (yemek sipariş ve yönetim)
- `ride-service` (paylaşımlı yolculuk)
- `projectmatch-service` (proje eşleştirme)
- `microjob-service` (mikro iş pazarı)
- İleride ayrı servis adayları: notification, moderation, analytics (şu an club-service içinde/yok)

## 2. Bilinen Teknik Borçlar

Yeni modül eklemeden önce ele alınması önerilen konular:

| # | Konu | Öncelik |
|---|------|---------|
| 1 | JWT secret hâlâ `application.yml` / `docker-compose.yml` içinde varsayılan değerde — yalnızca env'den okunmalı | Yüksek |
| 2 | Şema yönetimi Hibernate `ddl-auto` ile — Flyway/Liquibase migration'a geçiş | Orta |
| 3 | Otomatik test kapsamı sınırlı — kritik iş kuralları için birim/entegrasyon testleri | Orta |
| 4 | Bildirim club-service içinde gömülü — ikinci tüketici gelince ayrı servise çıkarma (bkz. ADR-001) | Düşük |
| 5 | `init.sql` 11 DB oluşturuyor ama 4'ü kullanımda — planlı servisler gelene kadar farkındalık notu | Düşük |

## 3. Geliştirme Yol Haritası

### Faz A — Çekirdeği sağlamlaştırma (mevcut odak)
- [ ] JWT secret'i tamamen env tabanlı hale getirme
- [ ] Kritik iş kuralları için test altyapısı (auth giriş, RSVP kapasite/waitlist, rezervasyon çakışma, etkinlik onay yetkisi)
- [ ] Flyway migration disiplinine geçiş (önce auth-service)

### Faz B — Yeni modüller (sırayla)
Önerilen sıra, mevcut club-service ve facility-service'in şablon alınmasıyla:
1. **food-service** — vendor, menü, sipariş, asenkron durum takibi
2. **projectmatch-service** — beceri profili, proje ilanı, eşleştirme
3. **ride-service** — ilan, eşleştirme, güven sinyalleri
4. **microjob-service** — ilan, teklif, kontrat, itibar

### Faz C — Olgunlaştırma
- [ ] Bildirim/moderasyon/analitik işlevlerinin gözden geçirilmesi ve gerekirse ayrı servislere bölünmesi
- [ ] Dağıtık izleme ve gözlemlenebilirlik (Zipkin + Actuator) genişletme
- [ ] Demo verisi ve sunum senaryosu

## 4. Yeni Modül Eklerken İzlenecek Şablon

Mevcut `club-service` ve `facility-service` referans alınarak her yeni servis için:
1. `services/<servis>/` altında Spring Boot modülü (`com.isik.kampusos.<domain>` paketi, Türkçe sınıf adları).
2. Parent `pom.xml`'e modül ekleme.
3. `application.yml`: kendi DB'si, Eureka kaydı, Kafka ayarları, JWT filtresi.
4. API Gateway'e rota + `KimlikDogrulama` filtresi ekleme.
5. `infra/init.sql`'de DB'nin var olduğundan emin olma.
6. Domain modeli, repository, servis, controller, DTO katmanları.
7. Frontend: store + sayfa + rota entegrasyonu.

## 5. Mimari Karar Kayıtları (ADR)

### ADR-001 — Bildirim işlevi şimdilik club-service içinde kalır, ileride ayrı servise ayrılır

**Durum:** Kabul edildi (2026-06-01)

**Bağlam:**
- Bildirim, mevcut sürümde **in-app** (uygulama içi) bir işlevdir: `Bildirim` ve `BildirimOkuma` entity'leri `club_db` içinde tutulur; e-posta/push kanalı yoktur.
- `BildirimServisi`, club-service'in kendi servis katmanından (KulupServisi, EtkinlikServisi, KulupSaglikServisi vb.) **doğrudan metot çağrısıyla** (~16 çağrı) kullanılır; Kafka aracılı değildir.
- Bugün bildirimin **tek tüketicisi club-service'tir**. auth, profile ve facility servisleri bildirim üretmemektedir.

**Karar:**
Bildirim işlevi şu an için club-service içinde bırakılır. Bağımsız bir servise **şu anda** ayrılmaz.

**Gerekçe:**
- Tek tüketicisi olan bir işlevi ayrı servise çıkarmak, ağ çağrısı ve dağıtık işlem karmaşıklığı eklerken somut bir fayda getirmez (YAGNI).
- Erken ayırma, çekirdek henüz sağlamlaşmadan gereksiz refactor riski oluşturur.
- Başka servis altına (auth/profile/facility) taşımak ise domain açısından yanlıştır; bildirim hiçbirine ait değildir.

**Tetikleyici (ne zaman ayrılacak):**
İkinci bir modül (yemek, yolculuk, tesis, mikro iş) bildirim üretmeye ihtiyaç duyduğu an, bildirim **olay güdümlü (Kafka tabanlı)** bağımsız bir `notification-service` olarak ayrılır.

**Hedef geçiş yolu:**
1. Üretici servisler `bildirim.gonder` gibi bir Kafka topic'ine olay yayar; `notification-service` bu olayları tüketir (üreticiler bildirimden habersiz olur → tek yönlü bağımlılık).
2. Bildirim tabloları `club_db`'den `notification_db`'ye taşınır (`init.sql`'de rezerve).
3. Kanal genişletmesi (e-posta/push) bu servis içinde ele alınır.

**Sonuç/etki:** Mevcut kod sade kalır; ayırma maliyeti, bildirim üreten ikinci modül gelene kadar ertelenir.

## 6. Karar Bekleyen Konular

- Ödeme gerektiren modüllerde (yemek, mikro iş) ödeme öncesi/sonrası akış nasıl modellenecek? (Gerçek ödeme entegrasyonu kapsam dışı.)
- Moderasyon ve analitik ayrı servis olarak ne zaman ayrılacak?

## 7. Tez Çalışması ile İlişki

Bu proje aynı zamanda bir Yönetim Bilişim Sistemleri lisans bitirme tezinin konusudur. Tez çalışması `docs/tez/` altında yürütülmektedir ve projenin **tam vizyonunu** (6 modül) ele alır; hangi modüllerin kodlandığı bu dokümanda ve [01-genel-bakis-ve-vizyon.md](01-genel-bakis-ve-vizyon.md) içinde net olarak işaretlenmiştir.
