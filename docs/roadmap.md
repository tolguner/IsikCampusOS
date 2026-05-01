# IsikCampusOS Gelisim Yol Haritasi

## Faz 0 - Urun Netlestirme
Hedef:
- urun vizyonunu netlestirmek
- MVP kapsaminda hangi modullerin ilk surume girecegini sabitlemek
- kullanici rolleri ve basari metriklerini son haline getirmek
- **Paralel Geliştirme Kararı:** Tüm modüller backend (Spring Boot) ve frontend (React+Vite) olarak omuz omuza, uçtan uca (full-stack) geliştirilecek.

Ciktilar:
- urun gereksinim dokumani, teknik mimari taslagi, veri modeli taslagi, ekran ve akis listesi

## Faz 1 - Temel Platform Altyapisi & İlk UI İskeleti
Hedef:
- Microservis altyapisini kurmak ve Frontend projesini başlatmak.
- Ortak tasarım dilini (Tailwind, Dark/Light Mode, Glassmorphism) belirlemek.

Teslimatlar:
- **Backend:** Docker Compose stack (Kafka, Zookeeper, Eureka, per-service DB'ler), API Gateway kurulumu.
- **Frontend:** `frontend` dizininde React + Vite projesi, `tailwind.config.js` ve router kurulumu. `AppLayout` (Navbar, Sidebar) tasarımı.

## Faz 2 - Kimlik ve Profil Sistemi (Full-Stack)
Hedef:
- Kullanıcıların sisteme güvenli şekilde girmesi ve profillerini yönetmesi.

Teslimatlar:
- **Backend:** `auth-service` (Kayıt, giriş, JWT), `profile-service` (Profil CRUD, Kafka üzerinden otomatik profil açılışı).
- **Frontend:** Premium tasarımlı Giriş/Kayıt ekranları. Zustand ile JWT saklama, yetkili yönlendirmeler (Protected Routes). Profil düzenleme sayfası.

## Faz 3 - MVP Modülleri: Etkinlik ve Tesis Yönetimi (Full-Stack)
Hedef:
- Ana modülleri uçtan uca çalışır hale getirmek. Her yeni modülün önce servisi, hemen ardından UI entegrasyonu yapılacak.

Teslimatlar:
- **Event (Etkinlik):**
  - *Backend:* `event-service` (Kulüp üyelikleri, RSVP kapasite/waitlist motoru, Kafka yayınları).
  - *Frontend:* Modern etkinlik akışı (Feed) ekranı. Tıklanabilir kulüp detayları, RSVP/İptal butonları, adminler için etkinlik taslağı oluşturma formu.
- **Facility (Tesis):**
  - *Backend:* `facility-service` (Tesis modelleri, çakışma önleyici slot mekanizması).
  - *Frontend:* Takvim görünümlü (Calendar UI) rezervasyon ekranları. Boş saatlerin gösterimi ve rezervasyon formu.

## Faz 4 - İkinci Dalga Moduller & Bildirimler
Teslimatlar:
- **ProjectMatch:** Proje/ekip arama ekranları ve backend eşleştirme servisi.
- **Notification:** `notification-service` (Kafka'dan okuyup websocket/mail atan servis) ve Frontend bildirim zili (toast mesajları, dropdown).
- **Diğer Modüller:** Food Hub, CampusRide, MicroJob Marketplace.

## Faz 5 - Guven, Analitik ve Operasyon (Admin Panel)
Teslimatlar:
- **Backend:** Moderation ve Analytics servisleri (Trust Score hesaplamaları).
- **Frontend:** `sks_admin` yetkilileri için ayrı bir Admin Dashboard. Kullanıcı şikayetleri (report) ve sistem metrik grafikleri.

## Onerilen Paralel Sprint Sirasi
**Sprint 1:** Monorepo iskeleti, Docker Compose, API Gateway ve React/Tailwind iskeletinin kurulması.
**Sprint 2:** Auth & Profile modüllerinin Backend API'leri ve Frontend ekranlarının (Login/Register/Profile) yapılması.
**Sprint 3:** Smart Event Engine modülünün Backend API'leri ve Frontend ekranlarının (Feed, RSVP) yapılması.
**Sprint 4:** Facility Booking modülünün Backend ve Frontend geliştirmesi.
**Sprint 5:** ProjectMatch ve Notification altyapısının Backend ve Frontend tarafına entegre edilmesi.
**Sprint 6:** Admin Panel, Dashboard ve Moderation sistemlerinin uçtan uca bağlanması.
