# IsikCampusOS — Bitirme Tezi (İndeks)

**Başlık (öneri):** IsikCampusOS: Mikroservis Mimarisiyle Geliştirilen Bütünleşik Bir Akıllı Kampüs Platformu

Bu klasör, Yönetim Bilişim Sistemleri lisans bitirme tezinin tüm parçalarını içerir. Tez Türkçe yazılmıştır ve nihai çıktı Word (.docx) olacaktır.

## Tez Yapısı (sıralı)

### Ön Kısımlar (roman rakamı ile numaralanır)
- [Kapak / Başlık · Adanan · Teşekkür](on-kisimlar.md) — kapak bilgileri, ithaf ve teşekkür
- Onay Sayfası *(Word şablonundan)*
- [Özet ve Abstract](ozet_abstract.md) — TR Özet (225 kelime) + EN Abstract (252 kelime), anahtar kelimeler
- İçindekiler *(Word otomatik)*
- Şekiller Listesi, Tablolar Listesi *(Word otomatik)*
- [Kısaltmalar](kisaltmalar.md)

**Kapak bilgileri:** Işık Üniversitesi, İİSBF, YBS Bölümü · Öğrenci: Tolga Olguner (23YÖBİ1053) · Danışman: Dr. Şahin Aydın · Haziran 2026 · Yazı tipi: **Palatino Linotype** (şablon ile uyumlu)

### Ana Bölümler (Bölüm 1'den itibaren sayfa numarası)
| Bölüm | Dosya | İçerik |
|-------|-------|--------|
| 1 | [Giriş](bolum1_giris.md) | Arka plan/motivasyon, problem, kapsam ve amaç |
| 2 | [Literatür Taraması](bolum2_literatur_taramasi.md) | Dijital dönüşüm, bütünleştirme, UX/güven, modül çözümleri, boşluk |
| 3 | [Metodoloji ve Sistem Tasarımı](bolum3_yontem.md) | Metodoloji, mimari, güvenlik, olay akışı, veri tabanı, modüller, algoritmalar |
| 4 | [Geliştirme](bolum4_gelistirme.md) | Teknoloji, çekirdek altyapı, modüller, arayüz, zorluklar |
| 5 | [Değerlendirme ve Sonuçlar](bolum5_degerlendirme.md) | Sonuçlar (gereksinim karşılama), tartışma |
| 6 | [Sonuç ve Gelecek Yönelimleri](bolum6_sonuc.md) | Genel sonuç, sınırlılıklar, gelecek çalışmalar |

### Son Kısımlar
- [Kaynakça](kaynakca.md) — 31 kaynak, tek alfabetik liste, APA 7
- Ekler *(varsa)*

## Görseller (Şekiller ve Tablolar)

**Şekiller (Bölüm 3 — Mermaid, doğrudan kullanılabilir):**
- Şekil 3.1 Genel Sistem Mimarisi · 3.2 JWT Kimlik Doğrulama · 3.3 Olay Güdümlü Kayıt · 3.4 ER Diyagramı · 3.5 Etkinlik Durum Makinesi · 3.6 Rezervasyon Çakışma Kontrolü · 3.7 Sipariş Durum Makinesi · 3.8 MicroJob Durum Makinesi · 3.9 SPA-T Eşleştirme

**Şekiller (Bölüm 4 — ekran görüntüsü, kullanıcı ekleyecek):**
- Şekil 4.1 Giriş · 4.2 Öğrenci Paneli · 4.3 Kulüp/Etkinlik · 4.4 Tesis Rezervasyon · 4.5 SKS Onay

**Tablolar:** 3.1 Servis Kataloğu · 3.2 Kafka Olayları · 3.3 Servis-Veri Tabanı · 4.1 Teknoloji Yığını · 5.1 Gereksinim Karşılama

## Yazım Kuralları (resmî yönerge — YOBI_Rapor_Yonergesi.docx ile doğrulandı)
- Yazı tipi: **Palatino Linotype** (tüm tezde tutarlı — karar verildi), 12 punto
- Satır aralığı 1,5; iki yana yaslı (justify); paragraf ilk satır 1,27 cm girinti; paragraf arası ekstra boşluk yok
- Kenar boşlukları 2,54 cm; Bölüm 1'den itibaren sayfa no, öncesi roman rakamı
- Stiller: Bölüm başlıkları H1, tamamlayıcı başlıklar H3, alt başlıklar H5
- İçindekiler / Şekil / Tablo listeleri Word otomatik araçlarıyla
- Atıflar ve kaynakça APA 7; metin içi atıf ↔ kaynakça birebir uyumlu (✓ doğrulandı)
- Denklemler Word denklem editörüyle yazılacak (Bölüm 3.7)

## Notlar
- Bölüm başlıklarında Markdown `#` = H1, `###` = H3, `#####` = H5 eşlemesi yönergeye göredir.
- Yardımcı/çalışma dosyaları `_calisma/` klasöründedir (tez parçası değildir).
- Mermaid diyagramlar Word'de desteklenmiyorsa draw.io/diagrams.net ile yeniden çizilebilir.
