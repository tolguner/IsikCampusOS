-- Popüler "kısa yol" noktaları: sabit/zorunlu değil, haritada hızlı seçim önerisi.
-- Kullanıldıkça kullanim_sayisi artar; "en çok tercih edilen" buna göre sıralanır. Admin yönetir.
CREATE TABLE populer_noktalar (
    id VARCHAR(36) PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    enlem DOUBLE PRECISION NOT NULL,
    boylam DOUBLE PRECISION NOT NULL,
    kullanim_sayisi INTEGER NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_populer_nokta_sira ON populer_noktalar(aktif, kullanim_sayisi DESC);

-- Tohum: kampüs çevresinde sık kullanılan noktalar.
INSERT INTO populer_noktalar (id, ad, enlem, boylam, kullanim_sayisi) VALUES
    (gen_random_uuid(), 'Şile Kampüs',     41.1762, 29.6128, 0),
    (gen_random_uuid(), 'Çekmeköy Metro',  41.0331, 29.1767, 0),
    (gen_random_uuid(), 'Üsküdar',         41.0275, 29.0153, 0),
    (gen_random_uuid(), 'Kadıköy',         40.9909, 29.0254, 0),
    (gen_random_uuid(), 'Ataşehir',        40.9929, 29.1244, 0),
    (gen_random_uuid(), 'Maslak',          41.1122, 29.0219, 0);
