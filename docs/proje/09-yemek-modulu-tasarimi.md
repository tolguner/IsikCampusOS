# UniEats — Kampüs Yemek Sipariş & Teslimat Modülü (food-service) — Detaylı Tasarım

> Durum: **UYGULANDI** (2026-06). Faz 1–4 (çekirdek) + UberEats benzeri zenginleştirme
> Faz A–E tamamlandı; food_db şeması **V1→V5** Flyway migration'larıyla taşındı.
> Mevcut mimariyle (db-per-service, common-security, Türkçe Kafka konuları, Eureka, gateway,
> `com.isik.kampusos.*`) ve `docs/proje` + tez tasarımıyla uyumludur.
>
> **UberEats benzeri zenginleştirme (Faz A–E):** gün bazlı çalışma saatleri + zengin işletme
> profili (mutfak türü, kapak görseli, teslimat ücreti/süresi, min. sepet); arama/filtre/sıralama;
> kampanya/indirim (yüzde/tutar/ücretsiz teslimat); ürün seçenekleri/ekstralar (boy, +malzeme);
> favori satıcılar. Detaylar ilgili bölümlerde işaretlidir.

## 1. Kapsam, aktörler, roller

**Amaç:** Öğrenci yurttan/kampüsten **çevrimiçi yemek siparişi** verir; sipariş **kurye ile teslim**
edilir. Öğrenci durumu **anlık** izler. İşletme (satıcı), siparişleri durum makinesiyle yönetir,
teslim ve **ödeme yöntemini** işaretler, **online sipariş cirosunu** raporlar.

| Aktör | Rol | Yetkiler |
|---|---|---|
| Öğrenci | `ROLE_STUDENT` | Satıcı **arama/filtre/sıralama**, menü görüntüleme, **ürün seçenekleriyle** sipariş (teslim adresi + ödeme yöntemi), kendi siparişlerini anlık izleme, iptal (yalnızca BEKLEMEDE), **favori satıcılar** |
| İşletme yöneticisi | `ROLE_VENDOR_ADMIN` *(yeni)* | İşletme profili + **çalışma saatleri**, menü yönetimi (**seçenek grupları/öne çıkan**), **kampanyalar**, gelen siparişler, durum geçişleri (kabul→hazırla→hazır→**yolda→teslim**), teslimde **ödeme yöntemini işaretleme**, **ciro raporu** |
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

> Şema sürümleri: **V1** çekirdek (3.1–3.4); **V2** çalışma saatleri + profil (3.1, 3.5);
> **V3** sipariş tutar kırılımı + kampanyalar (3.3, 3.6); **V4** menü seçenekleri + öne çıkan (3.2, 3.7, 3.8);
> **V5** favoriler (3.9). *(yeni)* etiketli sütun/tablolar V2–V5 ile gelmiştir.

### 3.1 `saticilar` (işletme)
```
id PK · ad NOT NULL · aciklama TEXT · konum_metni · logo_url
yonetici_kullanici_id NOT NULL        -- ROLE_VENDOR_ADMIN kullanıcısı
acik BOOLEAN DEFAULT TRUE             -- manuel ana anahtar (yoğunlukta zorla kapatma)
durum DEFAULT 'AKTIF'  CHECK IN ('AKTIF','PASIF')
mutfak_turu                          -- (yeni V2) Fast Food/Kafe/Tatlı... — filtre
kapak_gorsel_url TEXT                 -- (yeni V2) hero/kapak görseli
teslimat_ucreti DECIMAL(10,2) DEFAULT 0          -- (yeni V2)
minimum_sepet_tutari DECIMAL(10,2) DEFAULT 0     -- (yeni V2)
tahmini_teslimat_dakika INTEGER       -- (yeni V2)
olusturulma_tarihi, guncellenme_tarihi
```

### 3.2 `menu_ogeleri`
```
id PK · satici_id FK->saticilar
ad NOT NULL · aciklama · kategori (Ana Yemek/İçecek/Tatlı...) · fiyat DECIMAL(10,2) NOT NULL
gorsel_url · mevcut BOOLEAN DEFAULT TRUE
one_cikan BOOLEAN DEFAULT FALSE       -- (yeni V4) öne çıkan/popüler
durum DEFAULT 'AKTIF' CHECK IN ('AKTIF','ARSIVLENDI')
olusturulma_tarihi, guncellenme_tarihi
```

