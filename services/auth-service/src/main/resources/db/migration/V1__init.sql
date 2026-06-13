CREATE TABLE kullanicilar (
    id VARCHAR(36) PRIMARY KEY,
    eposta VARCHAR(255) UNIQUE NOT NULL,
    sifre VARCHAR(255) NOT NULL,
    roller VARCHAR(255) NOT NULL,
    ad VARCHAR(255),
    soyad VARCHAR(255),
    ogrenci_numarasi VARCHAR(50) UNIQUE,
    fakulte VARCHAR(255),
    bolum VARCHAR(255),
    bolum_kodu VARCHAR(10),
    kayit_yili INTEGER,
    tc_kimlik_maskeli VARCHAR(20),
    durum VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
    eposta_dogrulandi BOOLEAN NOT NULL DEFAULT FALSE,
    sifre_degistirmeli BOOLEAN NOT NULL DEFAULT TRUE,
    son_giris_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE dogrulama_kodlari (
    id VARCHAR(36) PRIMARY KEY,
    kullanici_id VARCHAR(36) NOT NULL,
    eposta VARCHAR(255) NOT NULL,
    kod VARCHAR(6) NOT NULL,
    kod_turu VARCHAR(50) NOT NULL,
    son_kullanma_tarihi TIMESTAMP NOT NULL,
    kullanildi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE sertifika_teslimat_gunlukleri (
    id VARCHAR(36) PRIMARY KEY,
    sertifika_kodu VARCHAR(255) UNIQUE NOT NULL,
    kullanici_id VARCHAR(36) NOT NULL,
    eposta VARCHAR(255) NOT NULL,
    etkinlik_id VARCHAR(36) NOT NULL,
    alici_adi VARCHAR(255),
    etkinlik_basligi VARCHAR(255),
    kulup_adi VARCHAR(255),
    sertifika_basligi VARCHAR(255),
    verilme_tarihi TIMESTAMP,
    durum VARCHAR(50) NOT NULL,
    hata_mesaji VARCHAR(2000),
    gonderilme_tarihi TIMESTAMP,
    eklenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
