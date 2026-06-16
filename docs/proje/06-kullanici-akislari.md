# 06 — Kullanıcı Akışları

Bu doküman, platformun temel iş akışlarını özetler. Çalışan modüllerin akışları gerçek koda dayanır; planlanan ProjectMatch ve MicroJob akışları hedef tasarımdır.

## 1. Kayıt ve Aktivasyon (çalışıyor)

1. Öğrenci İşleri (Registrar), öğrenci hesabını üniversite e-postasıyla oluşturur.
2. `auth-service` kaydı yazar ve Kafka'ya `user.registered` olayı yayar.
3. `profile-service` bu olayı tüketerek otomatik boş profil oluşturur.
4. Kullanıcı ilk girişte:
   - E-posta doğrulaması yapar (doğrulama kodu).
   - Zorunlu şifre değiştirme akışını tamamlar.
5. Doğrulama tamamlanınca kullanıcı dashboard'a erişir.
6. Kullanıcı profilinde biyografi, yetenekler, profil görseli ve iletişim paylaşım iznini doğrudan güncelleyebilir; kimlik kaynaklı alanlar idari/onaylı akışlardan gelir.

> Frontend tarafında bu zorunluluklar korumalı rota mantığıyla uygulanır: e-posta doğrulanmadan veya zorunlu şifre değişmeden dashboard'a geçilemez.

## 2. Rol Bazlı Dashboard Yönlendirmesi (çalışıyor)

Giriş sonrası kullanıcı rolüne göre yönlendirilir:
- SKS yönetimi → SKS Dashboard
- Öğrenci İşleri → Registrar Dashboard
- Tesis yönetimi → Facility Admin Dashboard
- İşletme yetkilisi → İşletme Paneli
- Destek/yapı işleri yönetimi → Destek Hizmetleri Paneli
- Ride yöneticisi → Ride Yönetim Paneli
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
3. Katılımcı sayısı seçilen kaynağın kapasitesini aşamaz.
4. Aynı kaynak ve zaman aralığında çakışan rezervasyon engellenir.
5. Rezervasyon iptal edilebilir; check-in/yoklama kaydı tutulur.
6. Tesis yöneticisi kaynakları, politikaları ve uygunluk kurallarını yönetir.

## 5. Bildirim Akışı (çalışıyor)

- Kritik domain aksiyonları (kulüp/etkinlik onayı, duyuru, yemek siparişi, yolculuk talebi vb.) in-app bildirim üretir.
- Bildirimler okundu/okunmadı durumuyla listelenir.
- Bildirimler `notification-service` içinde saklanır; yeni bildirimler SSE ile istemciye akar.
- Kulüp/SKS duyuru fan-out akışı `club-service` üzerinden başlar, genel bildirim listesi ve okundu işaretleme `notification-service`tedir.

## 6. Yemek Sipariş Akışı (çalışıyor)

1. Öğrenci satıcıları listeler, mutfak türü/arama/sıralama ile filtreler.
2. Satıcı menüsünden ürün, seçenek ve teslimat türü seçerek sepet oluşturur.
3. Sipariş önizlemesi ara toplam, teslimat ücreti, indirim ve toplam tutarı hesaplar.
4. Öğrenci siparişi verir; işletme panelinde sipariş beklemeye düşer.
5. İşletme siparişi kabul eder veya reddeder.
6. Kabul edilen sipariş `hazırlanıyor → hazır → yolda/teslim` akışında ilerler.
7. Öğrenci siparişlerini izler; uygun durumlarda işletme ile mesajlaşabilir.
8. Sipariş durumu bildirim olarak kullanıcıya iletilir.

## 7. CampusRide Akışı (çalışıyor)

1. Öğrenci sürücü doğrulaması ve araç bilgilerini girer.
2. Ride yöneticisi bekleyen sürücü/araç doğrulamalarını inceler.
3. Doğrulanmış kullanıcı ilan oluşturur; rota önizleme ve popüler noktalar kullanılabilir.
4. Yolcu ilana binis/inis noktalarıyla katılım talebi gönderir.
5. Talep edilen koltuk sayısı ilandaki boş koltuğu aşamaz.
6. Sürücü talebi kabul eder veya reddeder.
7. Kabul edilen yolculuk tamamlanır; taraflar puanlama/şikayet akışlarını kullanabilir.
8. İlgili talep üzerinden sürücü-yolcu mesajlaşması açılabilir.

## 8. Mesajlaşma Akışı (çalışıyor)

1. Food veya Ride gibi bir domain, ilgili bağlam için konuşma açar ya da kapatır.
2. Kullanıcı `/mesajlar` ekranında konuşmalarını ve okunmamış sayısını görür.
3. Konuşma içinden mesaj gönderilir; yeni mesajlar SSE ile istemciye akar.
4. Konuşma okundu işaretlenebilir.

## 9. Planlanan Modül Akışları (hedef tasarım — henüz kodlanmadı)

### Proje Eşleştirme (projectmatch)
Beceri profili → proje ilanı → uyum skoru → davet → ekip oluşturma.

### Mikro İş (microjob)
İş ilanı → teklif toplama → anlaşma/kontrat → teslim/onay → karşılıklı puanlama; itibar göstergeleri.

> Bu akışların durum makineleri ve iş kuralları, ilgili servisler geliştirildiğinde detaylandırılacaktır.