### 3.3 `siparisler`
```
id PK · satici_id FK->saticilar · musteri_kullanici_id NOT NULL
durum NOT NULL  CHECK IN ('BEKLEMEDE','KABUL_EDILDI','HAZIRLANIYOR','HAZIR','YOLDA','TESLIM_EDILDI','REDDEDILDI','IPTAL_EDILDI')
ara_toplam DECIMAL(10,2) DEFAULT 0    -- (yeni V3) kalemler toplamı (seçenek ek fiyatları dahil)
teslimat_ucreti DECIMAL(10,2) DEFAULT 0   -- (yeni V3) sipariş anı snapshot
indirim_tutari DECIMAL(10,2) DEFAULT 0    -- (yeni V3) uygulanan kampanya indirimi
kampanya_id                           -- (yeni V3) uygulanan kampanya snapshot (varsa)
toplam_tutar DECIMAL(10,2) NOT NULL   -- = ara_toplam + teslimat_ucreti − indirim_tutari
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
urun_adi NOT NULL · birim_fiyat DECIMAL(10,2) NOT NULL   -- ürün fiyatı + seçilen opsiyon ek fiyatları
adet INTEGER NOT NULL · ara_toplam DECIMAL(10,2) NOT NULL
secimler_ozeti VARCHAR(500)           -- (yeni V4) seçilen opsiyon adları, örn. "Büyük, Ekstra peynir"
```

### 3.5 `satici_calisma_saatleri` *(yeni V2)*
```
id PK · satici_id FK->saticilar
gun SMALLINT NOT NULL  CHECK 1..7      -- 1=Pazartesi … 7=Pazar
acilis TIME · kapanis TIME · kapali BOOLEAN DEFAULT FALSE
UNIQUE(satici_id, gun)
```
**Anlık açık/kapalı hesabı:** `durum=AKTIF && acik(manuel) && bugünkü kayıt var && !kapali && now ∈ [acilis,kapanis)`.
Yanıt `suAnAcik` (bool) + `sonrakiAcilis` ("Bugün/Yarın/Gün HH:mm") taşır; sipariş yalnızca açıkken verilebilir.

### 3.6 `kampanyalar` *(yeni V3)*
```
id PK · satici_id FK->saticilar · ad NOT NULL
tur NOT NULL  CHECK IN ('YUZDE','TUTAR','UCRETSIZ_TESLIMAT')
deger DECIMAL(10,2) DEFAULT 0         -- YUZDE: %; TUTAR: ₺
min_sepet_tutari DECIMAL(10,2) DEFAULT 0
aktif BOOLEAN DEFAULT TRUE · olusturulma_tarihi, guncellenme_tarihi
```
Sipariş anında **uygun en yüksek indirimli** aktif kampanya otomatik uygulanır.

### 3.7 `menu_secenek_gruplari` *(yeni V4 — modifier groups)*
```
id PK · menu_ogesi_id FK->menu_ogeleri · ad NOT NULL  -- örn. "Boy", "Ekstra"
tur NOT NULL  CHECK IN ('TEK_SECIM','COKLU_SECIM')
zorunlu BOOLEAN DEFAULT FALSE · siralama INTEGER DEFAULT 0
```

### 3.8 `menu_secenekleri` *(yeni V4)*
```
id PK · grup_id FK->menu_secenek_gruplari · ad NOT NULL  -- örn. "Büyük"
ek_fiyat DECIMAL(10,2) DEFAULT 0 · siralama INTEGER DEFAULT 0
```
Sipariş anında: zorunlu grup → seçim yoksa 400; TEK_SECIM → en çok 1; birim fiyat = ürün + seçili ek_fiyatlar.

### 3.9 `favori_saticilar` *(yeni V5)*
```
id PK · kullanici_id NOT NULL · satici_id FK->saticilar · eklenme_tarihi
UNIQUE(kullanici_id, satici_id)
```

