-- İşletme konumu artık harita üzerinden seçilebilir: enlem/boylam koordinatları.
-- konum_metni (adres etiketi) korunur; koordinatlar haritada işaretleme/önizleme için eklenir.
ALTER TABLE saticilar ADD COLUMN enlem DOUBLE PRECISION;
ALTER TABLE saticilar ADD COLUMN boylam DOUBLE PRECISION;
