CREATE TABLE profiller (
    id VARCHAR(36) PRIMARY KEY,
    kullanici_id VARCHAR(36) UNIQUE NOT NULL,
    eposta VARCHAR(255),
    ad VARCHAR(255),
    soyad VARCHAR(255),
    bolum VARCHAR(255),
    telefon_numarasi VARCHAR(50),
    ikamet_adresi VARCHAR(255),
    kan_grubu VARCHAR(10),
    tc_kimlik_maskeli VARCHAR(20),
    profil_resmi_url TEXT,
    profil_resmi_baytlari BYTEA,
    profil_resmi_icerik_turu VARCHAR(100),
    hakkinda VARCHAR(1000),
    yetenekler VARCHAR(1000),
    guven_skoru INTEGER NOT NULL DEFAULT 100
);
 
CREATE TABLE profil_degisiklik_istekleri (
    id VARCHAR(36) PRIMARY KEY,
    kullanici_id VARCHAR(36) NOT NULL,
    alan_adi VARCHAR(255) NOT NULL,
    mevcut_deger VARCHAR(1000),
    talep_edilen_deger VARCHAR(1000) NOT NULL,
    durum VARCHAR(50) NOT NULL DEFAULT 'BEKLEMEDE',
    inceleyen VARCHAR(255),
    geri_bildirim VARCHAR(1000),
    inceleme_tarihi TIMESTAMP,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
