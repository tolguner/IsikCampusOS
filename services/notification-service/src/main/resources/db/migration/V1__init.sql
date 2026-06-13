CREATE TABLE bildirimler (
    id VARCHAR(36) PRIMARY KEY,
    baslik VARCHAR(255) NOT NULL,
    mesaj VARCHAR(3000) NOT NULL,
    baglanti_url VARCHAR(255),
    baglanti_etiketi VARCHAR(255),
    resim_url TEXT,
    tur VARCHAR(255) NOT NULL,
    hedef_kitle VARCHAR(255) NOT NULL,
    alici_kullanici_id VARCHAR(255),
    ilgili_etkinlik_id VARCHAR(255),
    olusturan VARCHAR(255),
    olusturan_adi VARCHAR(255),
    okunma_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL
);

CREATE TABLE bildirim_okumalari (
    id VARCHAR(36) PRIMARY KEY,
    bildirim_id VARCHAR(36) NOT NULL,
    kullanici_id VARCHAR(255) NOT NULL,
    okunma_tarihi TIMESTAMP NOT NULL,
    CONSTRAINT uk_bildirim_okuma_kullanici UNIQUE (bildirim_id, kullanici_id)
);

CREATE INDEX idx_bildirim_alici ON bildirimler(alici_kullanici_id);
CREATE INDEX idx_bildirim_hedef_kitle ON bildirimler(hedef_kitle);
CREATE INDEX idx_bildirim_okuma_kullanici ON bildirim_okumalari(kullanici_id);
