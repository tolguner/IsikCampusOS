# 04 — API Sözleşmesi

## 1. Genel İlkeler

- **Temel yol:** Tüm uç noktalar `/api/v1/...` ile başlar.
- **Tek giriş noktası:** Tüm istekler API Gateway (`:8080`) üzerinden geçer.
- **Kimlik:** Korumalı uç noktalar `Authorization: Bearer <JWT>` başlığı gerektirir. Gateway, doğrulanan kullanıcıyı `X-User-Id` ve `X-User-Roles` başlıklarıyla downstream servise iletir.
- **Dil:** Yollar Türkçedir (`kimlik`, `kulupler`, `etkinlikler`, `tesisler`).

> Aşağıdaki uç noktalar **koddaki gerçek controller'lara** dayanır. ProjectMatch ve MicroJob API'leri henüz kodlanmamıştır.

## 2. Kimlik — auth-service

### Public (kimlik doğrulama gerektirmez)
- `POST /api/v1/kimlik/giris` — giriş, JWT döner
- `POST /api/v1/kimlik/sifremi-unuttum` — şifre sıfırlama kodu gönder
- `POST /api/v1/kimlik/sifre-sifirla` — şifre sıfırla
- `POST /api/v1/kimlik/eposta-dogrula` — e-posta doğrula
- `POST /api/v1/kimlik/sifre-degistir` — ilk girişte zorunlu şifre değiştirme
- `GET /api/v1/sertifikalar/dogrula/{kod}` — sertifika doğrulama (public)

### Korumalı
- `GET /api/v1/ogrenciler` — öğrenci listesi (Registrar)
- `POST /api/v1/ogrenciler` — öğrenci oluştur (Registrar)
- `PATCH /api/v1/ogrenciler/{id}/durum` — öğrenci durumu değiştir
- `GET /api/v1/kullanicilar` — toplu kullanıcı sorgulama (internal/yetkili)

## 3. Profil — profile-service

- `GET /api/v1/profiller/me` — kendi profilini getir
- `PUT /api/v1/profiller/me` — kendi profilini güncelle
- `GET /api/v1/profiller/{kullaniciId}` — profil görüntüle
- Profil değişiklik talebi ve onay uç noktaları (değişiklik isteği oluşturma/inceleme)

## 4. Kulüp ve Etkinlik — club-service

### Kulüpler
- `GET /api/v1/kulupler` — aktif kulüpleri listele
- `GET /api/v1/kulupler/{kulupId}` — kulüp detayı
- `POST /api/v1/kulupler/{kulupId}/katil` — kulübe katıl
- `DELETE /api/v1/kulupler/{kulupId}/ayril` — kulüpten ayrıl
- `GET /api/v1/kulupler/yonetilen` — yönetilen (başkanı olunan) kulüpler
- `GET /api/v1/kulupler/{kulupId}/uyeler` — üye listesi (başkan/SKS)
- `POST /api/v1/kulupler/{kulupId}/duyurular` — duyuru oluştur (başkan)
- Kulüp profil güncelleme talebi / onay uç noktaları

### Etkinlikler
- `GET /api/v1/kulupler/{kulupId}/etkinlikler` — kulübün etkinlikleri
- `GET /api/v1/etkinlikler/yonetilen` — yönetilen etkinlikler
- `GET /api/v1/etkinlikler/{eventId}/katilimcilar` — katılımcı listesi
- `POST /api/v1/etkinlikler/{eventId}/rsvp` — etkinliğe kayıt (RSVP)
- `POST /api/v1/etkinlikler/{eventId}/checkin/qr` — QR ile check-in
- `POST /api/v1/etkinlikler/{eventId}/sertifikalar/uret` — sertifika gönderimi

### Yönetim / Onay (SKS)
- `/api/v1/yonetim/**` — SKS onay akışları (kulüp/etkinlik/profil talebi onay-red-revizyon), kulüp sağlık paneli

### Bildirimler
- `GET /api/v1/bildirimler` — bildirimleri listele
- `PATCH /api/v1/bildirimler/{id}/okundu` — okundu işaretle

### Akademik Kadro
- `GET /api/v1/akademik-kadro/**` — kulüp danışmanı seçimi için akademik personel sorgulama

### Denetim Günlükleri
- `GET /api/v1/denetim-gunlukleri` — sistem geneli denetim günlüğü (yalnızca `ROLE_ADMIN`)
- `GET /api/v1/kulupler/{kulupId}/denetim-gunlukleri` — kulüp bazlı denetim kaydı (`ROLE_SKS_ADMIN`, `ROLE_ADMIN`)
- `GET /api/v1/etkinlikler/{etkinlikId}/denetim-gunlukleri` — etkinlik bazlı denetim kaydı

## 5. Tesis Rezervasyon — facility-service