İndeksler: `siparisler(musteri_kullanici_id, olusturulma_tarihi DESC)`,
`siparisler(satici_id, durum, olusturulma_tarihi DESC)`, `siparisler(satici_id, durum)`,
`menu_ogeleri(satici_id, durum)`, `satici_calisma_saatleri(satici_id)`,
`kampanyalar(satici_id, aktif)`, `menu_secenek_gruplari(menu_ogesi_id)`,
`menu_secenekleri(grup_id)`, `favori_saticilar(kullanici_id)`.

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
- `tur = SIPARIS_DURUMU` *(notification BildirimTuru ve CHECK migrasyonlarında desteklenir)*
- mesaj: "Siparişiniz hazırlanıyor", "Siparişiniz yola çıktı", "Siparişiniz teslim edildi" vb.

notification-service persist eder → **mevcut SSE** ile öğrenciye **anlık** iletir. Öğrenci
"Siparişlerim" ekranında durumu canlı görür.

## 6. Sipariş tutarı, ciro / rapor (işletme)

**Sipariş tutar hesabı (backend, sipariş anında):**
`ara_toplam = Σ (ürün fiyatı + seçili opsiyon ek_fiyatları) × adet` → **min. sepet** kontrolü
(altındaysa 409) → uygun en yüksek indirimli aktif **kampanya** uygulanır (`indirim_tutari`) →
`toplam_tutar = ara_toplam + teslimat_ucreti − indirim_tutari`. Ayrıca satıcı **o an açık değilse 409**.

**Ciro:** `GET /api/v1/satici/ciro?baslangic=&bitis=` → yalnızca **TESLIM_EDILDI** online siparişler için:
- toplam ciro, sipariş sayısı, **Nakit toplamı**, **Kredi Kartı toplamı**, günlük/aralık kırılımı.
- İşletme yalnızca kendi satıcısının kayıtlarını görür.

## 7. API uçları

