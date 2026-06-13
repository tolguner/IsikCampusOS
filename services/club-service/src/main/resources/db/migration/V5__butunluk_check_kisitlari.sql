-- DB seviyesinde bütünlük: enum/durum alanlarına CHECK kısıtları
-- (uygulama EnumType.STRING ile yazıyor; değerler Java enum'larıyla birebir)

ALTER TABLE etkinlikler ADD CONSTRAINT chk_etkinlik_durum
    CHECK (durum IS NULL OR durum IN ('TASLAK','SKS_ONAYI_BEKLIYOR','REVIZYON_TALEP_EDILDI','YAYINLANDI','REDDEDILDI','IPTAL_EDILDI','TAMAMLANDI'));

ALTER TABLE etkinlikler ADD CONSTRAINT chk_etkinlik_turu
    CHECK (etkinlik_turu IS NULL OR etkinlik_turu IN ('CEVRIMICI','YUZ_YUZE'));

ALTER TABLE etkinlik_degisiklik_istekleri ADD CONSTRAINT chk_etkinlik_degisiklik_durum
    CHECK (durum IN ('SKS_ONAYI_BEKLIYOR','REVIZYON_TALEP_EDILDI','ONAYLANDI'));

ALTER TABLE etkinlik_katilimlari ADD CONSTRAINT chk_etkinlik_katilim_durum
    CHECK (durum IN ('ODEME_BEKLIYOR','ONAYLANDI','YEDEKTE','IPTAL_EDILDI','KATILDI','GELMEDI'));

ALTER TABLE kulup_profil_degisiklik_istekleri ADD CONSTRAINT chk_kulup_profil_durum
    CHECK (durum IN ('BEKLEMEDE','ONAYLANDI','REVIZYON_TALEP_EDILDI','REDDEDILDI'));

ALTER TABLE kulup_uyeleri ADD CONSTRAINT chk_kulup_uye_rol
    CHECK (rol IN ('UYE','YONETICI'));

ALTER TABLE kulup_uyeleri ADD CONSTRAINT chk_kulup_uye_durum
    CHECK (durum IN ('BEKLEMEDE','AKTIF','REDDEDILDI'));

ALTER TABLE denetim_gunlukleri ADD CONSTRAINT chk_denetim_varlik_turu
    CHECK (varlik_turu IN ('KULUP','ETKINLIK'));

-- ID genişlik tutarlılığı + eksik referans bütünlüğü:
-- kulup_duyurulari.kulup_id diğer tablolarda VARCHAR(36) iken burada 255'ti ve FK yoktu.
ALTER TABLE kulup_duyurulari ALTER COLUMN kulup_id TYPE VARCHAR(36);
ALTER TABLE kulup_duyurulari ADD CONSTRAINT fk_kulup_duyurulari_kulup
    FOREIGN KEY (kulup_id) REFERENCES kulupler(id);
