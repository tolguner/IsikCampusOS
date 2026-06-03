CREATE TABLE tesisler (
    id VARCHAR(36) PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    tesis_turu VARCHAR(255) NOT NULL,
    aciklama TEXT,
    konum_metni VARCHAR(255),
    kapasite INTEGER NOT NULL,
    durum VARCHAR(255) NOT NULL,
    olusturan VARCHAR(255),
    guncelleyen VARCHAR(255),
    olusturulma_tarihi TIMESTAMP,
    guncellenme_tarihi TIMESTAMP,
    silinme_tarihi TIMESTAMP
);

CREATE TABLE tesis_kaynaklari (
    id VARCHAR(36) PRIMARY KEY,
    tesis_id VARCHAR(36) NOT NULL,
    kaynak_kodu VARCHAR(255) NOT NULL,
    ad VARCHAR(255) NOT NULL,
    kaynak_turu VARCHAR(255) NOT NULL,
    kapasite INTEGER NOT NULL,
    rezervasyon_yapilabilir BOOLEAN NOT NULL,
    durum VARCHAR(255) NOT NULL,
    olusturan VARCHAR(255),
    guncelleyen VARCHAR(255),
    olusturulma_tarihi TIMESTAMP,
    guncellenme_tarihi TIMESTAMP,
    silinme_tarihi TIMESTAMP,
    CONSTRAINT fk_kaynaklar_tesis FOREIGN KEY (tesis_id) REFERENCES tesisler(id)
);

CREATE TABLE tesis_kullanilabilirlik_kurallari (
    id VARCHAR(36) PRIMARY KEY,
    kaynak_id VARCHAR(36) NOT NULL,
    haftanin_gunu INTEGER NOT NULL,
    baslangic_saati TIME NOT NULL,
    bitis_saati TIME NOT NULL,
    gecerlilik_baslangici DATE,
    gecerlilik_bitisi DATE,
    durum VARCHAR(255) NOT NULL,
    guncelleyen VARCHAR(255),
    olusturulma_tarihi TIMESTAMP,
    guncellenme_tarihi TIMESTAMP,
    CONSTRAINT fk_kurallar_kaynak FOREIGN KEY (kaynak_id) REFERENCES tesis_kaynaklari(id)
);

CREATE TABLE tesis_rezervasyonlari (
    id VARCHAR(36) PRIMARY KEY,
    kaynak_id VARCHAR(36) NOT NULL,
    rezervasyon_yapan_kullanici_id VARCHAR(255) NOT NULL,
    baslangic_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    bitis_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    amac TEXT,
    katilimci_sayisi INTEGER NOT NULL,
    durum VARCHAR(255) NOT NULL,
    iptal_edilme_tarihi TIMESTAMP WITH TIME ZONE,
    iptal_nedeni VARCHAR(255),
    gelmeme_tarihi TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_rezervasyonlar_kaynak FOREIGN KEY (kaynak_id) REFERENCES tesis_kaynaklari(id)
);

CREATE TABLE tesis_politikalari (
    id VARCHAR(36) PRIMARY KEY,
    tesis_id VARCHAR(36) NOT NULL UNIQUE,
    rezervasyon_penceresi_gun INTEGER NOT NULL,
    minimum_bildirim_dakika INTEGER NOT NULL,
    iptal_limit_dakika INTEGER NOT NULL,
    yoklama_zorunlu BOOLEAN NOT NULL,
    otomatik_gelmeme_dakika INTEGER NOT NULL,
    maksimum_rezervasyon_sure_dakika INTEGER NOT NULL,
    durum VARCHAR(255) NOT NULL,
    guncelleyen VARCHAR(255),
    olusturulma_tarihi TIMESTAMP,
    guncellenme_tarihi TIMESTAMP,
    silinme_tarihi TIMESTAMP,
    CONSTRAINT fk_politika_tesis FOREIGN KEY (tesis_id) REFERENCES tesisler(id)
);

CREATE TABLE rezervasyon_yoklamalari (
    id VARCHAR(36) PRIMARY KEY,
    rezervasyon_id VARCHAR(36) NOT NULL UNIQUE,
    kullanici_id VARCHAR(255) NOT NULL,
    yoklama_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    yontem VARCHAR(255) NOT NULL,
    kanit_dosya_id VARCHAR(255),
    durum VARCHAR(255) NOT NULL,
    olusturulma_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    guncellenme_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_yoklamalar_rezervasyon FOREIGN KEY (rezervasyon_id) REFERENCES tesis_rezervasyonlari(id)
);