### Öğrenci
| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/v1/saticilar?ara=&mutfak=&sirala=` | Aktif işletmeler (arama/mutfak filtre/sıralama) + `suAnAcik`/`sonrakiAcilis`/profil/çalışma saatleri |
| GET | `/api/v1/saticilar/{id}` | Tek satıcı (zenginleştirilmiş yanıt) |
| GET | `/api/v1/saticilar/mutfak-turleri` | Filtre için mevcut mutfak türleri *(yeni B)* |
| GET | `/api/v1/saticilar/{id}/menu` | Menü (öne çıkan + **seçenek grupları** dahil) |
| POST | `/api/v1/siparisler` | Sipariş `{saticiId, kalemler:[{menuOgesiId,adet,secilenSecenekIdleri}], teslimAdresi, odemeYontemi, telefon, musteriNotu}` |
| GET | `/api/v1/siparisler/benim` | Kendi siparişleri + durum + tutar dökümü |
| POST | `/api/v1/siparisler/{id}/iptal` | İptal (yalnızca BEKLEMEDE) |
| GET/POST/DELETE | `/api/v1/favoriler[/{saticiId}]` | Favori listesi / ekle / çıkar *(yeni E)* |

### İşletme yöneticisi (`ROLE_VENDOR_ADMIN`)
| Yöntem | Yol | Açıklama |
|---|---|---|
| GET / PUT | `/api/v1/satici` | İşletme profili / güncelle (mutfak, kapak, teslimat ücreti/süre, min. sepet, aç-kapat) |
| GET / PUT | `/api/v1/satici/calisma-saatleri` | Haftalık çalışma saatleri *(yeni A)* |
| GET/POST/PUT/DELETE | `/api/v1/satici/menu[/{id}]` | Menü CRUD (öne çıkan + **seçenek grupları/seçenekleri** dahil) |
| GET/POST/PUT/DELETE | `/api/v1/satici/kampanyalar[/{id}]` | Kampanya CRUD *(yeni C)* |
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

**Öğrenci** — Nav: "Yemek" (`YemekSayfasi`, `YemekSiparislerimSayfasi`)
- **Vitrin:** arama çubuğu + mutfak türü çipleri + **Favorilerim** filtresi + sıralama; kapak görselli
  kartlar (mutfak türü, **açık/"X'da açılır"** rozeti, teslimat süresi/ücreti/min, **kalp ikonu**).
- **Menü:** hero kapak + çalışma saatleri tablosu + kategorili menü (görseller, **öne çıkan** rozeti);
  seçenekli ürün → **seçenek modalı** (TEK_SECIM/COKLU_SECIM, canlı fiyat) → sepet (seçim özetli).
- **Sepet/ödeme:** ara toplam + teslimat + toplam dökümü, min. sepet uyarısı; kapalıyken sipariş kilitli.
- **Siparişlerim:** aktif + geçmiş, **canlı durum (SSE)**, durum çizelgesi + tutar dökümü (indirim dahil).

**İşletme yöneticisi** — `IsletmePaneli` (sekmeler: Siparişler / Menü / **Kampanyalar** / Ciro / **Ayarlar**)
- **Siparişler:** Aktif/Geçmiş; kabul-reddet-hazırla-hazır-yolda-teslim aksiyonları; teslimde **ödeme yöntemi (Nakit/KK)**.
- **Menü:** öğe CRUD (ad, kategori, fiyat, görsel, mevcut, **öne çıkan**, **seçenek grupları/seçenekleri editörü**).
- **Kampanyalar:** kampanya CRUD (tür/değer/min. sepet/aktif).
- **Ciro:** tarih aralığı + toplam + Nakit/KK kırılımı.
- **Ayarlar:** işletme profili (mutfak, kapak, teslimat ücreti/süre, min. sepet) + **7 günlük çalışma saati editörü** + aç-kapat.

**Sistem yöneticisi** — Yönetim Paneli'ne "Satıcılar" bölümü (oluştur: ad + yönetici kullanıcı + konum).

## 9. Güvenlik

food-service `SecurityConfig` (common-security `JwtKimlikFiltresi`):
- `GET /api/v1/saticilar/**` → authenticated · `/api/v1/siparisler/**` ve `/api/v1/favoriler/**` → `ROLE_STUDENT`
- `/api/v1/satici/**` → `ROLE_VENDOR_ADMIN` · `/api/v1/yonetim/saticilar/**` → `ROLE_ADMIN`
- Sahiplik servis katmanında (öğrenci yalnızca kendi siparişi/favorisi; işletme yalnızca kendi satıcısı/menüsü/kampanyası).
- Gateway: `/api/v1/saticilar`, `/siparisler`, `/satici`, `/favoriler`, `/yonetim/saticilar` → `lb://FOOD-SERVICE`
  (`/yonetim/saticilar` generic `/yonetim/**` rotalarından **önce** tanımlı).

## 10. Yapım sırası (her faz: derle + API/UI test + commit)

**Çekirdek (V1):**
1. **Faz 1 — Backend çekirdek:** modül iskeleti + Flyway şema + entity/depo + satıcı/menü/sipariş
   servisleri + durum makinesi (teslimat) + ödeme/ciro + güvenlik + Kafka(SIPARIS_DURUMU) + gateway +
   `ROLE_VENDOR_ADMIN` + admin satıcı uçları + seed. **API uçtan uca test + commit.**
2. **Faz 2 — Öğrenci frontend:** satıcılar/menü/sepet/teslim-adresi/ödeme + sipariş + canlı durum (SSE).
3. **Faz 3 — İşletme paneli:** sipariş panosu + ödeme işaretleme + menü yönetimi + ciro raporu.
4. **Faz 4 — Admin satıcı yönetimi UI** + nav/rol yönlendirmeleri.

**UberEats benzeri zenginleştirme (V2–V5, her faz: migration + backend + frontend + test + commit):**
- **Faz A (V2)** — gün bazlı çalışma saatleri + zengin işletme profili; otomatik açık/kapalı + öğrenci görünümü.
- **Faz B** — satıcı arama/mutfak filtre/sıralama + görsel-zengin vitrin (kapak/hero, menü görselleri).
- **Faz C (V3)** — teslimat ücreti + min. sepet + kampanya/indirim + sipariş tutar dökümü.
- **Faz D (V4)** — ürün seçenekleri/ekstralar (modifier groups, canlı fiyat) + öne çıkan ürün.
- **Faz E (V5)** — favori satıcılar (kalp + Favorilerim filtresi).

## 11. Tezle hizalama

Tez (Bölüm 3.6, Şekil 3.7 sipariş durum makinesi) UniEats'i "uygulanmış" dille anlatır; bu modül o
tasarımı gerçeğe çevirir. Tez metnindeki sipariş durum diyagramı buradaki §4 (teslimat akışı) ile
hizalanmalıdır (HAZIR→YOLDA→TESLIM_EDILDI + ödeme işaretleme dahil).
