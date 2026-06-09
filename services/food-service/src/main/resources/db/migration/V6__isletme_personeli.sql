-- UniEats: işletmeye bağlı personel hesapları.
-- Bir işletme sahibi (saticilar.yonetici_kullanici_id) artık personel ekleyebilir.
-- Personel hesabı auth-service'te (ROLE_VENDOR_STAFF) tutulur; bu tablo işletme↔personel bağıdır.
-- kullanici_id UNIQUE: bir personel yalnızca tek bir işletmede çalışabilir.

CREATE TABLE isletme_personeli (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    kullanici_id VARCHAR(36) NOT NULL UNIQUE,
    ad VARCHAR(255),
    eposta VARCHAR(255),
    durum VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_personel_satici FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT chk_personel_durum CHECK (durum IN ('AKTIF','PASIF'))
);

CREATE INDEX idx_personel_satici ON isletme_personeli(satici_id);
