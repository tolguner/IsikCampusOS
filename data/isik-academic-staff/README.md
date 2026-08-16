# Işık Üniversitesi Akademik Kadro — Toplu İstatistikler

Bu dizin, `club-service` içindeki akademik kadro (kulüp danışmanı seçimi) özelliği
için 2026-05-04'te üniversitenin **kamuya açık** web sayfalarından derlenen veri
setinin **yalnızca toplu istatistiklerini** içerir:

- `summary.json` — birime ve unvana göre kişi sayıları, kaynak URL'ler, sayım özetleri
- `research_notes.md` — kapsam, yöntem ve derleme notları

## Kişi düzeyindeki veriler neden burada değil?

Derlemenin ham hâli 303 akademisyenin adı, unvanı, kurumsal e-postası, bölümü ve
profil bağlantısını içeriyordu. Bu bilgiler üniversitenin açık sayfalarında yer alsa
da, tek bir makine okunur dosyada toplanıp yeniden yayımlanması ayrı bir veri işleme
faaliyetidir ve ilgili kişilerin rızasına dayanmaz. Bu nedenle kişi düzeyindeki
dosyalar depodan çıkarılmıştır ve `.gitignore` ile dışarıda tutulur.

Uygulama kodu bu dosyalara bağımlı değildir; `akademik_kadro` tablosu çalışma
zamanında doldurulur.
