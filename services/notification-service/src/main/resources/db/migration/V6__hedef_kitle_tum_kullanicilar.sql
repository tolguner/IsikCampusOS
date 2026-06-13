-- "Tüm kullanıcılar" hedef kitlesi eklendi (sistem yöneticisi duyuruları için).
ALTER TABLE bildirimler DROP CONSTRAINT IF EXISTS chk_bildirim_hedef_kitle;
ALTER TABLE bildirimler ADD CONSTRAINT chk_bildirim_hedef_kitle
    CHECK (hedef_kitle IN ('KULLANICI','TUM_OGRENCILER','TUM_KULLANICILAR','KULUP_BASKANLARI','SKS_YONETICILERI'));
