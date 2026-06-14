-- CampusRide: ehliyet doğrulaması (yalnız ehliyet) ile araç doğrulamasını ayır.
--  * surucu_dogrulamalari artık YALNIZ ehliyet kaydı (sınıf + belge foto + admin onayı).
--  * araclar: sürücü başına ÇOKLU araç; her biri ayrı admin onayından geçer; görsel zorunlu.
--  * yolculuk_ilanlari.arac_id: ilan, onaylı bir araca bağlanır.

-- 1) Araçlar (garaj) — her araç ayrı onaylanır.
CREATE TABLE araclar (
    id VARCHAR(36) PRIMARY KEY,
    kullanici_id VARCHAR(36) NOT NULL,
    marka_model VARCHAR(255) NOT NULL,
    plaka VARCHAR(30) NOT NULL,
    renk VARCHAR(80),
    koltuk_kapasitesi INTEGER,
    gorsel_url TEXT NOT NULL,
    durum VARCHAR(50) NOT NULL DEFAULT 'BEKLEMEDE',
    admin_notu VARCHAR(700),
    inceleyen_kullanici_id VARCHAR(36),
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    incelenme_tarihi TIMESTAMP,
    CONSTRAINT chk_arac_durum CHECK (durum IN ('BEKLEMEDE','ONAYLANDI','REDDEDILDI','PASIF'))
);
CREATE INDEX idx_arac_kullanici ON araclar(kullanici_id);
CREATE INDEX idx_arac_durum ON araclar(durum);

-- 2) İlan → onaylı araç bağı (eski satırlar için nullable).
ALTER TABLE yolculuk_ilanlari ADD COLUMN arac_id VARCHAR(36);
ALTER TABLE yolculuk_ilanlari
    ADD CONSTRAINT fk_ilan_arac FOREIGN KEY (arac_id) REFERENCES araclar(id);

-- 3) Ehliyet doğrulaması artık araçtan bağımsız: araç alanları boş geçilebilsin.
ALTER TABLE surucu_dogrulamalari ALTER COLUMN arac_marka_model DROP NOT NULL;
ALTER TABLE surucu_dogrulamalari ALTER COLUMN plaka DROP NOT NULL;
