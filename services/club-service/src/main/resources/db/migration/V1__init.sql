CREATE TABLE kulupler (
    id VARCHAR(36) PRIMARY KEY,
    ad VARCHAR(255) NOT NULL UNIQUE,
    kisa_aciklama VARCHAR(500),
    aciklama TEXT,
    yonetici_kullanici_id VARCHAR(255) NOT NULL,
    baskan_tam_adi VARCHAR(255),
    baskan_epostasi VARCHAR(255),
    logo_url TEXT,
    danisman_akademik_personel_id VARCHAR(255),
    danisman_unvani VARCHAR(255),
    danisman_tam_adi VARCHAR(255),
    danisman_epostasi VARCHAR(255),
    danisman_bolumu VARCHAR(255),
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    onay_gerektirir BOOLEAN NOT NULL DEFAULT FALSE,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    silinme_tarihi TIMESTAMP
);

CREATE TABLE akademik_kadro (
    id VARCHAR(36) PRIMARY KEY,
    akademik_unvan VARCHAR(255),
    tam_ad VARCHAR(255) NOT NULL,
    eposta VARCHAR(255) UNIQUE,
    fakulte_veya_birim VARCHAR(255),
    bolum VARCHAR(255),
    rol VARCHAR(255),
    profil_url VARCHAR(255) UNIQUE,
    kaynak_sayfa_url TEXT,
    kaynak_sayfa_son_guncellenme VARCHAR(255),
    son_senkronizasyon_tarihi TIMESTAMP,
    aktif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_akademik_kadro_tam_ad ON akademik_kadro(tam_ad);
CREATE INDEX idx_akademik_kadro_eposta ON akademik_kadro(eposta);
CREATE INDEX idx_akademik_kadro_aktif ON akademik_kadro(aktif);

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

CREATE TABLE denetim_gunlukleri (
    id VARCHAR(36) PRIMARY KEY,
    varlik_turu VARCHAR(255) NOT NULL,
    varlik_id VARCHAR(255) NOT NULL,
    islem VARCHAR(255) NOT NULL,
    yapan_id VARCHAR(255) NOT NULL,
    yapan_rol VARCHAR(255),
    mesaj TEXT NOT NULL,
    meta_veri TEXT,
    olusturulma_tarihi TIMESTAMP NOT NULL
);

CREATE TABLE etkinlikler (
    id VARCHAR(36) PRIMARY KEY,
    kulup_id VARCHAR(36) NOT NULL,
    baslik VARCHAR(255) NOT NULL,
    aciklama VARCHAR(2000),
    baslangic_tarihi TIMESTAMP,
    bitis_tarihi TIMESTAMP,
    konum VARCHAR(255),
    etkinlik_turu VARCHAR(255),
    cevrimici_platform VARCHAR(255),
    cevrimici_toplanti_url VARCHAR(255),
    konum_adi VARCHAR(255),
    konum_detayi VARCHAR(1000),
    enlem DOUBLE PRECISION,
    boylam DOUBLE PRECISION,
    afis_resmi_url TEXT,
    kontenjan_siniri_var BOOLEAN NOT NULL DEFAULT FALSE,
    kontenjan INTEGER NOT NULL DEFAULT 0,
    kontenjan_sinirli BOOLEAN NOT NULL DEFAULT FALSE,
    yedek_listesi_siniri_var BOOLEAN NOT NULL DEFAULT FALSE,
    yedek_listesi_kontenjani INTEGER NOT NULL DEFAULT 0,
    mevcut_rsvp_sayisi INTEGER NOT NULL DEFAULT 0,
    mevcut_yedek_sayisi INTEGER NOT NULL DEFAULT 0,
    qr_giris_etkin BOOLEAN NOT NULL DEFAULT FALSE,
    sertifika_etkin BOOLEAN NOT NULL DEFAULT FALSE,
    sertifika_basligi VARCHAR(255),
    ucretli BOOLEAN NOT NULL DEFAULT FALSE,
    ucret_tutari DECIMAL(19, 2),
    iban VARCHAR(255),
    odeme_talimatlari VARCHAR(1000),
    hatirlatici_etkin BOOLEAN NOT NULL DEFAULT FALSE,
    hatirlatma_zamanlari_dakika VARCHAR(255),
    gonderilen_hatirlatma_zamanlari_dakika VARCHAR(255),
    durum VARCHAR(255),
    red_nedeni VARCHAR(255),
    onaylayan VARCHAR(255),
    onay_tarihi TIMESTAMP,
    yayin_tarihi TIMESTAMP,
    sertifikalarin_olusturulma_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL,
    guncellenme_tarihi TIMESTAMP NOT NULL,
    CONSTRAINT fk_etkinlikler_kulup FOREIGN KEY (kulup_id) REFERENCES kulupler(id)
);

CREATE TABLE etkinlik_degisiklik_istekleri (
    id VARCHAR(36) PRIMARY KEY,
    etkinlik_id VARCHAR(36) NOT NULL,
    talep_eden VARCHAR(255),
    baslik VARCHAR(255) NOT NULL,
    aciklama VARCHAR(2000),
    baslangic_tarihi TIMESTAMP,
    bitis_tarihi TIMESTAMP,
    konum VARCHAR(255),
    etkinlik_turu VARCHAR(255),
    cevrimici_platform VARCHAR(255),
    cevrimici_toplanti_url VARCHAR(255),
    konum_adi VARCHAR(255),
    konum_detayi VARCHAR(1000),
    enlem DOUBLE PRECISION,
    boylam DOUBLE PRECISION,
    afis_resmi_url TEXT,
    kontenjan_siniri_var BOOLEAN NOT NULL DEFAULT FALSE,
    kontenjan INTEGER NOT NULL DEFAULT 0,
    kontenjan_sinirli BOOLEAN NOT NULL DEFAULT FALSE,
    yedek_listesi_siniri_var BOOLEAN NOT NULL DEFAULT FALSE,
    yedek_listesi_kontenjani INTEGER NOT NULL DEFAULT 0,
    qr_giris_etkin BOOLEAN NOT NULL DEFAULT FALSE,
    sertifika_etkin BOOLEAN NOT NULL DEFAULT FALSE,
    sertifika_basligi VARCHAR(255),
    ucretli BOOLEAN NOT NULL DEFAULT FALSE,
    ucret_tutari DECIMAL(19, 2),
    iban VARCHAR(255),
    odeme_talimatlari VARCHAR(1000),
    hatirlatici_etkin BOOLEAN NOT NULL DEFAULT FALSE,
    hatirlatma_zamanlari_dakika VARCHAR(255),
    durum VARCHAR(255) NOT NULL,
    geri_bildirim VARCHAR(2000),
    inceleyen VARCHAR(255),
    inceleme_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL,
    guncellenme_tarihi TIMESTAMP NOT NULL,
    CONSTRAINT fk_degisiklik_etkinlik FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id)
);

