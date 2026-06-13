-- DB seviyesinde bütünlük: bildirim modülü enum alanlarına CHECK kısıtları

ALTER TABLE bildirimler ADD CONSTRAINT chk_bildirim_tur
    CHECK (tur IN ('DUYURU','ETKINLIK_REVIZYON_TALEBI','ETKINLIK_ONAY_TALEBI','PROFIL_ONAY_TALEBI','SERTIFIKA'));

ALTER TABLE bildirimler ADD CONSTRAINT chk_bildirim_hedef_kitle
    CHECK (hedef_kitle IN ('KULLANICI','TUM_OGRENCILER','KULUP_BASKANLARI','SKS_YONETICILERI'));
