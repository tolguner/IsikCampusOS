-- "RideKampüs Yönetimi" birimi kaldırıldı: CampusRide onaylarını yürüten birim artık
-- "Yapı, Destek ve Ulaşım Hizmetleri Müdürlüğü" adıyla anılır. Halit Eren bu müdürlükte
-- görev alır (rol kodu ROLE_BUILDING_SUPPORT_ADMIN korunur, yalnız görünen bölüm adı güncellenir).
UPDATE kullanicilar
SET bolum = 'Yapı, Destek ve Ulaşım Hizmetleri Müdürlüğü',
    guncellenme_tarihi = now()
WHERE roller LIKE '%ROLE_BUILDING_SUPPORT_ADMIN%';
