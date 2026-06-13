CREATE INDEX IF NOT EXISTS idx_profil_degisiklik_kullanici_tarih
    ON profil_degisiklik_istekleri(kullanici_id, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_profil_degisiklik_durum_tarih
    ON profil_degisiklik_istekleri(durum, olusturulma_tarihi DESC);
