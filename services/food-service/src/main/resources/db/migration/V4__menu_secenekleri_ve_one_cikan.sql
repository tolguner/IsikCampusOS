-- Faz D: Menü öğesi seçenek grupları/seçenekleri (modifier groups) + öne çıkan + kalem seçim snapshot.

ALTER TABLE menu_ogeleri ADD COLUMN one_cikan BOOLEAN NOT NULL DEFAULT FALSE;

-- Seçenek grubu (örn. "Boy", "Ekstra Malzeme")
CREATE TABLE menu_secenek_gruplari (
    id VARCHAR(36) PRIMARY KEY,
    menu_ogesi_id VARCHAR(36) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    tur VARCHAR(20) NOT NULL,
    zorunlu BOOLEAN NOT NULL DEFAULT FALSE,
    siralama INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_secenekgrup_menu FOREIGN KEY (menu_ogesi_id) REFERENCES menu_ogeleri(id),
    CONSTRAINT chk_secenekgrup_tur CHECK (tur IN ('TEK_SECIM','COKLU_SECIM'))
);

-- Gruptaki seçenek (örn. "Büyük" +10₺, "Ekstra peynir" +8₺)
CREATE TABLE menu_secenekleri (
    id VARCHAR(36) PRIMARY KEY,
    grup_id VARCHAR(36) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    ek_fiyat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    siralama INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_secenek_grup FOREIGN KEY (grup_id) REFERENCES menu_secenek_gruplari(id)
);

-- Sipariş kaleminde seçilen opsiyonların okunabilir snapshot'ı (örn. "Büyük, Ekstra peynir")
ALTER TABLE siparis_kalemleri ADD COLUMN secimler_ozeti VARCHAR(500);

CREATE INDEX idx_secenekgrup_menu ON menu_secenek_gruplari(menu_ogesi_id);
CREATE INDEX idx_secenek_grup ON menu_secenekleri(grup_id);
