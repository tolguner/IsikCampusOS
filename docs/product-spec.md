# IsikCampusOS Urun Gereksinimleri

## 1. Urun Tanimi

IsikCampusOS, Işik Universitesi ogrencilerinin kampus ici operasyonel ihtiyaclarini ve sosyal koordinasyon sureclerini tek platform altinda birlestiren moduler bir kampus uygulamasidir.

Platformun temel amaci:

- kampus ici sureclerde bilgi daginikligini azaltmak
- ogrencilerin hizmetlere daha hizli ve guvenli erisimini saglamak
- kulup, tesis ve kampus ici isletme operasyonlarini olculebilir hale getirmek
- kampus icindeki sosyal etkileşimi, is birligini ve uretkenligi artirmak

## 2. Problem Alanlari

Kampus hayati icinde bircok surec farkli kanallarda yurur:

- WhatsApp gruplari
- Instagram DM
- Google Sheets / Excel
- sozlu / manuel koordinasyon
- daginik kulup duyurulari

Bu daginik yapi su problemlere neden olur:

- Erisilebilirlik dusuk olur, herkes guncel bilgiye ayni anda ulasamaz.
- Rezervasyon, siparis ve etkinlik surecleri plansiz ilerler.
- No-show, kapasite asimi ve iptaller artar.
- Carpool ve mikro is gibi alanlarda guven ve hesap verebilirlik zayif olur.
- Ogrenciler ekip arkadasi, etkinlik veya firsat bulmakta gecikir.
- Kampus yonetimi ve kulupler karar alabilecek veri uretemez.

## 3. Vizyon

Universite e-posta dogrulamasi ile calisan, modul bazli genisleyebilen, veri odakli ve urunlesebilir bir dijital kampus ekosistemi kurmak.

## 4. Basari Kriterleri

- Tek platform uzerinden aktif kullanim
- Haftalik aktif kullanici artisi
- Manuel koordinasyon ihtiyacinin azalmasi
- No-show ve iptal oranlarinin dusmesi
- Eslesme ve katilim oranlarinin artmasi
- Kullanici memnuniyet skorlarinin yukselmesi

## 5. Kullanici Rolleri

### Ogrenci

- tesis rezervasyonu yapar
- yemek siparisi verir
- ride ilanlari olusturur veya katilir
- etkinlikleri kesfeder ve RSVP yapar
- proje ekipleri icin profil olusturur
- mikro is ilanlari acabilir veya teklif verebilir

### Kulup Yetkilisi (`club_admin`)

- kendi kulubu adina etkinlik taslagi olusturur
- etkinlik kapasitesi ve katilimlarini yonetir
- etkinlik raporlarini gorur
- etkinlik yayini SKS onayina tabidir

### SKS Yetkilisi (`sks_admin`)

- kulup olusturma taleplerini onaylar veya reddeder
- kuluplere `club_admin` rolu atar
- etkinlik ve duyurulari yayin oncesi onaylar
- kulup bazli aktivite ve katilim raporlarini gorur
- gerektiginde kulubu askiya alabilir

### Isletme Yetkilisi (`vendor_admin`)

- menu yonetir
- siparisleri takip eder
- teslim ve hazirlama operasyonlarini gorur

### Tesis Yetkilisi (`facility_admin`)

- rezervasyon politikalarini belirler
- tesis uygunluk ve kapasite yonetimi yapar

### Moderator

- raporlanan icerikleri inceler
- kotuye kullanim ve spam sureclerini yonetir

### Admin

- tum sistemi ve rolleri yonetir
- guvenlik ve denetim panellerini izler
- analytics dashboard gorur

## 6. Ortak Platform Gereksinimleri

### Kimlik ve Erisim

- Universite e-postasi ile kayit ve dogrulama
- Rol bazli yetkilendirme
- Profil olusturma ve profil tamamlama

### Guven ve Moderasyon

- Raporlama mekanizmasi
- Degerlendirme ve puanlama
- Hesap gecmisi ve guven sinyalleri

### Bildirimler

- In-app bildirim
- E-posta bildirimleri
- Ileri fazda push bildirim

### Ortak Sosyal Katman

- temel profil bilgisi
- ilgi alanlari
- aktivite akisi
- istege bagli baglanti / takip mekanigi

## 7. Modul Gereksinimleri

### 7.1 Smart Facility Booking

