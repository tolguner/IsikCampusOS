-- İşletme yöneticisinin yönetebildiği menü kategorileri (işletme başına).
-- Ürünler kategoriyi AD olarak saklamaya devam eder (menu_ogeleri.kategori); bu tablo
-- yönetilebilir kategori listesini ve sırasını tutar. Mevcut menülerdeki kategoriler backfill edilir.
CREATE TABLE menu_kategorileri (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    ad VARCHAR(120) NOT NULL,
    siralama INTEGER NOT NULL DEFAULT 0,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_kategori_satici_ad UNIQUE (satici_id, ad)
);
CREATE INDEX idx_kategori_satici ON menu_kategorileri(satici_id);

-- Mevcut menü öğelerindeki ayrık (satıcı, kategori) çiftlerini yönetilebilir kategori yap.
INSERT INTO menu_kategorileri (id, satici_id, ad, siralama)
SELECT gen_random_uuid(), satici_id, kategori, 0
FROM (
    SELECT DISTINCT satici_id, kategori
    FROM menu_ogeleri
    WHERE kategori IS NOT NULL AND btrim(kategori) <> ''
) AS mevcut;
