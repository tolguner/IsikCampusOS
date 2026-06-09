-- Siparişin kabul/red kararını hangi işletme kullanıcısının (sahip veya personel) verdiğini tutar.
-- Ciro/aktivite günlüğünde "işleyen personel" olarak gösterilir. Eski kayıtlarda NULL kalır.
ALTER TABLE siparisler ADD COLUMN isleyen_kullanici_id VARCHAR(36);
