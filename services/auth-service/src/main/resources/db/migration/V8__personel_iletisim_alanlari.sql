-- İdari personel için iletişim/birim bilgileri. Öğrenciler fakülte/bölüm; personeller birim kullanır.
-- Bu alanlar profile-service'e Kafka ile aynalanır; admin paneli auth üzerinden yönetir.
ALTER TABLE kullanicilar ADD COLUMN birim VARCHAR(255);
ALTER TABLE kullanicilar ADD COLUMN telefon VARCHAR(50);
ALTER TABLE kullanicilar ADD COLUMN ikamet_adresi VARCHAR(255);
ALTER TABLE kullanicilar ADD COLUMN kan_grubu VARCHAR(10);