- `GET /api/v1/tesisler` — tesis listesi
- `GET /api/v1/tesisler/{id}` — tesis detayı
- `GET /api/v1/tesis-kaynaklari/**` — kaynak ve uygunluk sorgulama
- Rezervasyon oluşturma / iptal / check-in uç noktaları
- `/api/v1/tesis-yonetim/**` — tesis yöneticisi işlemleri (kaynak, politika, uygunluk kuralı yönetimi)

## 6. Bildirim — notification-service / club-service

- `GET /api/v1/bildirimler` — bildirimleri listele
- `GET /api/v1/bildirimler/akis` — SSE bildirim akışı
- `PATCH /api/v1/bildirimler/{bildirimId}/oku` — okundu işaretle
- `POST /api/v1/bildirimler/toplu-duyuru` — sistem/toplu duyuru
- `POST /api/v1/bildirimler/destek-duyuru` — destek duyurusu
- `POST /api/v1/bildirimler/duyurular` — kulüp/SKS duyurusu (`club-service`)

## 7. Yemek Sipariş — food-service

- `GET /api/v1/saticilar` — satıcıları listele
- `GET /api/v1/saticilar/{saticiId}` — satıcı detayı
- `GET /api/v1/saticilar/{saticiId}/menu` — satıcı menüsü
- `GET /api/v1/saticilar/mutfak-turleri` — mutfak türleri
- `POST /api/v1/siparisler` — sipariş oluştur
- `POST /api/v1/siparisler/onizleme` — sipariş tutar/teslimat önizlemesi
- `GET /api/v1/siparisler/benim` — kullanıcının siparişleri
- `POST /api/v1/siparisler/{id}/iptal` — sipariş iptali
- `POST /api/v1/favoriler/{saticiId}` / `DELETE /api/v1/favoriler/{saticiId}` — favori satıcı yönetimi
- `/api/v1/satici/**` — işletme paneli: profil, çalışma saatleri, kampanya, kategori, menü, sipariş, ciro ve personel işlemleri
- `/api/v1/yonetim/saticilar/**` — sistem/destek yönetimi: satıcı, yönetici, personel, değişiklik talebi ve denetim işlemleri

## 8. CampusRide — ride-service

- `GET /api/v1/yolculuklar/populer-noktalar` — popüler noktalar
- `GET /api/v1/yolculuklar/ilanlar` / `POST /api/v1/yolculuklar/ilanlar` — ilan listele/oluştur
- `GET /api/v1/yolculuklar/ilanlar/benim` — kullanıcının ilanları
- `POST /api/v1/yolculuklar/ilanlar/{id}/katil` — ilana katılım talebi
- `POST /api/v1/yolculuklar/ilanlar/{id}/iptal` — ilan iptali
- `GET /api/v1/yolculuklar/talepler/benim` — kullanıcının yolculuk talepleri
- `GET /api/v1/yolculuklar/surucu/talepler` — sürücünün gelen talepleri
- `POST /api/v1/yolculuklar/talepler/{id}/kabul|red|iptal|tamamla|puanla|sikayet` — talep yaşam döngüsü
- `GET|POST /api/v1/yolculuklar/surucu-dogrulama` — sürücü doğrulama
- `GET|POST|PUT|DELETE /api/v1/yolculuklar/araclar` — araç yönetimi
- `POST /api/v1/yolculuklar/rota-onizleme` — rota önizleme
- `/api/v1/yolculuk-yonetim/**` — araç/ehliyet doğrulama, popüler nokta, şikayet ve sistem logu yönetimi

## 9. Mesajlaşma — message-service

- `GET /api/v1/mesajlar/konusmalar` — konuşmaları listele
- `GET /api/v1/mesajlar/konusmalar/{id}` — konuşma mesajları
- `POST /api/v1/mesajlar/konusmalar/{id}` — mesaj gönder
- `POST /api/v1/mesajlar/konusmalar/{id}/okundu` — konuşmayı okundu işaretle
- `GET /api/v1/mesajlar/baglam/{modul}/{baglamId}` — FOOD/RIDE gibi bağlam için konuşma getir/aç
- `GET /api/v1/mesajlar/okunmamis-sayisi` — okunmamış mesaj sayısı
- `GET /api/v1/mesajlar/akis` — SSE mesaj akışı

## 10. Standart Davranışlar

- **Hata modeli:** Standart HTTP durum kodları; yetkisiz istekte `401`, yetersiz yetkide `403`, bulunamayanda `404`, çakışmada `409`.
- **Doğrulama:** İstek gövdeleri sunucu tarafında doğrulanır (Bean Validation + servis kuralları).
- **Sayfalama:** Liste uç noktalarında sayfalama hedeflenir.

> **Planlanan API'ler:** `projectmatch-service` ve `microjob-service` uç noktaları ilgili modüller geliştirildiğinde bu dokümana eklenecektir.
