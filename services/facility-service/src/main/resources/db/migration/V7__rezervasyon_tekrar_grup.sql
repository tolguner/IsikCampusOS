-- Tekrarlanan antrenman/bloke serilerini ilişkilendirmek için grup kimliği.
ALTER TABLE tesis_rezervasyonlari ADD COLUMN IF NOT EXISTS tekrar_grup_id varchar(64);
CREATE INDEX IF NOT EXISTS idx_rezervasyon_tekrar_grup ON tesis_rezervasyonlari (tekrar_grup_id);
