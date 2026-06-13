CREATE INDEX IF NOT EXISTS idx_kullanicilar_roller_durum_tarih
    ON kullanicilar(roller, durum, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_kullanicilar_fakulte_tarih
    ON kullanicilar(fakulte, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_dogrulama_kodlari_eposta_kod_tur
    ON dogrulama_kodlari(eposta, kod, kod_turu, kullanildi);
