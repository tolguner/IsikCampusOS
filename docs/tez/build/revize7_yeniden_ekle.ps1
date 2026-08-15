$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$CR = [char]13
$h1 = "3.6.5. Bildirim Yönetimi"
$bil1 = "Bu modül, platform genelinde üretilen bildirimleri tek bir noktada toplayan ortak bir yetenektir. Kulüp/etkinlik, tesis, yemek ve yolculuk modülleri, kullanıcıyı ilgilendiren bir durum değişikliği oluştuğunda (etkinlik yayını, rezervasyon onayı, sipariş durumunun ilerlemesi, yolculuk talebine yanıt gibi) bildirim.olustur olayını yayar. notification-service bu olayları tüketerek bildirimi kalıcılaştırır ve her kullanıcının okunmuş/okunmamış durumunu yönetir."
$bil2 = "İstemciye iletim, sürekli bir bağlantı üzerinden sunucu-gönderimli olaylar (Server-Sent Events, SSE) akışıyla gerçek zamanlı sağlanır; böylece kullanıcı sayfayı yenilemeden bildirim alır. Modül ayrıca SKS ve destek birimlerinin tüm kullanıcılara ya da belirli kitlelere toplu duyuru göndermesini destekler. Bildirimlerin tek bir serviste merkezîleşmesi, hem üretici modülleri iletim ayrıntısından soyutlar hem de kullanıcıya tutarlı tek bir bildirim deneyimi sunar."
$h2 = "3.6.6. Bağlam Temelli Mesajlaşma"
$mes1 = "Bu modül, kullanıcıların platform içindeki etkileşimlerini kurum dışı kanallara taşımadan iletişim kurmasını sağlar. Mesajlaşma, serbest bir genel sohbet uygulaması değil; belirli bir işlem bağlamına (örneğin bir yemek siparişi ya da bir paylaşımlı yolculuk ilanı) bağlı konuşmalar üzerine kuruludur. Bir bağlam için açılan konuşma, yalnızca ilgili taraflar arasında mesaj alışverişine olanak tanır; konuşma kapatılabilir, okunmamış mesaj sayısı tutulur ve yeni mesajlar SSE akışıyla gerçek zamanlı iletilir."
$mes2 = "Bu bağlam temelli yaklaşım, iletişimi ilgili işle (sipariş, yolculuk) ilişkilendirerek kapalı topluluk içinde izlenebilir ve hesap verebilir bir etkileşim sağlar. Yeni bir mesaj geldiğinde alıcıya, bildirim altyapısı üzerinden bildirim.olustur olayıyla haber verilir; böylece mesajlaşma ve bildirim modülleri olay güdümlü biçimde birlikte çalışır."
$note = "Aşağıdaki üç alt bölüm (3.6.7-3.6.9), projenin tam vizyonunda yer alan ve bu çalışmada tasarım düzeyinde ele alınan proje eşleştirme ve mikro iş modüllerini sunar. Bu modüllerin gerçekleştirimi gelecek geliştirme fazına bırakılmıştır (Bölüm 6); burada sunulan tasarım, platformun ortak altyapısının (kimlik, profil, etiket, bildirim, mesajlaşma) bu modülleri nasıl destekleyeceğini ortaya koyar."
$modulBlock = $h1 + $CR + $bil1 + $CR + $bil2 + $CR + $h2 + $CR + $mes1 + $CR + $mes2 + $CR + $note + $CR

$catNote = "Projenin tam vizyonunda yer alan beceri tabanlı proje eşleştirme (ProjectMatch) ve kampüs içi mikro iş (MicroJob) modülleri bu çalışmada tasarım düzeyinde ele alınmıştır (3.6.7-3.6.9). Bu modüllerin bağımsız servisleri (projectmatch-service, microjob-service), mevcut servislerin oturmuş şablonu izlenerek gelecek geliştirme fazında platforma eklenecek biçimde planlanmıştır (bkz. Bölüm 6)."
$p3 = "Projenin tam vizyonunda yer alan proje eşleştirme ve mikro iş modülleri ise bu çalışmada gerçekleştirilmemiş; Bölüm 3.6'da sunulan tasarımlarıyla gelecek geliştirme fazına bırakılmıştır (Bölüm 6). Her iki modülün dayandığı etiket tabanlı eşleştirme altyapısı, mevcut profil servisinin beceri etiketleri üzerine inşa edilecek biçimde tasarlanmıştır."

$inserts = @(
  @{ anchor = "3.6.7. Etiket Tabanlı İlgi Alanı"; block = $modulBlock }
  @{ anchor = "3.2.3. Genel Mimari ve Spring Cloud"; block = ($catNote + $CR) }
  @{ anchor = "4.4. Kullanıcı Arayüzünün Geliştirilmesi"; block = ($p3 + $CR) }
)
$headingTexts = @("3.6.5. Bildirim Yönetimi", "3.6.6. Bağlam Temelli Mesajlaşma")
$bodyTexts = @(
  "Bu modül, platform genelinde üretilen bildirimleri",
  "İstemciye iletim, sürekli bir bağlantı üzerinden sunucu-gönderimli",
  "Bu modül, kullanıcıların platform içindeki etkileşimlerini kurum dışı",
  "Bu bağlam temelli yaklaşım, iletişimi ilgili işle",
  "Aşağıdaki üç alt bölüm (3.6.7-3.6.9)",
  "Projenin tam vizyonunda yer alan beceri tabanlı proje eşleştirme",
  "Projenin tam vizyonunda yer alan proje eşleştirme ve mikro iş modülleri ise bu çalışmada gerçekleştirilmemiş"
)

function SetStyle($p, $name) { try { $p.Style = $name } catch { try { $p.Range.set_Style($name) } catch {} } }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $false)

  foreach ($ins in $inserts) {
    $anchor = $null
    foreach ($p in $doc.Paragraphs) { if ($p.Range.Text.Contains($ins.anchor)) { $anchor = $p; break } }
    if ($null -eq $anchor) { Write-Output "ANCHOR YOK: $($ins.anchor)"; continue }
    $rng = $anchor.Range.Duplicate
    $rng.Collapse(1)
    $rng.InsertBefore($ins.block)
  }

  # Stilleri AÇIKÇA ata
  foreach ($p in $doc.Paragraphs) {
    $t = $p.Range.Text
    foreach ($ht in $headingTexts) { if ($t.Contains($ht)) { SetStyle $p "Başlık 5" } }
    foreach ($bt in $bodyTexts) { if ($t.Contains($bt)) { SetStyle $p "Gövde Metni" } }
  }

  $doc.Save()
  $doc.Close($true)
  Write-Output "EKLEME + STİL TAMAM, kaydedildi."

  # --- DOĞRULAMA: yeniden aç ve say ---
  $doc2 = $word.Documents.Open($path, $false, $true)  # ReadOnly
  $cnt = @{}
  foreach ($key in @("3.6.5. Bildirim Yönetimi","3.6.6. Bağlam Temelli Mesajlaşma","platform genelinde üretilen bildirimleri","gerçekleştirilmemiş; Bölüm 3.6","Projenin tam vizyonunda yer alan beceri tabanlı")) { $cnt[$key] = 0 }
  foreach ($p in $doc2.Paragraphs) {
    $t = $p.Range.Text
    foreach ($k in @($cnt.Keys)) { if ($t.Contains($k)) { $cnt[$k]++ } }
  }
  Write-Output "--- YENİDEN AÇMA DOĞRULAMASI (gövdede >=1 olmalı) ---"
  foreach ($k in $cnt.Keys) { Write-Output ("  {0} = {1}" -f $k, $cnt[$k]) }
  $doc2.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
