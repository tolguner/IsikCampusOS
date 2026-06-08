# UniEats — Kampüs Yemek Sipariş & Teslimat Modülü (food-service) — Detaylı Tasarım

> Durum: **TASARIM ONAYLANDI** (kullanıcı kararlarıyla, 2026-06). Hedef: kod yazımı için sözleşme.
> Mevcut mimariyle (db-per-service, common-security, Türkçe Kafka konuları, Eureka, gateway,
> `com.isik.kampusos.*`) ve `docs/proje` + tez tasarımıyla uyumludur.

## 1. Kapsam, aktörler, roller

**Amaç:** Öğrenci yurttan/kampüsten **çevrimiçi yemek siparişi** verir; sipariş **kurye ile teslim**
edilir. Öğrenci durumu **anlık** izler. İşletme (satıcı), siparişleri durum makinesiyle yönetir,
teslim ve **ödeme yöntemini** işaretler, **online sipariş cirosunu** raporlar.

| Aktör | Rol | Yetkiler |
|---|---|---|
| Öğrenci | `ROLE_STUDENT` | Satıcı/menü görüntüleme, **teslim adresi + ödeme yöntemi** ile sipariş, kendi siparişlerini anlık izleme, iptal (yalnızca BEKLEMEDE) |
| İşletme yöneticisi | `ROLE_VENDOR_ADMIN` *(yeni)* | Menü yönetimi, gelen siparişler, durum geçişleri (kabul→hazırla→hazır→**yolda→teslim**), teslimde **ödeme yöntemini işaretleme**, **ciro raporu** |
| Sistem yöneticisi | `ROLE_ADMIN` | Satıcı kaydı oluşturma/pasifleştirme, işletme yöneticisi hesabı açma (mevcut yönetim paneli) |

> **Kurye:** Ayrı sistem rolü YOK. Kurye işletmenin teslimat personelidir; sistemde teslim ve
> ödeme işaretlemesini **işletme yöneticisi** yapar (kullanıcı kararı).

**Ödeme:** Gerçek ödeme entegrasyonu **kapsam dışı**. Öğrenci sipariş anında **Nakit / Kredi Kartı**
seçer (planlanan, bilgi amaçlı). Teslimde işletme **fiilen tahsil edilen** yöntemi işaretler →
sipariş tamamlanır ve **ciro kaydına** girer.

## 2. Servis & altyapı

- **Yeni modül:** `services/food-service`, paket `com.isik.kampusos.yemek`, port **8087**, DB **food_db**.
- common-security (JWT filtresi + CORS + hata) + web + data-jpa + postgresql + flyway + kafka +
  eureka-client + lombok — diğer servislerle aynı.
- Parent `pom.xml` `<modules>`, `docker-compose.yml` (volume + `java -jar`, JWT_SECRET, Kafka,
  datasource), gateway route'ları, `ROLE_VENDOR_ADMIN` eklenir.

## 3. Veri modeli (`food_db`) — PK VARCHAR(36), Türkçe sütun, servis-içi FK, CHECK, zaman damgası

### 3.1 `saticilar` (işletme)
```
id PK · ad NOT NULL · aciklama TEXT · konum_metni · logo_url
yonetici_kullanici_id NOT NULL        -- ROLE_VENDOR_ADMIN kullanıcısı
acik BOOLEAN DEFAULT TRUE             -- siparişe açık/kapalı
durum DEFAULT 'AKTIF'  CHECK IN ('AKTIF','PASIF')
olusturulma_tarihi, guncellenme_tarihi
```

### 3.2 `menu_ogeleri`
```
id PK · satici_id FK->saticilar
ad NOT NULL · aciklama · kategori (Ana Yemek/İçecek/Tatlı...) · fiyat DECIMAL(10,2) NOT NULL
gorsel_url · mevcut BOOLEAN DEFAULT TRUE
durum DEFAULT 'AKTIF' CHECK IN ('AKTIF','ARSIVLENDI')
olusturulma_tarihi, guncellenme_tarihi
```

