-- UniEats (food) denetim günlüğü: işletme/personel/sipariş/talep işlemleri.
-- auth_db (kullanıcı) ve club_db (kulüp/etkinlik) günlükleriyle birlikte admin panelinde toplanır.
CREATE TABLE denetim_gunlukleri (
    id VARCHAR(36) PRIMARY KEY,
    varlik_turu VARCHAR(50) NOT NULL,
    varlik_id VARCHAR(36),
    islem VARCHAR(100) NOT NULL,
    yapan_id VARCHAR(36),
    yapan_rol VARCHAR(100),
    mesaj TEXT NOT NULL,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_food_denetim_tarih ON denetim_gunlukleri(olusturulma_tarihi DESC);
