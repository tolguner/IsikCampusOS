-- Yönetim paneli "İşlem Geçmişi" için sistem log tablosu.
-- YolculukSistemLogu entity'sini karşılar (ddl-auto=validate ile şema doğrulanır).
CREATE TABLE IF NOT EXISTS yolculuk_sistem_logu (
    id                  VARCHAR(36) PRIMARY KEY,
    islem_yapan_id      VARCHAR(255),
    hedef_id            VARCHAR(255),
    islem_tipi          VARCHAR(100),
    mesaj               TEXT,
    olusturulma_tarihi  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yolculuk_sistem_logu_tarih
    ON yolculuk_sistem_logu (olusturulma_tarihi DESC);
