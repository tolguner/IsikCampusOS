-- İşletme genel-bilgi değişiklik talepleri artık tek seferde (tek butonla) birden çok alan
-- için açılabilir; aynı gönderimdeki alanlar ortak bir grup_id ile birleştirilir ve admin
-- tarafından tek talep olarak onaylanır/revize edilir.
ALTER TABLE satici_degisiklik_istekleri ADD COLUMN grup_id VARCHAR(36);
CREATE INDEX idx_degisiklik_grup ON satici_degisiklik_istekleri(grup_id);
