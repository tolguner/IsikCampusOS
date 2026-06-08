-- Kurumsal personel/yönetici hesapları artık çalışma-zamanı seed'i (VeriBesleyici) yerine
-- tek seferlik bu migration ile veritabanına entegre edilir.
--   * Migration bir kez çalışır ve flyway_schema_history'ye kaydedilir; her açılışta tekrar etmez.
--   * ON CONFLICT (eposta) DO NOTHING: mevcut DB'de zaten varsa dokunulmaz (değiştirilen
--     şifreler korunur); temiz bir veritabanında ise hesaplar bir kez oluşturulur.
--   * BCrypt hash'leri çalışan kimlik bilgilerine karşılık gelir (kapalı kampüs demo hesapları).
--
-- Hesaplar / başlangıç şifreleri:
--   admin@isikun.edu.tr           / Admin123!        (ROLE_ADMIN)
--   ogrenci.isleri@isikun.edu.tr  / Admin123!        (ROLE_REGISTRAR)
--   ozlem.ak@isikun.edu.tr        / 12345678901      (ROLE_REGISTRAR)
--   odul.celep@isikun.edu.tr      / odul.celep       (ROLE_SKS_ADMIN)
--   atakan.cetiner@isikun.edu.tr  / atakan.cetiner   (ROLE_FACILITY_ADMIN)
--   kantin@isikun.edu.tr          / kantin.123       (ROLE_VENDOR_ADMIN — food-service satıcı eşlemesi için SABİT id)

INSERT INTO kullanicilar
    (id, eposta, sifre, roller, ad, soyad, fakulte, bolum, durum,
     eposta_dogrulandi, sifre_degistirmeli, olusturulma_tarihi, guncellenme_tarihi)
VALUES
    ('73d01839-2ac9-4017-a884-3d3055fc41f0', 'admin@isikun.edu.tr',
     '$2a$10$DYPyLJHom/G7fKdbP1NsC.8t6PxljgxDUXkxaOuS6PIv.4pfdBkEG', 'ROLE_ADMIN',
     'Sistem', 'Yöneticisi', NULL, NULL, 'AKTIF', true, false, now(), now()),

    ('26a98898-8fb5-44cc-86e8-2b31b770d4d0', 'ogrenci.isleri@isikun.edu.tr',
     '$2a$10$tFXNMBV8TVpsKk37ud4thew0lkXVYpV2IR/uwZuAb0uTlNVcQDukG', 'ROLE_REGISTRAR',
     'Öğrenci', 'İşleri', NULL, NULL, 'AKTIF', true, false, now(), now()),

    ('b659ca6e-5b8e-4c41-8c6c-fa16341bd007', 'ozlem.ak@isikun.edu.tr',
     '$2a$10$IAi4rtQwOk4K8IVq8zjEveqmxJIJhwhowiSQBNs3C91RqXxvH5/5.', 'ROLE_REGISTRAR',
     'Özlem', 'Ak', NULL, NULL, 'AKTIF', true, false, now(), now()),

    ('0ad7b0b0-b392-4ed1-84fd-1eecba51c735', 'odul.celep@isikun.edu.tr',
     '$2a$10$jSaTFfeMiWnAfLgVyJDjHez9SSzltVtHrHgGot1/ZKneP9h5H12ty', 'ROLE_SKS_ADMIN',
     'Ödül', 'Celep', NULL, NULL, 'AKTIF', true, false, now(), now()),

    ('c86ca857-5c32-4394-ad96-b6f67fe18354', 'atakan.cetiner@isikun.edu.tr',
     '$2a$10$nxZquy9lbh0KS2q/rGUqouUac9IjYwVfZFI0hBzVIncnOgPSulXy2', 'ROLE_FACILITY_ADMIN',
     'Atakan', 'Çetiner', 'İdari Birimler', 'Spor Müdürlüğü', 'AKTIF', true, false, now(), now()),

    ('f00d0000-0000-4000-8000-000000000001', 'kantin@isikun.edu.tr',
     '$2a$10$uF04U77ctuNPamT1qvamZeFxn2lECAeoSm9z0xw1pXIraTB4uNzfO', 'ROLE_VENDOR_ADMIN',
     'Kampüs', 'Kantini', NULL, NULL, 'AKTIF', true, false, now(), now())
ON CONFLICT (eposta) DO NOTHING;
