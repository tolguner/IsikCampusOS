# IsikCampusOS — Doküman İndeksi

Bu dizin, IsikCampusOS projesinin tüm dokümantasyonunu içerir. Dokümanlar iki ana grupta toplanmıştır: **proje dokümantasyonu** ve **tez çalışması**.

## 📁 proje/ — Proje Dokümantasyonu

Sistemin teknik ve işlevsel dokümantasyonu. Tüm dosyalar projenin **gerçek kod durumunu** yansıtır; fiilen kodlanan modüller ile henüz plan aşamasındaki modüller açıkça ayrılmıştır.

| # | Doküman | İçerik |
|---|---------|--------|
| 01 | [Genel Bakış ve Vizyon](proje/01-genel-bakis-ve-vizyon.md) | Proje tanımı, vizyon, modül durum tablosu, kullanıcılar |
| 02 | [Mimari](proje/02-mimari.md) | Mikroservis mimarisi, servis kataloğu, iletişim, gateway rotaları |
| 03 | [Veritabanı Tasarımı](proje/03-veritabani-tasarimi.md) | Servis başına DB, gerçek entity'ler, planlanan modeller |
| 04 | [API Sözleşmesi](proje/04-api-sozlesmesi.md) | Gerçek uç noktalar (kimlik, profil, kulüp, etkinlik, tesis, yemek, yolculuk, bildirim, mesajlaşma) |
| 05 | [Roller ve Yetkiler](proje/05-roller-ve-yetkiler.md) | Rol modeli, yetki matrisi, iş kuralları |
| 06 | [Kullanıcı Akışları](proje/06-kullanici-akislari.md) | Kayıt, kulüp/etkinlik, tesis, bildirim akışları |
| 07 | [Çalıştırma Rehberi](proje/07-calistirma-rehberi.md) | Yerel kurulum ve başlatma |
| 08 | [Yol Haritası ve Durum](proje/08-yol-haritasi-ve-durum.md) | Mevcut durum, teknik borçlar, sonraki adımlar |

## 📁 tez/ — Bitirme Tezi

Yönetim Bilişim Sistemleri lisans bitirme tezi (Türkçe). Tezin tam ve güncel metni
tek bir Word dosyasında tutulur:

- **[IsikCampusOS_Tez.docx](tez/IsikCampusOS_Tez.docx)** — teslim edilen tez metni
- `tez/build/_sablon_kaynak.docx` — biçimlendirme şablonu (kaynak dosya)

Tezin daha önce ayrı markdown bölümleri hâlinde tutulan taslakları kaldırılmıştır;
geçmiş sürümlere git tarihinden erişilebilir.

## 📄 Diğer

- **[afis.pdf](afis.pdf)** — bitirme projesi afişi

## Notlar

- **Kod gerçekliği:** Backend Türkçeleştirilmiştir (`com.isik.kampusos.*`). Çalışan servisler: eureka, gateway, auth, profile, club, notification, facility, food, ride ve message. ProjectMatch ve MicroJob modülleri kodlanmamıştır; tez kapsamında tasarım düzeyinde ele alınmış olup gerçekleştirimleri gelecek çalışmaya bırakılmıştır (bkz. Bölüm 5.1.1 ve 6.3). Yerel mobil uygulama da aynı şekilde kapsam dışıdır.
- **Tutarlılık ilkesi:** Tüm proje dokümanlarında "kodlandı" (✅) ve "planlandı" (🔵) ayrımı korunur.
