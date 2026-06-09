-- Öğrencinin iletişim bilgilerinin (telefon) işletmelerle paylaşılmasına izin verip vermediği.
-- UniEats siparişlerinde: izin verilmezse telefon işletmeye iletilmez/gösterilmez.
-- Gizlilik gereği varsayılan KAPALI (öğrenci Ayarlar > Gizlilik'ten açar).
ALTER TABLE profiller ADD COLUMN iletisim_paylasim_izni BOOLEAN NOT NULL DEFAULT FALSE;
