-- İşletmenin genel/kimlik bilgileri (ad, açıklama, konum, logo, kapak, mutfak türü) artık doğrudan
-- değiştirilemez; sahip değişiklik talebi açar, sistem yöneticisi onaylar veya revize ister.
-- Operasyonel alanlar (açık/kapalı, çalışma saati, ücret, menü, kampanya) doğrudan kalır.
CREATE TABLE satici_degisiklik_istekleri (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    alan_adi VARCHAR(64) NOT NULL,
    mevcut_deger TEXT,
    talep_edilen_deger TEXT NOT NULL,
    durum VARCHAR(30) NOT NULL DEFAULT 'BEKLEMEDE',
    inceleyen VARCHAR(36),
    geri_bildirim VARCHAR(1000),
    inceleme_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_satici_talep FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT chk_satici_talep_durum CHECK (durum IN ('BEKLEMEDE','ONAYLANDI','REDDEDILDI','REVIZE_TALEP'))
);
CREATE INDEX idx_satici_talep_durum ON satici_degisiklik_istekleri(durum, olusturulma_tarihi DESC);
