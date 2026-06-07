-- DB seviyesinde bütünlük: kimlik modülü enum/durum alanlarına CHECK kısıtları

ALTER TABLE kullanicilar ADD CONSTRAINT chk_kullanici_durum
    CHECK (durum IN ('AKTIF','PASIF','MEZUN','ILISIGI_KESILMIS'));

ALTER TABLE dogrulama_kodlari ADD CONSTRAINT chk_dogrulama_kod_turu
    CHECK (kod_turu IN ('EMAIL_VERIFICATION','PASSWORD_RESET'));

ALTER TABLE sertifika_teslimat_gunlukleri ADD CONSTRAINT chk_sertifika_durum
    CHECK (durum IN ('GONDERILDI','HATA'));
