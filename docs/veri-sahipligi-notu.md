# Veri Sahipliği (Source-of-Truth) Notu

Mikroservis sınırları gereği bazı kullanıcı alanları birden fazla serviste tutulur.
Tutarsızlığı (drift) önlemek için hangi servisin **kaynak doğru** olduğu burada tanımlıdır.

## Kullanıcı kimlik bilgileri

- **Kaynak doğru:** `auth-service` → `auth_db.kullanicilar`
  - `ad, soyad, eposta, bolum, fakulte, tc_kimlik_maskeli`, roller, durum.
- **Projeksiyon (salt okunur kopya):** `profile-service` → `profile_db.profiller`
  - `ad, soyad, eposta, bolum, tc_kimlik_maskeli` alanları auth'tan **Kafka ile** senkronlanır.

### Senkronizasyon olayları (auth → profile)

| Olay | Tetikleyen | Etki |
|------|-----------|------|
| `kullanici.kaydedildi` | Öğrenci oluşturma | Boş profil oluşturulur (idempotent) |
| `kullanici.guncellendi` | Öğrenci güncelleme (ad/soyad/bölüm) | Projeksiyon alanları güncellenir |
| `kullanici.silindi` | Öğrenci silme | Profil silinir |

Profil servisi bu alanları **kendi başına değiştirmez**; kullanıcının doğrudan
düzenlediği alanlar (telefon, adres, kan grubu, hakkında, yetenekler, profil resmi)
profil servisine özgüdür ve auth'a geri yazılmaz.

## Anlık görüntü (snapshot) alanları — bilinçli olarak yenilenmez

`club-service` aşağıdaki alanları **atama anındaki değerle** saklar; ilgili kişinin
bilgisi sonradan değişse bile güncellenmez (tarihsel doğruluk amaçlı):

- `kulupler.baskan_tam_adi`, `baskan_epostasi`
- `kulupler.danisman_tam_adi`, `danisman_epostasi`, `danisman_unvani`, `danisman_bolumu`
- Bildirim ve sertifika kayıtlarındaki `*_adi` / `alici_adi` alanları
