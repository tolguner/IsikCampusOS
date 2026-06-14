-- "Destek Hizmetleri Müdürlüğü" rolü (ROLE_SUPPORT_SERVICES_ADMIN) ile kalıcı kurumsal hesap.
-- Bu rol UniEats işletme yönetimini üstlenir: işletme/işletme yöneticisi/personel oluşturma,
-- silme, yönetici değiştirme, bilgi-değişikliği onayı ve işletme denetim logu.
--   * ON CONFLICT (eposta) DO NOTHING: mevcut DB'de varsa dokunulmaz (değiştirilen şifre korunur).
--   * Başlangıç şifresi "Admin123!" (admin ile aynı BCrypt hash); ilk girişte değiştirme zorunlu.
--
-- Hesap / başlangıç şifresi:
--   cem.develi@isikun.edu.tr / Admin123!  (ROLE_SUPPORT_SERVICES_ADMIN — Cem Develi)

INSERT INTO kullanicilar
    (id, eposta, sifre, roller, ad, soyad, fakulte, bolum, durum,
     eposta_dogrulandi, sifre_degistirmeli, olusturulma_tarihi, guncellenme_tarihi)
VALUES
    ('c3d4e5f6-7a8b-4c9d-8e0f-1a2b3c4d5e60', 'cem.develi@isikun.edu.tr',
     '$2a$10$DYPyLJHom/G7fKdbP1NsC.8t6PxljgxDUXkxaOuS6PIv.4pfdBkEG', 'ROLE_SUPPORT_SERVICES_ADMIN',
     'Cem', 'Develi', 'İdari Birimler', 'Destek Hizmetleri Müdürlüğü', 'AKTIF',
     true, true, now(), now())
ON CONFLICT (eposta) DO NOTHING;

-- Halit Eren'in birimi güncellendi: artık "Yapı, Lojistik ve Ulaşım Hizmetleri Müdürlüğü".
-- (V9 ON CONFLICT ile yeniden yazmadığından ayrı UPDATE gerekir.)
UPDATE kullanicilar
SET bolum = 'Yapı, Lojistik ve Ulaşım Hizmetleri Müdürlüğü', guncellenme_tarihi = now()
WHERE eposta = 'halit.geybioglu@isikun.edu.tr';
