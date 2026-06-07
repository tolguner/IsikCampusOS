-- DB seviyesinde bütünlük: profil değişiklik isteği durumu CHECK kısıtı
ALTER TABLE profil_degisiklik_istekleri ADD CONSTRAINT chk_profil_degisiklik_durum
    CHECK (durum IN ('BEKLEMEDE','ONAYLANDI','REDDEDILDI'));

-- Tutarlılık: profiller tablosunda diğer tablolardaki gibi zaman damgaları yoktu.
ALTER TABLE profiller
    ADD COLUMN olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN guncellenme_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
