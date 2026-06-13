# 06 — Kullanıcı Akışları

Bu doküman, platformun temel iş akışlarını özetler. Çalışan modüllerin akışları gerçek koda dayanır; planlanan modüllerin akışları hedef tasarımdır.

## 1. Kayıt ve Aktivasyon (çalışıyor)

1. Öğrenci İşleri (Registrar), öğrenci hesabını üniversite e-postasıyla oluşturur.
2. `auth-service` kaydı yazar ve Kafka'ya `user.registered` olayı yayar.
3. `profile-service` bu olayı tüketerek otomatik boş profil oluşturur.
4. Kullanıcı ilk girişte:
   - E-posta doğrulaması yapar (doğrulama kodu).
   - Zorunlu şifre değiştirme akışını tamamlar.
5. Doğrulama tamamlanınca kullanıcı dashboard'a erişir.

> Frontend tarafında bu zorunluluklar korumalı rota mantığıyla uygulanır: e-posta doğrulanmadan veya zorunlu şifre değişmeden dashboard'a geçilemez.

## 2. Rol Bazlı Dashboard Yönlendirmesi (çalışıyor)

Giriş sonrası kullanıcı rolüne göre yönlendirilir:
- SKS yönetimi → SKS Dashboard
- Öğrenci İşleri → Registrar Dashboard
- Tesis yönetimi → Facility Admin Dashboard
- Öğrenci → Student Dashboard

## 3. Kulüp ve Etkinlik Akışı (çalışıyor)

### Kulüp yaşam döngüsü
1. SKS, kulübü oluşturur ve bir öğrenciyi başkan olarak atar.
2. Başkan, kulüp profili güncelleme talebi oluşturabilir → SKS onaylar/reddeder/revizyon ister.
3. Öğrenciler kulübe katılır/ayrılır.
4. SKS, üye rol ve durumlarını yönetebilir.

### Etkinlik yaşam döngüsü
1. Kulüp başkanı etkinlik taslağı oluşturur.
2. Taslak SKS onayına gönderilir.
3. SKS onaylar → etkinlik yayına geçer (öğrenci akışında görünür).
4. Öğrenciler RSVP yapar; kapasite dolarsa bekleme listesi (waitlist) mantığı uygulanır.
5. Etkinlik günü QR ile check-in yapılır.
6. Sertifikalı etkinliklerde, katılımı onaylananlara tek komutla sertifika gönderimi tetiklenir (`club-service` → Kafka → `auth-service`).

### Etkinlik durumları
`taslak → onay_bekliyor → yayında → tamamlandı` (ayrıca `reddedildi`, `iptal`).

## 4. Tesis Rezervasyon Akışı (çalışıyor)

1. Öğrenci tesis ve kaynakları listeler, uygunluk durumunu görür.
2. Tarih/saat/kaynak seçerek rezervasyon oluşturur.
3. Aynı kaynak ve zaman aralığında çakışan rezervasyon engellenir.
4. Rezervasyon iptal edilebilir; check-in/yoklama kaydı tutulur.
5. Tesis yöneticisi kaynakları, politikaları ve uygunluk kurallarını yönetir.

## 5. Bildirim Akışı (çalışıyor)

- Kritik domain aksiyonları (kulüp/etkinlik onayı, duyuru vb.) in-app bildirim üretir.
- Bildirimler okundu/okunmadı durumuyla listelenir.
- Bildirim işlevi `club-service` içinde gömülüdür.

## 6. Planlanan Modül Akışları (hedef tasarım — henüz kodlanmadı)

### Yemek Sipariş (food)
`sipariş ver → satıcı kabul → hazırlanıyor → teslime hazır → teslim alındı`; asenkron durum takibi, teslim kodu.

### Paylaşımlı Yolculuk (ride)
Sürücü/yolcu ilanı → uygunluk ve rota temelli eşleştirme → kabul → yolculuk → puanlama; kapalı topluluk güven sinyalleri.

### Proje Eşleştirme (projectmatch)
Beceri profili → proje ilanı → uyum skoru → davet → ekip oluşturma.

### Mikro İş (microjob)
İş ilanı → teklif toplama → anlaşma/kontrat → teslim/onay → karşılıklı puanlama; itibar göstergeleri.

> Bu akışların durum makineleri ve iş kuralları, ilgili servisler geliştirildiğinde detaylandırılacaktır.
