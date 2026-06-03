CREATE INDEX IF NOT EXISTS idx_kulupler_yonetici_silindi
    ON kulupler(yonetici_kullanici_id, silindi);

CREATE INDEX IF NOT EXISTS idx_kulupler_aktif_silindi_ad
    ON kulupler(aktif, silindi, ad);

CREATE INDEX IF NOT EXISTS idx_etkinlikler_durum_guncellenme
    ON etkinlikler(durum, guncellenme_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_etkinlikler_kulup_durum
    ON etkinlikler(kulup_id, durum);

CREATE INDEX IF NOT EXISTS idx_etkinlikler_hatirlatici_aktif
    ON etkinlikler(durum)
    WHERE hatirlatici_etkin = true;

CREATE INDEX IF NOT EXISTS idx_etkinlik_katilimlari_kullanici_tarih
    ON etkinlik_katilimlari(kullanici_id, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_etkinlik_katilimlari_etkinlik_durum_tarih
    ON etkinlik_katilimlari(etkinlik_id, durum, olusturulma_tarihi);

CREATE INDEX IF NOT EXISTS idx_kulup_uyeleri_kulup_durum
    ON kulup_uyeleri(kulup_id, durum);

CREATE INDEX IF NOT EXISTS idx_kulup_uyeleri_kullanici
    ON kulup_uyeleri(kullanici_id);

CREATE INDEX IF NOT EXISTS idx_kulup_duyurulari_kulup_tarih
    ON kulup_duyurulari(kulup_id, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_kulup_profil_degisiklik_durum_tarih
    ON kulup_profil_degisiklik_istekleri(durum, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_etkinlik_degisiklik_durum_tarih
    ON etkinlik_degisiklik_istekleri(durum, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_denetim_gunlukleri_varlik_tarih
    ON denetim_gunlukleri(varlik_turu, varlik_id, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_bildirimler_alici_tarih
    ON bildirimler(alici_kullanici_id, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_bildirimler_hedef_tarih
    ON bildirimler(hedef_kitle, olusturulma_tarihi DESC);
