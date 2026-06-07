-- DB seviyesinde bütünlük: tesis modülü enum/durum alanlarına CHECK kısıtları

ALTER TABLE tesisler ADD CONSTRAINT chk_tesis_durum
    CHECK (durum IN ('AKTIF','DURDURULMUS','ARSIVLENMIS'));

ALTER TABLE tesisler ADD CONSTRAINT chk_tesis_turu
    CHECK (tesis_turu IN ('TOPLANTI_ODASI','CALISMA_ODASI','SPOR_ALANI','LABORATUVAR','DIGER'));

ALTER TABLE tesis_kaynaklari ADD CONSTRAINT chk_kaynak_durum
    CHECK (durum IN ('AKTIF','DURDURULMUS','ARSIVLENMIS'));

ALTER TABLE tesis_kaynaklari ADD CONSTRAINT chk_kaynak_turu
    CHECK (kaynak_turu IN ('TOPLANTI_ODASI','CALISMA_ODASI','SPOR_ALANI','LABORATUVAR','DIGER'));

ALTER TABLE tesis_rezervasyonlari ADD CONSTRAINT chk_rezervasyon_durum
    CHECK (durum IN ('TASLAK','BEKLEMEDE','ONAYLANDI','IPTAL_EDILDI','TAMAMLANDI','GELMEDI','BLOKE'));

ALTER TABLE tesis_politikalari ADD CONSTRAINT chk_politika_durum
    CHECK (durum IN ('AKTIF','DURDURULMUS'));

ALTER TABLE tesis_kullanilabilirlik_kurallari ADD CONSTRAINT chk_kullanilabilirlik_durum
    CHECK (durum IN ('AKTIF','DURDURULMUS'));

ALTER TABLE rezervasyon_yoklamalari ADD CONSTRAINT chk_yoklama_durum
    CHECK (durum IN ('BEKLEMEDE','GIRIS_YAPILDI','BASARISIZ'));

ALTER TABLE rezervasyon_yoklamalari ADD CONSTRAINT chk_yoklama_yontem
    CHECK (yontem IN ('KAREKOD','MANUEL'));
