-- Faz A: İşletme profili genişletme + gün bazlı çalışma saatleri (UberEats benzeri).

-- Satıcıya zengin profil alanları
ALTER TABLE saticilar ADD COLUMN mutfak_turu VARCHAR(100);
ALTER TABLE saticilar ADD COLUMN kapak_gorsel_url TEXT;
ALTER TABLE saticilar ADD COLUMN teslimat_ucreti DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE saticilar ADD COLUMN minimum_sepet_tutari DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE saticilar ADD COLUMN tahmini_teslimat_dakika INTEGER;

-- Gün bazlı çalışma saatleri (1=Pazartesi … 7=Pazar). Satıcı başına en çok 7 satır.
CREATE TABLE satici_calisma_saatleri (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    gun SMALLINT NOT NULL,
    acilis TIME,
    kapanis TIME,
    kapali BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_calisma_satici FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT chk_calisma_gun CHECK (gun BETWEEN 1 AND 7),
    CONSTRAINT uq_calisma_satici_gun UNIQUE (satici_id, gun)
);

CREATE INDEX idx_calisma_satici ON satici_calisma_saatleri(satici_id);
