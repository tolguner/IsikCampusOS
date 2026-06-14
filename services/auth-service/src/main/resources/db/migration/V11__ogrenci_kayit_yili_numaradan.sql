-- Öğrencilerin kayıt yılını öğrenci numarasının ilk 2 hanesinden tutarlı hale getir
-- (örn. 23YOBI1053 → 2023). Numarası iki rakamla başlamayan kayıtlara dokunulmaz.
UPDATE kullanicilar
SET kayit_yili = 2000 + CAST(substring(ogrenci_numarasi FROM 1 FOR 2) AS INTEGER),
    guncellenme_tarihi = now()
WHERE roller LIKE '%ROLE_STUDENT%'
  AND ogrenci_numarasi ~ '^[0-9]{2}';
