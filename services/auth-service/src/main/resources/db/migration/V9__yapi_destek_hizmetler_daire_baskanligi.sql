-- "Yapı, Destek ve Hizmetler Daire Başkanlığı" rolü (ROLE_BUILDING_SUPPORT_ADMIN) ile kalıcı
-- kurumsal hesap. Bu rol CampusRide onaylarını yürütür: ehliyet/araç doğrulamaları,
-- yolculuk şikayetleri ve popüler nokta yönetimi (RideKampüs Yönetimi paneli).
--   * ON CONFLICT (eposta) DO NOTHING: mevcut DB'de varsa dokunulmaz (değiştirilen şifre korunur).
--   * Başlangıç şifresi admin hesabıyla aynı BCrypt hash'tir; yerel demo şifreleri bu depoda
--     belgelenmez; yerel kopya: `docs/proje/DEMO-HESAPLAR.local.md` (gitignore).
--
-- Oluşturulan hesap:
--   halit.geybioglu@isikun.edu.tr  (ROLE_BUILDING_SUPPORT_ADMIN — Halit Eren)

INSERT INTO kullanicilar
    (id, eposta, sifre, roller, ad, soyad, fakulte, bolum, durum,
     eposta_dogrulandi, sifre_degistirmeli, olusturulma_tarihi, guncellenme_tarihi)
VALUES
    ('f1a2c3e4-5b6d-4e7f-8a90-123456789abc', 'halit.geybioglu@isikun.edu.tr',
     '$2a$10$DYPyLJHom/G7fKdbP1NsC.8t6PxljgxDUXkxaOuS6PIv.4pfdBkEG', 'ROLE_BUILDING_SUPPORT_ADMIN',
     'Halit', 'Eren', 'İdari Birimler', 'Yapı, Destek ve Hizmetler Daire Başkanlığı', 'AKTIF',
     true, true, now(), now())
ON CONFLICT (eposta) DO NOTHING;
