-- Faz E: Öğrencinin favori satıcıları.

CREATE TABLE favori_saticilar (
    id VARCHAR(36) PRIMARY KEY,
    kullanici_id VARCHAR(36) NOT NULL,
    satici_id VARCHAR(36) NOT NULL,
    eklenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favori_satici FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT uq_favori_kullanici_satici UNIQUE (kullanici_id, satici_id)
);

CREATE INDEX idx_favori_kullanici ON favori_saticilar(kullanici_id);