### 3.3 `siparisler`
```
id PK · satici_id FK->saticilar · musteri_kullanici_id NOT NULL
durum NOT NULL  CHECK IN ('BEKLEMEDE','KABUL_EDILDI','HAZIRLANIYOR','HAZIR','YOLDA','TESLIM_EDILDI','REDDEDILDI','IPTAL_EDILDI')
toplam_tutar DECIMAL(10,2) NOT NULL
teslim_adresi VARCHAR(500) NOT NULL          -- yurt/bina/oda/konum (serbest metin)
odeme_yontemi VARCHAR(20) NOT NULL  CHECK IN ('NAKIT','KREDI_KARTI')   -- öğrenci seçimi (planlanan)
tahsil_edilen_odeme VARCHAR(20)     CHECK IN ('NAKIT','KREDI_KARTI')   -- teslimde işaretlenen (fiilî)
musteri_notu VARCHAR(500) · telefon VARCHAR(20)
red_nedeni VARCHAR(255) · tahmini_hazir_dakika INTEGER
olusturulma_tarihi NOT NULL · kabul_tarihi · hazir_tarihi · yola_cikis_tarihi · teslim_tarihi · iptal_tarihi
```

### 3.4 `siparis_kalemleri` (ad/fiyat snapshot)
```
id PK · siparis_id FK->siparisler · menu_ogesi_id
urun_adi NOT NULL · birim_fiyat DECIMAL(10,2) NOT NULL · adet INTEGER NOT NULL · ara_toplam DECIMAL(10,2) NOT NULL
```

İndeksler: `siparisler(musteri_kullanici_id, olusturulma_tarihi DESC)`,
`siparisler(satici_id, durum, olusturulma_tarihi DESC)`, `siparisler(satici_id, durum)`,
`menu_ogeleri(satici_id, durum)`.

## 4. Sipariş durum makinesi (teslimat akışı)

```
   öğrenci sipariş verir (teslim adresi + ödeme yöntemi)
            │
        [BEKLEMEDE] ──(öğrenci iptal)──► [IPTAL_EDILDI]
        /         \
 (işletme kabul) (işletme reddet+neden)
       │                 │
 [KABUL_EDILDI]     [REDDEDILDI]
       │
 (hazırlamaya başla)
       │
 [HAZIRLANIYOR]
       │
 (hazır)
       │
   [HAZIR] ──► öğrenciye anlık bildirim
       │
 (kurye aldı / yola çıktı — işletme işaretler)
       │
   [YOLDA] ──► öğrenciye anlık bildirim
       │
 (teslim edildi — işletme fiilî ödeme yöntemini işaretler)
       │
 [TESLIM_EDILDI]  ──► ciro kaydına girer
```

**Guard kuralları (backend enforce):**
- Tüm ileri geçişleri yalnızca siparişin **işletme yöneticisi** yapar; iptal yalnızca **müşteri** (yalnızca `BEKLEMEDE`).
- `TESLIM_EDILDI` işaretlenirken `tahsil_edilen_odeme` (NAKIT/KREDI_KARTI) **zorunlu**.
- Her geçiş ilgili zaman damgasını yazar; geçersiz geçiş → 409.

## 5. Olay-güdümlü anlık takip (Kafka → SSE)

