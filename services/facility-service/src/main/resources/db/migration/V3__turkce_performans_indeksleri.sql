CREATE INDEX IF NOT EXISTS idx_tesisler_silinme_ad
    ON tesisler(silinme_tarihi, ad);

CREATE INDEX IF NOT EXISTS idx_tesis_kaynaklari_tesis_silinme_ad
    ON tesis_kaynaklari(tesis_id, silinme_tarihi, ad);

CREATE INDEX IF NOT EXISTS idx_tesis_kurallari_kaynak_gun_saat
    ON tesis_kullanilabilirlik_kurallari(kaynak_id, haftanin_gunu, baslangic_saati);

CREATE INDEX IF NOT EXISTS idx_tesis_rezervasyonlari_kullanici_baslangic
    ON tesis_rezervasyonlari(rezervasyon_yapan_kullanici_id, baslangic_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_tesis_rezervasyonlari_kaynak_durum
    ON tesis_rezervasyonlari(kaynak_id, durum);

CREATE INDEX IF NOT EXISTS idx_tesis_rezervasyonlari_kaynak_zaman
    ON tesis_rezervasyonlari(kaynak_id, baslangic_tarihi, bitis_tarihi);

CREATE INDEX IF NOT EXISTS idx_tesis_rezervasyonlari_baslangic
    ON tesis_rezervasyonlari(baslangic_tarihi DESC);
