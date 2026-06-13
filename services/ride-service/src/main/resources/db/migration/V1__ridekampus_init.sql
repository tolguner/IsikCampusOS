CREATE TABLE surucu_dogrulamalari (
    id VARCHAR(36) PRIMARY KEY,
    kullanici_id VARCHAR(36) NOT NULL UNIQUE,
    ehliyet_sinifi VARCHAR(20) NOT NULL,
    arac_marka_model VARCHAR(255) NOT NULL,
    plaka VARCHAR(30) NOT NULL,
    arac_rengi VARCHAR(80),
    koltuk_kapasitesi INTEGER,
    belge_url TEXT,
    durum VARCHAR(50) NOT NULL DEFAULT 'BEKLEMEDE',
    admin_notu VARCHAR(700),
    inceleyen_kullanici_id VARCHAR(36),
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    incelenme_tarihi TIMESTAMP,
    CONSTRAINT chk_surucu_dogrulama_durum CHECK (durum IN ('BEKLEMEDE','ONAYLANDI','REDDEDILDI','ASKIYA_ALINDI'))
);

CREATE TABLE yolculuk_ilanlari (
    id VARCHAR(36) PRIMARY KEY,
    surucu_kullanici_id VARCHAR(36) NOT NULL,
    baslangic_basligi VARCHAR(255) NOT NULL,
    baslangic_enlem DOUBLE PRECISION NOT NULL,
    baslangic_boylam DOUBLE PRECISION NOT NULL,
    varis_basligi VARCHAR(255) NOT NULL,
    varis_enlem DOUBLE PRECISION NOT NULL,
    varis_boylam DOUBLE PRECISION NOT NULL,
    kalkis_zamani TIMESTAMP NOT NULL,
    koltuk_sayisi INTEGER NOT NULL,
    kabul_edilen_koltuk_sayisi INTEGER NOT NULL DEFAULT 0,
    durum VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
    ucret_tipi VARCHAR(50) NOT NULL DEFAULT 'UCRETSIZ',
    odeme_yontemi VARCHAR(50) NOT NULL DEFAULT 'YOK',
    kisi_basi_ucret DECIMAL(10, 2),
    iban VARCHAR(34),
    aciklama VARCHAR(700),
    ara_durak_kabul_edilir BOOLEAN NOT NULL DEFAULT TRUE,
    rota_polyline TEXT,
    tahmini_toplam_dakika INTEGER,
    tahmini_mesafe_km DOUBLE PRECISION,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iptal_tarihi TIMESTAMP,
    tamamlanma_tarihi TIMESTAMP,
    CONSTRAINT chk_yolculuk_ilan_durum CHECK (durum IN ('AKTIF','DOLU','IPTAL','TAMAMLANDI')),
    CONSTRAINT chk_yolculuk_ilan_ucret CHECK (ucret_tipi IN ('UCRETSIZ','UCRETLI')),
    CONSTRAINT chk_yolculuk_ilan_odeme CHECK (odeme_yontemi IN ('YOK','NAKIT','IBAN','NAKIT_VEYA_IBAN')),
    CONSTRAINT chk_yolculuk_ilan_koltuk CHECK (koltuk_sayisi BETWEEN 1 AND 8),
    CONSTRAINT chk_yolculuk_ilan_kabul CHECK (kabul_edilen_koltuk_sayisi >= 0)
);

CREATE TABLE rota_duraklari (
    id VARCHAR(36) PRIMARY KEY,
    ilan_id VARCHAR(36) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    enlem DOUBLE PRECISION NOT NULL,
    boylam DOUBLE PRECISION NOT NULL,
    sira INTEGER NOT NULL,
    tahmini_dakika INTEGER NOT NULL,
    CONSTRAINT fk_rota_ilan FOREIGN KEY (ilan_id) REFERENCES yolculuk_ilanlari(id) ON DELETE CASCADE
);