Her müşteri-görünür durum değişiminde (`KABUL_EDILDI, HAZIRLANIYOR, HAZIR, YOLDA, TESLIM_EDILDI, REDDEDILDI`)
food-service `bildirim.olustur` Kafka olayı üretir:
- `hedefKitle = KULLANICI`, `aliciKullaniciId = musteri_kullanici_id`
- `tur = SIPARIS_DURUMU` *(notification BildirimTuru'ya eklenecek + CHECK V7)*
- mesaj: "Siparişiniz hazırlanıyor", "Siparişiniz yola çıktı", "Siparişiniz teslim edildi" vb.

notification-service persist eder → **mevcut SSE** ile öğrenciye **anlık** iletir. Öğrenci
"Siparişlerim" ekranında durumu canlı görür.

## 6. Ciro / rapor (işletme)

`GET /api/v1/satici/ciro?baslangic=&bitis=` → yalnızca **TESLIM_EDILDI** online siparişler için:
- toplam ciro, sipariş sayısı, **Nakit toplamı**, **Kredi Kartı toplamı**, günlük/aralık kırılımı.
- İşletme yalnızca kendi satıcısının kayıtlarını görür.

## 7. API uçları

### Öğrenci
| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/v1/saticilar` | Aktif + açık işletmeler |
| GET | `/api/v1/saticilar/{id}/menu` | İşletmenin sunulabilir menüsü |
| POST | `/api/v1/siparisler` | Sipariş `{saticiId, kalemler:[{menuOgesiId,adet}], teslimAdresi, odemeYontemi, telefon, musteriNotu}` |
| GET | `/api/v1/siparisler/benim` | Kendi siparişleri + durum |
| POST | `/api/v1/siparisler/{id}/iptal` | İptal (yalnızca BEKLEMEDE) |

### İşletme yöneticisi (`ROLE_VENDOR_ADMIN`)
| Yöntem | Yol | Açıklama |
|---|---|---|
| GET / PUT | `/api/v1/satici` | Kendi işletme bilgisi / güncelle + aç-kapat |
| GET/POST/PUT/DELETE | `/api/v1/satici/menu[/{id}]` | Menü CRUD |
| GET | `/api/v1/satici/siparisler` | Gelen siparişler (durum filtreli) |
| POST | `.../siparisler/{id}/kabul` `/reddet`{neden} `/hazirla` `/hazir` `/yolda` | Durum geçişleri |
| POST | `.../siparisler/{id}/teslim` `{tahsilEdilenOdeme}` | TESLIM_EDILDI + ödeme işaretle |
| GET | `/api/v1/satici/ciro` | Online sipariş ciro raporu (Nakit/KK kırılımı) |

### Sistem yöneticisi (`ROLE_ADMIN`)
| Yöntem | Yol | Açıklama |
|---|---|---|
| GET/POST | `/api/v1/yonetim/saticilar` | Satıcı listele / oluştur `{ad, yoneticiKullaniciId, konumMetni...}` |
| PUT | `/api/v1/yonetim/saticilar/{id}` | Güncelle / pasifleştir |

Gateway: bu yollar `lb://FOOD-SERVICE`'e `KimlikDogrulama` ile yönlenir; rol kontrolü
food-service `SecurityConfig`'de path/role bazlı.

## 8. Frontend ekran akışları

**Öğrenci** — Nav: "Yemek"
- `SaticilarSayfasi`: açık/kapalı rozetli işletme kartları.
- `SaticiMenuSayfasi`: kategoriye göre menü + **sepet** (adet, toplam) → **teslim adresi + ödeme yöntemi (Nakit/KK) + telefon** → "Sipariş Ver".
- `SiparislerimSayfasi`: aktif + geçmiş, **canlı durum (SSE)**; durum adımları görsel.

**İşletme yöneticisi** — `SaticiPaneli` (sekmeler)
- **Sipariş Panosu:** Bekleyen / Hazırlanan / Hazır / Yolda sütunları; kabul-reddet-hazırla-hazır-yolda-teslim aksiyonları; teslimde **ödeme yöntemi (Nakit/KK)** seçimi.
- **Menü Yönetimi:** öğe CRUD (ad, kategori, fiyat, görsel, mevcut/stok), işletme aç/kapat.
- **Ciro / Rapor:** tarih aralığı + toplam + Nakit/KK kırılımı (yalnızca online siparişler).

**Sistem yöneticisi** — Yönetim Paneli'ne "Satıcılar" bölümü (oluştur: ad + yönetici kullanıcı + konum).

## 9. Güvenlik

food-service `SecurityConfig` (common-security `JwtKimlikFiltresi`):
- `GET /api/v1/saticilar/**` → authenticated · `/api/v1/siparisler/**` → `ROLE_STUDENT`
- `/api/v1/satici/**` → `ROLE_VENDOR_ADMIN` · `/api/v1/yonetim/saticilar/**` → `ROLE_ADMIN`
- Sahiplik servis katmanında (öğrenci yalnızca kendi siparişi; işletme yalnızca kendi satıcısı).

## 10. Yapım sırası (her faz: derle + API/UI test + commit)

1. **Faz 1 — Backend çekirdek:** modül iskeleti + Flyway şema + entity/depo + satıcı/menü/sipariş
   servisleri + durum makinesi (teslimat) + ödeme/ciro + güvenlik + Kafka(SIPARIS_DURUMU) + gateway +
   `ROLE_VENDOR_ADMIN` + admin satıcı uçları + seed. **API uçtan uca test + commit.**
2. **Faz 2 — Öğrenci frontend:** satıcılar/menü/sepet/teslim-adresi/ödeme + sipariş + canlı durum (SSE).
3. **Faz 3 — İşletme paneli:** sipariş panosu + ödeme işaretleme + menü yönetimi + ciro raporu.
4. **Faz 4 — Admin satıcı yönetimi UI** + nav/rol yönlendirmeleri.

## 11. Tezle hizalama

Tez (Bölüm 3.6, Şekil 3.7 sipariş durum makinesi) UniEats'i "uygulanmış" dille anlatır; bu modül o
tasarımı gerçeğe çevirir. Tez metnindeki sipariş durum diyagramı buradaki §4 (teslimat akışı) ile
hizalanmalıdır (HAZIR→YOLDA→TESLIM_EDILDI + ödeme işaretleme dahil).
