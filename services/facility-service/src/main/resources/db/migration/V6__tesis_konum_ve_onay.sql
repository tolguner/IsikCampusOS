-- Spor tesisleri sadeleştirmesi:
--  * Tesise harita konumu (enlem/boylam) eklenir.
--  * Politikaya onay mekanizması (onay_gerekli) eklenir.
--  * tesis_turu artık zorunlu değildir (UX'ten kaldırıldı; tüm tesisler spor tesisi).

ALTER TABLE tesisler ADD COLUMN IF NOT EXISTS enlem double precision;
ALTER TABLE tesisler ADD COLUMN IF NOT EXISTS boylam double precision;
ALTER TABLE tesisler ALTER COLUMN tesis_turu DROP NOT NULL;

ALTER TABLE tesis_politikalari ADD COLUMN IF NOT EXISTS onay_gerekli boolean NOT NULL DEFAULT false;
