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
$catNote = "Projenin tam vizyonunda yer alan beceri tabanlı proje eşleştirme (ProjectMatch) ve kampüs içi mikro iş (MicroJob) modülleri bu çalışmada tasarım düzeyinde ele alınmıştır (3.6.7-3.6.9). Bu modüllerin bağımsız servisleri (projectmatch-service, microjob-service), mevcut servislerin oturmuş şablonu izlenerek gelecek geliştirme fazında platforma eklenecek biçimde planlanmıştır (bkz. Bölüm 6)."
$p3 = "Projenin tam vizyonunda yer alan proje eşleştirme ve mikro iş modülleri ise bu çalışmada gerçekleştirilmemiş; Bölüm 3.6'da sunulan tasarımlarıyla gelecek geliştirme fazına bırakılmıştır (Bölüm 6). Her iki modülün dayandığı etiket tabanlı eşleştirme altyapısı, mevcut profil servisinin beceri etiketleri üzerine inşa edilecek biçimde tasarlanmıştır."

# Önceki gövde paragrafının SONUNA eklenecek (başlık yer imine dokunmadan)
$modulBlock = $CR + $h1 + $CR + $bil1 + $CR + $bil2 + $CR + $h2 + $CR + $mes1 + $CR + $mes2 + $CR + $note
$inserts = @(
  @{ prev = "ortak buluşma noktalarına yönlendirilerek sürücünün sapması en aza indirilir"; block = $modulBlock }
  @{ prev = "Zipkin (dağıtık izleme) kullanılmıştır"; block = ($CR + $catNote) }
  @{ prev = "olay güdümlü ortak bir yeteneğe dönüştürülmüştür"; block = ($CR + $p3) }
)
$headingTexts = @("3.6.5. Bildirim Yönetimi", "3.6.6. Bağlam Temelli Mesajlaşma")

function SetStyle($p, $name) { try { $p.Style = $name } catch {} }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $false)

  foreach ($ins in $inserts) {
    $prev = $null
    foreach ($p in $doc.Paragraphs) { if ($p.Range.Text.Contains($ins.prev)) { $prev = $p; break } }
    if ($null -eq $prev) { Write-Output "PREV YOK: $($ins.prev)"; continue }
    $r = $prev.Range.Duplicate
    if (($r.End - $r.Start) -ge 1) { $r.End = $r.End - 1 }  # ¶ hariç
    $r.Collapse(0)  # metin sonuna
    $r.InsertAfter($ins.block)
  }
  # Başlıkları açıkça Başlık 5 yap
  foreach ($p in $doc.Paragraphs) {
    $t = $p.Range.Text
    foreach ($ht in $headingTexts) { if ($t.Contains($ht)) { SetStyle $p "Başlık 5" } }
  }
  $doc.Save(); $doc.Close($true)
  Write-Output "AŞAMA 1: eklendi + başlık stili. (kaydedildi)"

  # AŞAMA 2: yeniden aç, TOC güncelle, kaydet
  $doc = $word.Documents.Open($path, $false, $false)
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  foreach ($tof in $doc.TablesOfFigures) { $tof.Update() }
  $doc.Repaginate()
  $doc.Save(); $doc.Close($true)
  Write-Output "AŞAMA 2: TOC güncellendi. (kaydedildi)"

  # AŞAMA 3: KRİTİK DOĞRULAMA - TOC sonrası hâlâ var mı?
  $doc = $word.Documents.Open($path, $false, $true)
  $b = 0; $m = 0; $cn = 0; $pp = 0
  foreach ($p in $doc.Paragraphs) {
    $t = $p.Range.Text
    if ($t.Contains("3.6.5. Bildirim Yönetimi")) { $b++ }
    if ($t.Contains("3.6.6. Bağlam Temelli Mesajlaşma")) { $m++ }
    if ($t.Contains("Projenin tam vizyonunda yer alan beceri tabanlı")) { $cn++ }
    if ($t.Contains("gerçekleştirilmemiş; Bölüm 3.6")) { $pp++ }
  }
  Write-Output "AŞAMA 3 DOĞRULAMA (TOC sonrası, gövde+TOC):"
  Write-Output "  3.6.5 Bildirim = $b  (>=2 ise TOC'ta da var)"
  Write-Output "  3.6.6 Mesajlaşma = $m"
  Write-Output "  catNote = $cn  | P3 = $pp"
  Write-Output "  Sayfa = $($doc.ComputeStatistics(2)) | Kelime = $($doc.ComputeStatistics(0))"
  $doc.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
