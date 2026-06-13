# 04 — API Sözleşmesi

## 1. Genel İlkeler

- **Temel yol:** Tüm uç noktalar `/api/v1/...` ile başlar.
- **Tek giriş noktası:** Tüm istekler API Gateway (`:8080`) üzerinden geçer.
- **Kimlik:** Korumalı uç noktalar `Authorization: Bearer <JWT>` başlığı gerektirir. Gateway, doğrulanan kullanıcıyı `X-User-Id` ve `X-User-Roles` başlıklarıyla downstream servise iletir.
- **Dil:** Yollar Türkçedir (`kimlik`, `kulupler`, `etkinlikler`, `tesisler`).

> Aşağıdaki uç noktalar **koddaki gerçek controller'lara** dayanır. Planlanan modüllerin (yemek, yolculuk, proje, mikro iş) API'leri ileride tanımlanacaktır.

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

## 5. Tesis Rezervasyon — facility-service

- `GET /api/v1/tesisler` — tesis listesi
- `GET /api/v1/tesisler/{id}` — tesis detayı
- `GET /api/v1/tesis-kaynaklari/**` — kaynak ve uygunluk sorgulama
- Rezervasyon oluşturma / iptal / check-in uç noktaları
- `/api/v1/tesis-yonetim/**` — tesis yöneticisi işlemleri (kaynak, politika, uygunluk kuralı yönetimi)

## 6. Standart Davranışlar

- **Hata modeli:** Standart HTTP durum kodları; yetkisiz istekte `401`, yetersiz yetkide `403`, bulunamayanda `404`, çakışmada `409`.
- **Doğrulama:** İstek gövdeleri sunucu tarafında doğrulanır (Bean Validation + servis kuralları).
- **Sayfalama:** Liste uç noktalarında sayfalama hedeflenir.

> **Planlanan API'ler:** `food-service`, `ride-service`, `projectmatch-service` ve `microjob-service` uç noktaları ilgili modüller geliştirildiğinde bu dokümana eklenecektir.
