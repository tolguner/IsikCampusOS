-- İyimser kilit (optimistic lock): iki personel aynı siparişi aynı anda işlemeye çalışırsa
-- ikincisi çakışma alır (üstlenme kuralı yarış durumuna karşı korunur).
ALTER TABLE siparisler ADD COLUMN surum BIGINT NOT NULL DEFAULT 0;
