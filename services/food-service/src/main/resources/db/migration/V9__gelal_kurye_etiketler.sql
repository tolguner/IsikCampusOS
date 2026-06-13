-- UniEats vizyoner genişleme:
--   * Gel-al (pickup): öğrenci işletmeden kendisi alır — teslimat ücreti yok, kurye aşaması (YOLDA) atlanır.
--   * Kurye rolü: işletme personeli PERSONEL (mutfak/kasa) veya KURYE olabilir; kurye yalnız teslimat aşamalarını yürütür.
--   * Menü etiketleri: allerjen/içerik çipleri (VEGAN, GLUTENSIZ, ACILI... CSV olarak).

ALTER TABLE siparisler ADD COLUMN teslimat_turu VARCHAR(30) NOT NULL DEFAULT 'ADRESE_TESLIMAT';
ALTER TABLE siparisler ADD CONSTRAINT chk_siparis_teslimat_turu
    CHECK (teslimat_turu IN ('ADRESE_TESLIMAT','GEL_AL'));

-- Siparişi teslim eden kurye (adrese teslimatta, yolda aşamasında atanır; denetim için).
ALTER TABLE siparisler ADD COLUMN kurye_kullanici_id VARCHAR(36);

ALTER TABLE isletme_personeli ADD COLUMN rol VARCHAR(30) NOT NULL DEFAULT 'PERSONEL';
ALTER TABLE isletme_personeli ADD CONSTRAINT chk_personel_rol
    CHECK (rol IN ('PERSONEL','KURYE'));

ALTER TABLE menu_ogeleri ADD COLUMN etiketler VARCHAR(255);
