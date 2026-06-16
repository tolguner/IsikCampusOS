-- Mesaj ve yolculuk modullerinden gelen bildirim olaylari icin turler eklendi.
ALTER TABLE bildirimler DROP CONSTRAINT IF EXISTS chk_bildirim_tur;
ALTER TABLE bildirimler ADD CONSTRAINT chk_bildirim_tur
    CHECK (tur IN ('DUYURU','MESAJ','YOLCULUK','ETKINLIK_REVIZYON_TALEBI','ETKINLIK_ONAY_TALEBI','PROFIL_ONAY_TALEBI','SERTIFIKA','SIPARIS_DURUMU','REZERVASYON_TALEBI','REZERVASYON_DURUMU'));