CREATE TABLE etkinlik_katilimlari (
    id VARCHAR(36) PRIMARY KEY,
    etkinlik_id VARCHAR(36) NOT NULL,
    kullanici_id VARCHAR(255) NOT NULL,
    yoklama_belirteci VARCHAR(255) UNIQUE,
    durum VARCHAR(255) NOT NULL,
    olusturulma_tarihi TIMESTAMP,
    yoklama_tarihi TIMESTAMP,
    yoklamayi_yapan VARCHAR(255),
    sertifika_gonderilme_tarihi TIMESTAMP,
    odeme_inceleme_tarihi TIMESTAMP,
    odemeyi_inceleyen VARCHAR(255),
    odeme_red_nedeni VARCHAR(1000),
    CONSTRAINT uk_katilim_etkinlik_kullanici UNIQUE (etkinlik_id, kullanici_id)
);

CREATE TABLE kulup_uyeleri (
    id VARCHAR(36) PRIMARY KEY,
    kulup_id VARCHAR(36) NOT NULL,
    kullanici_id VARCHAR(255) NOT NULL,
    rol VARCHAR(255) NOT NULL,
    durum VARCHAR(255) NOT NULL,
    katilma_tarihi TIMESTAMP,
    CONSTRAINT uk_kulup_uye_kulup_kullanici UNIQUE (kulup_id, kullanici_id)
);

CREATE TABLE kulup_duyurulari (
    id VARCHAR(36) PRIMARY KEY,
    kulup_id VARCHAR(255) NOT NULL,
    baslik VARCHAR(255) NOT NULL,
    mesaj TEXT NOT NULL,
    baglanti_url VARCHAR(255),
    baglanti_etiketi VARCHAR(255),
    resim_url TEXT,
    olusturan_id VARCHAR(255) NOT NULL,
    olusturulma_tarihi TIMESTAMP NOT NULL
);

CREATE TABLE kulup_profil_degisiklik_istekleri (
    id VARCHAR(36) PRIMARY KEY,
    kulup_id VARCHAR(36) NOT NULL,
    talep_eden VARCHAR(255) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    kisa_aciklama VARCHAR(500),
    vizyon TEXT,
    logo_url TEXT,
    durum VARCHAR(255) NOT NULL,
    geri_bildirim TEXT,
    inceleyen VARCHAR(255),
    inceleme_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL,
    guncellenme_tarihi TIMESTAMP NOT NULL,
    CONSTRAINT fk_profil_degisiklik_kulup FOREIGN KEY (kulup_id) REFERENCES kulupler(id)
);

CREATE TABLE kulup_saglik_kayitlari (
    id VARCHAR(36) PRIMARY KEY,
    kulup_id VARCHAR(36) NOT NULL UNIQUE,
    gozlem_listesinde BOOLEAN NOT NULL DEFAULT FALSE,
    son_not TEXT,
    son_notu_yazan VARCHAR(255),
    son_not_tarihi TIMESTAMP,
    guncellenme_tarihi TIMESTAMP
);