CREATE TABLE yolculuk_talepleri (
    id VARCHAR(36) PRIMARY KEY,
    ilan_id VARCHAR(36) NOT NULL,
    yolcu_kullanici_id VARCHAR(36) NOT NULL,
    binis_basligi VARCHAR(255) NOT NULL,
    binis_enlem DOUBLE PRECISION NOT NULL,
    binis_boylam DOUBLE PRECISION NOT NULL,
    inis_basligi VARCHAR(255) NOT NULL,
    inis_enlem DOUBLE PRECISION NOT NULL,
    inis_boylam DOUBLE PRECISION NOT NULL,
    koltuk_sayisi INTEGER NOT NULL DEFAULT 1,
    tahmini_binis_dakika INTEGER,
    tahmini_inis_dakika INTEGER,
    mesaj VARCHAR(500),
    red_nedeni VARCHAR(255),
    durum VARCHAR(50) NOT NULL DEFAULT 'BEKLEMEDE',
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cevap_tarihi TIMESTAMP,
    iptal_tarihi TIMESTAMP,
    tamamlanma_tarihi TIMESTAMP,
    CONSTRAINT fk_talep_ilan FOREIGN KEY (ilan_id) REFERENCES yolculuk_ilanlari(id),
    CONSTRAINT chk_yolculuk_talep_durum CHECK (durum IN ('BEKLEMEDE','KABUL_EDILDI','REDDEDILDI','IPTAL','TAMAMLANDI')),
    CONSTRAINT chk_yolculuk_talep_koltuk CHECK (koltuk_sayisi BETWEEN 1 AND 8)
);

CREATE TABLE yolculuk_puanlari (
    id VARCHAR(36) PRIMARY KEY,
    talep_id VARCHAR(36) NOT NULL,
    veren_kullanici_id VARCHAR(36) NOT NULL,
    alan_kullanici_id VARCHAR(36) NOT NULL,
    puan INTEGER NOT NULL,
    yorum VARCHAR(500),
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_puan_talep FOREIGN KEY (talep_id) REFERENCES yolculuk_talepleri(id),
    CONSTRAINT uq_puan_veren_talep UNIQUE (talep_id, veren_kullanici_id),
    CONSTRAINT chk_puan_aralik CHECK (puan BETWEEN 1 AND 5)
);

CREATE TABLE yolculuk_sikayetleri (
    id VARCHAR(36) PRIMARY KEY,
    talep_id VARCHAR(36) NOT NULL,
    sikayetci_kullanici_id VARCHAR(36) NOT NULL,
    hedef_kullanici_id VARCHAR(36) NOT NULL,
    neden VARCHAR(50) NOT NULL,
    aciklama VARCHAR(1000) NOT NULL,
    durum VARCHAR(50) NOT NULL DEFAULT 'ACIK',
    admin_notu VARCHAR(1000),
    inceleyen_kullanici_id VARCHAR(36),
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    incelenme_tarihi TIMESTAMP,
    CONSTRAINT fk_sikayet_talep FOREIGN KEY (talep_id) REFERENCES yolculuk_talepleri(id),
    CONSTRAINT chk_sikayet_neden CHECK (neden IN ('SURUCU_GELMEDI','YOLCU_GELMEDI','GUVENLIK','UCRET','UYGUNSUZ_DAVRANIS','YANLIS_ROTA','DIGER')),
    CONSTRAINT chk_sikayet_durum CHECK (durum IN ('ACIK','INCELEMEDE','COZULDU','REDDEDILDI','YAPTIRIM_UYGULANDI'))
);

CREATE INDEX idx_ilan_tarih_durum ON yolculuk_ilanlari(kalkis_zamani, durum);
CREATE INDEX idx_ilan_surucu_tarih ON yolculuk_ilanlari(surucu_kullanici_id, kalkis_zamani DESC);
CREATE INDEX idx_rota_ilan_sira ON rota_duraklari(ilan_id, sira);
CREATE INDEX idx_talep_yolcu_tarih ON yolculuk_talepleri(yolcu_kullanici_id, olusturulma_tarihi DESC);
CREATE INDEX idx_talep_ilan_durum ON yolculuk_talepleri(ilan_id, durum);
CREATE INDEX idx_sikayet_durum_tarih ON yolculuk_sikayetleri(durum, olusturulma_tarihi DESC);
