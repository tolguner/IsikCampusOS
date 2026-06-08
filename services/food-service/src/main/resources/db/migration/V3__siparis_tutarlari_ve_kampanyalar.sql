-- Faz C: Sipariş tutar kırılımı (ara toplam / teslimat / indirim) + kampanyalar.

ALTER TABLE siparisler ADD COLUMN ara_toplam DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE siparisler ADD COLUMN teslimat_ucreti DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE siparisler ADD COLUMN indirim_tutari DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE siparisler ADD COLUMN kampanya_id VARCHAR(36);

-- İşletmenin tanımladığı kampanya/indirimler.
CREATE TABLE kampanyalar (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    tur VARCHAR(30) NOT NULL,
    deger DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_sepet_tutari DECIMAL(10, 2) NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kampanya_satici FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT chk_kampanya_tur CHECK (tur IN ('YUZDE','TUTAR','UCRETSIZ_TESLIMAT'))
);

CREATE INDEX idx_kampanya_satici ON kampanyalar(satici_id, aktif);
