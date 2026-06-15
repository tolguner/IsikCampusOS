-- Kısayol (popüler) noktalarının güncellenmiş listesi.
-- Çekmeköy noktası Necip Fazıl metro istasyonu konumu baz alınarak güncellendi.
UPDATE populer_noktalar SET ad = 'Işık Üniversitesi Şile Kampüsü',  enlem = 41.1762, boylam = 29.6128 WHERE ad = 'Şile Kampüs';
UPDATE populer_noktalar SET ad = 'Işık Üniversitesi Maslak Kampüsü', enlem = 41.1122, boylam = 29.0219 WHERE ad = 'Maslak';
UPDATE populer_noktalar SET ad = 'Çekmeköy',                          enlem = 41.0164, boylam = 29.1793 WHERE ad = 'Çekmeköy Metro';
UPDATE populer_noktalar SET enlem = 41.0275, boylam = 29.0153 WHERE ad = 'Üsküdar';
UPDATE populer_noktalar SET enlem = 40.9929, boylam = 29.1244 WHERE ad = 'Ataşehir';

-- Kadıköy kısayolu kaldırıldı; yerine Pendik eklendi.
DELETE FROM populer_noktalar WHERE ad = 'Kadıköy';
INSERT INTO populer_noktalar (id, ad, enlem, boylam, kullanim_sayisi)
    VALUES (gen_random_uuid(), 'Pendik', 40.8776, 29.2333, 0);
