-- Bildirim sorumluluğu notification-service'e taşındı (notification_db).
-- Bildirim tabloları event_db'den kaldırılır.
DROP TABLE IF EXISTS bildirim_okumalari;
DROP TABLE IF EXISTS bildirimler;
