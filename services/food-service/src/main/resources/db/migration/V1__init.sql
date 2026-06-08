-- UniEats (food-service) şeması — satıcı, menü, sipariş, sipariş kalemi.

CREATE TABLE saticilar (
    id VARCHAR(36) PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    aciklama TEXT,
    konum_metni VARCHAR(255),
    logo_url TEXT,
    yonetici_kullanici_id VARCHAR(36) NOT NULL,
    acik BOOLEAN NOT NULL DEFAULT TRUE,
    durum VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_satici_durum CHECK (durum IN ('AKTIF','PASIF'))
);

CREATE TABLE menu_ogeleri (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    aciklama TEXT,
    kategori VARCHAR(100),
    fiyat DECIMAL(10, 2) NOT NULL,
    gorsel_url TEXT,
    mevcut BOOLEAN NOT NULL DEFAULT TRUE,
    durum VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_satici FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT chk_menu_durum CHECK (durum IN ('AKTIF','ARSIVLENDI'))
);

CREATE TABLE siparisler (
    id VARCHAR(36) PRIMARY KEY,
    satici_id VARCHAR(36) NOT NULL,
    musteri_kullanici_id VARCHAR(36) NOT NULL,
    durum VARCHAR(50) NOT NULL,
    toplam_tutar DECIMAL(10, 2) NOT NULL,
    teslim_adresi VARCHAR(500) NOT NULL,
    odeme_yontemi VARCHAR(20) NOT NULL,
    tahsil_edilen_odeme VARCHAR(20),
    musteri_notu VARCHAR(500),
    telefon VARCHAR(20),
    red_nedeni VARCHAR(255),
    tahmini_hazir_dakika INTEGER,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kabul_tarihi TIMESTAMP,
    hazir_tarihi TIMESTAMP,
    yola_cikis_tarihi TIMESTAMP,
    teslim_tarihi TIMESTAMP,
    iptal_tarihi TIMESTAMP,
    CONSTRAINT fk_siparis_satici FOREIGN KEY (satici_id) REFERENCES saticilar(id),
    CONSTRAINT chk_siparis_durum CHECK (durum IN ('BEKLEMEDE','KABUL_EDILDI','HAZIRLANIYOR','HAZIR','YOLDA','TESLIM_EDILDI','REDDEDILDI','IPTAL_EDILDI')),
    CONSTRAINT chk_siparis_odeme CHECK (odeme_yontemi IN ('NAKIT','KREDI_KARTI')),
    CONSTRAINT chk_siparis_tahsil CHECK (tahsil_edilen_odeme IS NULL OR tahsil_edilen_odeme IN ('NAKIT','KREDI_KARTI'))
);

CREATE TABLE siparis_kalemleri (
    id VARCHAR(36) PRIMARY KEY,
    siparis_id VARCHAR(36) NOT NULL,
    menu_ogesi_id VARCHAR(36) NOT NULL,
    urun_adi VARCHAR(255) NOT NULL,
    birim_fiyat DECIMAL(10, 2) NOT NULL,
    adet INTEGER NOT NULL,
    ara_toplam DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_kalem_siparis FOREIGN KEY (siparis_id) REFERENCES siparisler(id)
);

CREATE INDEX idx_menu_satici_durum ON menu_ogeleri(satici_id, durum);
CREATE INDEX idx_siparis_musteri_tarih ON siparisler(musteri_kullanici_id, olusturulma_tarihi DESC);
CREATE INDEX idx_siparis_satici_durum_tarih ON siparisler(satici_id, durum, olusturulma_tarihi DESC);
CREATE INDEX idx_kalem_siparis ON siparis_kalemleri(siparis_id);
