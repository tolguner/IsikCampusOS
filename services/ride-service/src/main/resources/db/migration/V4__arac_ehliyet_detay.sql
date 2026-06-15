-- CampusRide gerçekçileştirme: araç ve ehliyet doğrulamasına detaylı alanlar.
-- Tüm kolonlar nullable; mevcut kayıtlar bozulmaz (marka_model legacy korunur).

ALTER TABLE araclar ADD COLUMN IF NOT EXISTS marka varchar(120);
ALTER TABLE araclar ADD COLUMN IF NOT EXISTS model varchar(120);
ALTER TABLE araclar ADD COLUMN IF NOT EXISTS arac_tipi varchar(40);
ALTER TABLE araclar ADD COLUMN IF NOT EXISTS model_yili integer;

ALTER TABLE surucu_dogrulamalari ADD COLUMN IF NOT EXISTS ehliyet_no varchar(40);
ALTER TABLE surucu_dogrulamalari ADD COLUMN IF NOT EXISTS ehliyet_sahibi_ad_soyad varchar(160);
ALTER TABLE surucu_dogrulamalari ADD COLUMN IF NOT EXISTS verilis_tarihi date;
ALTER TABLE surucu_dogrulamalari ADD COLUMN IF NOT EXISTS gecerlilik_tarihi date;
