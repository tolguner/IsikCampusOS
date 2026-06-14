-- Her kullanıcının telefon, ikamet adresi ve kan grubu bilgisi dolu olmalı.
-- Şu ana kadarki kayıtlarda boş olanlara makul rastgele değerler atanır.
-- random() her satır için ayrı değerlendiği için her kullanıcı farklı değer alır.

-- Telefon: 5XXXXXXXXX (10 haneli TR cep formatı)
UPDATE kullanicilar
SET telefon = '5' || lpad((floor(random() * 900000000) + 100000000)::bigint::text, 9, '0'),
    guncellenme_tarihi = now()
WHERE telefon IS NULL OR telefon = '';

-- Kan grubu: 8 standart değerden biri (formdaki değerlerle birebir aynı)
UPDATE kullanicilar
SET kan_grubu = (ARRAY['A Rh+','A Rh-','B Rh+','B Rh-','AB Rh+','AB Rh-','0 Rh+','0 Rh-'])[floor(random() * 8) + 1],
    guncellenme_tarihi = now()
WHERE kan_grubu IS NULL OR kan_grubu = '';

-- İkamet adresi: makul örnek adres havuzundan biri (kampüs çevresi)
UPDATE kullanicilar
SET ikamet_adresi = (ARRAY[
        'Meşrutiyet Mh. Üniversite Cd. No: 12 D: 4, Şile/İstanbul',
        'Kumbaba Mh. Sahil Sk. No: 7, Şile/İstanbul',
        'Ahmediye Mh. Çamlık Cd. No: 23 D: 9, Üsküdar/İstanbul',
        'Caferağa Mh. Moda Cd. No: 45 D: 3, Kadıköy/İstanbul',
        'Levent Mh. Çarşı Sk. No: 18 D: 11, Beşiktaş/İstanbul',
        'Cumhuriyet Mh. Atatürk Bulvarı No: 102 D: 6, Maltepe/İstanbul',
        'Yeni Mh. İstasyon Cd. No: 8, Pendik/İstanbul',
        'Soğanlık Mh. Lale Sk. No: 30 D: 2, Kartal/İstanbul',
        'Bağlarbaşı Mh. Gül Sk. No: 14 D: 5, Maltepe/İstanbul',
        'Feneryolu Mh. Bağdat Cd. No: 220 D: 8, Kadıköy/İstanbul'
    ])[floor(random() * 10) + 1],
    guncellenme_tarihi = now()
WHERE ikamet_adresi IS NULL OR ikamet_adresi = '';
