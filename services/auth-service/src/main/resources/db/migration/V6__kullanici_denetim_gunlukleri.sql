-- Sistem yöneticisi kullanıcı/rol işlemleri için denetim günlüğü (auth_db).
-- Kulüp/etkinlik denetimi club_db'de; bu tablo kullanıcı işlemlerini tutar.
CREATE TABLE denetim_gunlukleri (
    id VARCHAR(36) PRIMARY KEY,
    varlik_turu VARCHAR(50) NOT NULL DEFAULT 'KULLANICI',
    varlik_id VARCHAR(36) NOT NULL,
    islem VARCHAR(100) NOT NULL,
    yapan_id VARCHAR(36) NOT NULL,
    yapan_rol VARCHAR(100),
    mesaj TEXT NOT NULL,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kullanici_denetim_tarih ON denetim_gunlukleri(olusturulma_tarihi DESC);
CREATE INDEX idx_kullanici_denetim_varlik ON denetim_gunlukleri(varlik_id, olusturulma_tarihi DESC);
