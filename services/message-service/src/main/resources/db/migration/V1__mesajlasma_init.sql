-- Modül-agnostik mesajlaşma şeması.
CREATE TABLE konusmalar (
    id                  VARCHAR(36) PRIMARY KEY,
    modul               VARCHAR(40)  NOT NULL,
    baglam_id           VARCHAR(64)  NOT NULL,
    baslik              VARCHAR(255),
    durum               VARCHAR(20)  NOT NULL DEFAULT 'ACIK',
    olusturulma_tarihi  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    son_mesaj_tarihi    TIMESTAMP,
    CONSTRAINT uq_konusma_baglam UNIQUE (modul, baglam_id)
);

CREATE TABLE konusma_katilimcilar (
    konusma_id   VARCHAR(36) NOT NULL REFERENCES konusmalar(id) ON DELETE CASCADE,
    kullanici_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (konusma_id, kullanici_id)
);
CREATE INDEX idx_katilimci_kullanici ON konusma_katilimcilar(kullanici_id);

CREATE TABLE konusma_okumalar (
    konusma_id       VARCHAR(36) NOT NULL REFERENCES konusmalar(id) ON DELETE CASCADE,
    kullanici_id     VARCHAR(36) NOT NULL,
    son_okuma_tarihi TIMESTAMP,
    PRIMARY KEY (konusma_id, kullanici_id)
);

CREATE TABLE mesajlar (
    id                      VARCHAR(36) PRIMARY KEY,
    konusma_id              VARCHAR(36) NOT NULL REFERENCES konusmalar(id) ON DELETE CASCADE,
    gonderici_kullanici_id  VARCHAR(36) NOT NULL,
    icerik                  VARCHAR(2000) NOT NULL,
    olusturulma_tarihi      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_mesaj_konusma ON mesajlar(konusma_id, olusturulma_tarihi);
