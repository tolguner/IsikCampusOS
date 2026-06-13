-- UniEats sipariş durum bildirimleri için yeni bildirim türü eklendi.
ALTER TABLE bildirimler DROP CONSTRAINT IF EXISTS chk_bildirim_tur;
ALTER TABLE bildirimler ADD CONSTRAINT chk_bildirim_tur
    CHECK (tur IN ('DUYURU','ETKINLIK_REVIZYON_TALEBI','ETKINLIK_ONAY_TALEBI','PROFIL_ONAY_TALEBI','SERTIFIKA','SIPARIS_DURUMU'));
