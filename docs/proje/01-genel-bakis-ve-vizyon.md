# 01 — Genel Bakış ve Vizyon

## 1. Proje Tanımı

IsikCampusOS, Işık Üniversitesi öğrencileri ve personeli için tasarlanmış, **kapalı** (yalnızca doğrulanmış üniversite üyelerine açık) bir dijital kampüs platformudur. Platform; kampüs içi sosyal, idari ve pratik süreçleri tek kimlik, tek arayüz ve ortak bir güven katmanı altında birleştirmeyi amaçlar. Sistem mikroservis mimarisiyle inşa edilmiştir ve modüler olarak genişleyebilecek biçimde kurgulanmıştır.

## 2. Vizyon

Üniversite kampüslerinde kulüp duyuruları, tesis rezervasyonu, yemek siparişi, ulaşım ve akranlar arası iş birliği gibi ders dışı süreçler çoğunlukla dağınık ve denetimsiz harici kanallara (sosyal medya, mesajlaşma grupları, e-posta, manuel koordinasyon) bırakılmıştır. IsikCampusOS'un vizyonu, bu dağınıklığı tek bir güvenli ve tutarlı kullanıcı deneyimi omurgasında birleştirmektir.

## 3. Modüller ve Gerçekleştirim Durumu

> **ÖNEMLİ:** Aşağıdaki tablo, projenin **tam vizyonunu** (hedeflenen 6 fonksiyonel modül) ve bu modüllerin **mevcut gerçekleştirim durumunu** ayrı ayrı gösterir. Bu ayrım tüm proje dokümanlarında tutarlı biçimde korunur.

| Modül | Kapsam | Durum |
|-------|--------|-------|
| **Kimlik ve Yetkilendirme** | Üniversite e-postası ile giriş, JWT, e-posta doğrulama, öğrenci yönetimi | ✅ **Kodlandı** (`auth-service`) |
| **Profil Yönetimi** | Otomatik profil oluşturma, profil görüntüleme/güncelleme, onay akışı | ✅ **Kodlandı** (`profile-service`) |
| **Kulüp ve Etkinlik Yönetimi** | Kulüp kuruluşu, üyelik, etkinlik, RSVP, QR check-in, sertifika, bildirim | ✅ **Kodlandı** (`club-service`) |
| **Spor Tesisleri Rezervasyon** | Tesis/kaynak, uygunluk, çakışmasız rezervasyon, check-in | ✅ **Kodlandı** (`facility-service`) |
| **Kampüs Yemek Sipariş ve Yönetim** | Satıcı, menü, sipariş, asenkron durum takibi | 🔵 **Planlandı** (henüz kodlanmadı) |
| **Paylaşımlı Yolculuk (CampusRide)** | Sürücü/yolcu ilanı, rota ve uygunluk temelli eşleştirme | 🔵 **Planlandı** (henüz kodlanmadı) |
| **Proje Eşleştirme (ProjectMatch)** | Beceri profili, proje ilanı, uyum temelli akran eşleştirme | 🔵 **Planlandı** (henüz kodlanmadı) |
| **Kampüs İçi Mikro İş (MicroJob)** | Kısa süreli iş ilanı, teklif, anlaşma, itibar göstergeleri | 🔵 **Planlandı** (henüz kodlanmadı) |

**Özet:** Çekirdek altyapı + kimlik + profil + kulüp/etkinlik + tesis rezervasyon modülleri **çalışır durumdadır**. Yemek, yolculuk, proje eşleştirme ve mikro iş modülleri **tasarım aşamasında** olup yol haritasının sonraki fazlarına bırakılmıştır (bkz. [08-yol-haritasi-ve-durum.md](08-yol-haritasi-ve-durum.md)).

## 4. Hedef Kullanıcılar

- **Öğrenciler:** Kulüplere katılma, etkinliklere RSVP, tesis rezervasyonu, profil yönetimi; ileride yemek/yolculuk/proje/mikro iş.
- **Kulüp Başkanları (domain rolü):** Kendi kulüpleri adına etkinlik oluşturma, üye ve katılım yönetimi.
- **SKS Personeli:** Kulüp ve etkinlik onay süreçleri, kulüp performansı izleme.
- **Öğrenci İşleri (Registrar):** Öğrenci hesabı oluşturma ve durum yönetimi.
- **Tesis Yöneticileri:** Tesis kaynakları ve rezervasyon politikaları yönetimi.
- **Sistem Yöneticisi (Admin):** Roller, güvenlik ve sistem geneli yönetim.

## 5. Temel Tasarım İlkeleri

- **Mikroservis mimarisi:** Her domain bağımsız bir Spring Boot servisi.
- **Servis başına veritabanı:** Servisler birbirinin veritabanına doğrudan erişmez.
- **Merkezi kimlik doğrulama:** JWT, API Gateway katmanında doğrulanır; kullanıcı bilgisi downstream servislere `X-User-Id` ve `X-User-Roles` başlıklarıyla aktarılır.
- **Olay güdümlü iletişim:** Servisler arası asenkron iletişim Kafka ile sağlanır.
- **Üniversite e-postası ile onboarding:** Sisteme yalnızca doğrulanmış üniversite üyeleri erişebilir (kapalı topluluk).
- **Rol bazlı erişim (RBAC) + sahiplik:** Yetki yalnızca role değil; sahiplik, durum ve bağlama göre de kontrol edilir.
- **Tutarlı kullanıcı deneyimi:** Tüm modüllerde ortak tasarım dili ile bilişsel geçiş maliyetinin azaltılması.

## 6. İlgili Dokümanlar

- [02-mimari.md](02-mimari.md) — Sistem mimarisi, servisler, iletişim
- [03-veritabani-tasarimi.md](03-veritabani-tasarimi.md) — Veri modeli
- [04-api-sozlesmesi.md](04-api-sozlesmesi.md) — API uç noktaları
- [05-roller-ve-yetkiler.md](05-roller-ve-yetkiler.md) — Rol ve yetki matrisi
- [06-kullanici-akislari.md](06-kullanici-akislari.md) — Temel iş akışları
- [07-calistirma-rehberi.md](07-calistirma-rehberi.md) — Yerel kurulum
- [08-yol-haritasi-ve-durum.md](08-yol-haritasi-ve-durum.md) — Mevcut durum ve sonraki adımlar