Amac: Tesis, etut odasi ve spor alanlari gibi kampus kaynaklarinin verimli ve cakismaz sekilde rezerve edilmesi.

Temel yetenekler:

- kaynak listeleme
- takvim ve slot bazli gorunum
- rezervasyon olusturma
- rezervasyon iptali
- cakismazlik kontrolu
- check-in dogrulamasi
- no-show isaretleme

MVP siniri:

- kaynak listeleme
- uygun slot gorme
- rezervasyon olusturma ve iptal
- temel yonetici paneli

### 7.2 Campus Food Hub

Amac: Kampus ici yiyecek ve icecek isletmelerinden on siparis verilmesini ve teslim yogunlugunun dengelenmesini saglamak.

Temel yetenekler:

- isletme kaydi ve menu yonetimi
- urun listeleme
- sepet ve siparis
- teslim zamani secimi
- durum takibi
- teslim onayi

MVP siniri:

- vendor listeleme
- menu gorme
- sepet ve siparis
- siparis durum guncelleme

### 7.3 CampusRide

Amac: Kampus ici veya kampus-sehir arasi paylasimli yolculuklar icin daha guvenli eslesme sunmak.

Temel yetenekler:

- surucu veya yolcu ilani acma
- rota, tarih, saat ve kontenjan belirleme
- eslesme skoru hesaplama
- kampus dogrulamasi ile guven sinyali
- yolculuk sonrasi puanlama

MVP siniri:

- ride offer / request olusturma
- listeleme ve filtreleme
- basit eslesme mantigi
- puanlama

### 7.4 Smart Event Engine

Amac: Kulup etkinliklerinin yaratimi, kesfi, katilim yonetimi ve etki analizini tek yerde toplamak.

Temel yetenekler:

- etkinlik olusturma
- feed ve kesfet
- RSVP
- check-in
- geri bildirim toplama

MVP siniri:

- etkinlik olusturma
- etkinlik listeleme
- RSVP
- katilim raporu

### 7.5 ProjectMatch

Amac: Ogrencileri yetkinlik, ilgi ve musaitlige gore proje ekipleri ile bulusturmak.

Temel yetenekler:

- skill profili
- proje ilani
- uyum skoru
- davet akisi
- ekip olusturma

MVP siniri:

- skill profili
- proje ilani
- aday arama
- temel uyum skoru

### 7.6 Campus MicroJob Marketplace

Amac: Kampus ici kucuk olcekli islerin guvenli, izlenebilir ve puanlanabilir sekilde yonetilmesini saglamak.

Temel yetenekler:

- ilan olusturma
- teklif verme
- anlasma
- teslim / tamamlanma takibi
- derecelendirme

MVP siniri:

- is ilani
- teklif toplama
- anlasma ve durum guncelleme
- puanlama

## 8. Onceliklendirme

Tum modulleri ayni anda hayata gecirmek teknik risk ve urun karmasikligini artirir. Bu nedenle MVP icin asagidaki sira daha mantiklidir:

1. Docker Compose altyapisi + API Gateway + Eureka
2. Auth + Profile + Notification servisleri
3. Smart Event Engine
4. Smart Facility Booking
5. ProjectMatch
6. Campus Food Hub
7. CampusRide
8. Campus MicroJob Marketplace

Bu siralama, kampus icinde hizli benimsenme ve daha dusuk operasyonel risk saglar.

Microservis mimarisi geregi bu siralama once altyapi (api-gateway, auth, profile, notification) kurulumunu gerektirir; ardindan domain modulleri birer birer aktiflestirilir.

## 9. MVP Icinde Ortak Non-Functional Gereksinimler

- Mobil uyumlu arayuz
- Guvenli kimlik dogrulama
- Audit log
- Temel analitik event takibi
- Admin paneli icin raporlama yetenegi
- Ortalama yanit suresi hedefi: kritik aksiyonlarda 2 saniye alti

## 10. Urunlesme Potansiyeli

Bu sistem yalnizca bir kampus uygulamasi degil, diger universitelerde de uyarlanabilecek bir "moduler kampus operating system" urunune donusebilir.

Potansiyel gelisim alanlari:

- Cok kampuslu kullanim
- Mobil uygulama
- Kulup CRM yapisi
- Kampus icin sadakat / odul mekanigi
- AI destekli kesif ve eslesme motorlari
