$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$CR = [char]13

$intro = "Bu bölümde, platformun fonksiyonel modüllerinin tasarımı ve temel iş kuralları sunulmaktadır. Modüller ortak bir altyapı (kimlik, profil, bildirim, mesajlaşma, olay akışı) üzerine oturur; her biri kendi domain mantığını kapsar. Gerçekleştirilen modüller — kulüp ve etkinlik yönetimi, tesis rezervasyonu, yemek siparişi, paylaşımlı yolculuk ile bunları destekleyen bildirim ve mesajlaşma — aşağıda ele alınmaktadır. Projenin tam vizyonunda yer alan proje eşleştirme ve mikro iş modüllerinin tasarımı ise gelecek çalışma kapsamında Bölüm 6'da sunulmaktadır."
$catNote = "Projenin tam vizyonunda yer alan beceri tabanlı proje eşleştirme (ProjectMatch) ve kampüs içi mikro iş (MicroJob) modülleri bu çalışmada tasarım düzeyinde ele alınmış ve gelecek geliştirme fazına bırakılmıştır (bkz. Bölüm 6). Bu modüllerin bağımsız servisleri (projectmatch-service, microjob-service), mevcut servislerin oturmuş şablonu izlenerek eklenecek biçimde planlanmıştır."
$p3 = "Projenin tam vizyonunda yer alan proje eşleştirme ve mikro iş modülleri ise bu çalışmada gerçekleştirilmemiş; tasarımlarıyla birlikte gelecek geliştirme fazına bırakılmış ve gelecek çalışma olarak Bölüm 6'da ele alınmıştır. Her iki modülün dayandığı etiket tabanlı eşleştirme altyapısı, mevcut profil servisinin beceri etiketleri üzerine inşa edilecek biçimde tasarlanmıştır."
$pA = "Tasarlanan Modüllerin Gerçekleştirimi: En doğrudan gelecek çalışma, projenin tam vizyonunda yer alan ancak bu tezde tasarım düzeyinde bırakılan iki modülün — beceri tabanlı proje eşleştirme (ProjectMatch) ve kampüs içi mikro iş pazarı (MicroJob) — mevcut servislerin oturmuş şablonu izlenerek bağımsız servisler hâlinde platforma eklenmesidir. ProjectMatch, LinkedIn iş ilanları mantığında bir ekip kurma modeli öngörür: öğrenciler ilgi ve beceri etiketlerini profillerine ekler, proje sahipleri aradıkları yetkinlik etiketleriyle ilan açar ve adaylar etiket örtüşmesine göre değerlendirilir. MicroJob ise armut.com benzeri iki taraflı bir pazaryeri olarak tasarlanmıştır; arz (hizmet/ürün sunumu) ve talep (ihtiyaç) ilanlarını tek bir pazaryerinde buluşturur, ücretli/gönüllü ayrımını destekler ve tamamlanan işlerde çift yönlü itibar/puanlama ile kapalı toplulukta simetrik hesap verebilirlik sağlar."
$pB = "Her iki modül de ortak bir etiket (tag) altyapısını paylaşacak biçimde tasarlanmıştır: öğrencilerin profillerindeki ilgi ve beceri etiketleri, ilanların hedef etiketleriyle eşleştirilerek hem ilan görünürlüğü (herkese açık veya etiket bazlı niş) hem de bildirim filtreleme tercihi yönetilir. Bu ortak altyapı, mevcut profil servisinin beceri etiketleri üzerine inşa edilerek platformun bütünleşik vizyonu tamamlanabilir."

$paraEdits = @(
  @{ a = "Önce gerçekleştirilen modüller"; n = $intro }
  @{ a = "Projenin tam vizyonunda yer alan beceri tabanlı proje eşleştirme"; n = $catNote }
  @{ a = "gerçekleştirilmemiş; Bölüm 3.6"; n = $p3 }
  @{ a = "Tasarlanan Modüllerin Gerçekleştirimi"; n = ($pA + $CR + $pB) }
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)

  # 1) Metin düzeltmeleri / 6.3 genişletme
  foreach ($e in $paraEdits) {
    $found = $false
    foreach ($p in $d.Paragraphs) {
      if ($p.Range.Text.Contains($e.a)) {
        $rng = $p.Range.Duplicate
        if (($rng.End - $rng.Start) -gt 1) { $rng.End = $rng.End - 1 }
        $rng.Text = $e.n; $found = $true; break
      }
    }
    if (-not $found) { Write-Output "ANCHOR YOK: $($e.a)" }
  }

  # 6.3 lead'i kalın yap
  foreach ($p in $d.Paragraphs) {
    if ($p.Range.Text.StartsWith("Tasarlanan Modüllerin Gerçekleştirimi:")) {
      $lr = $p.Range.Duplicate; $lr.End = $lr.Start + ("Tasarlanan Modüllerin Gerçekleştirimi:").Length
      $lr.Font.Bold = $true; break
    }
  }

  # 2) 3.6.7-3.6.9 + geçiş notunu SİL
  $startP = $null; $endP = $null
  foreach ($p in $d.Paragraphs) {
    if (-not $startP -and $p.Range.Text.Contains("Aşağıdaki üç alt bölüm")) { $startP = $p }
    if (-not $endP -and $p.Range.Text.Contains("sonraki etkileşimlerde güven sinyali olarak sunulur")) { $endP = $p }
  }
  if ($startP -and $endP) {
    $del = $d.Range($startP.Range.Start, $endP.Range.End)
    $del.Delete()
    Write-Output "SİLİNDİ: geçiş notu + 3.6.7/3.6.8/3.6.9"
  } else { Write-Output "SİLME SINIRI BULUNAMADI (start=$([bool]$startP) end=$([bool]$endP))" }

  foreach ($toc in $d.TablesOfContents) { $toc.Update() }
  $d.Repaginate()
  $d.Save(); $d.Close($true)

  # DOĞRULAMA
  $d = $word.Documents.Open($path, $false, $true)
  $b367=0;$b368=0;$b369=0;$tagInfra=0;$mj=0;$exp=0
  foreach ($p in $d.Paragraphs) {
    $t = $p.Range.Text
    if ($t.Contains("3.6.7. Etiket")) { $b367++ }
    if ($t.Contains("3.6.8. Proje Eşleştirme")) { $b368++ }
    if ($t.Contains("3.6.9. Kampüs İçi")) { $b369++ }
    if ($t.Contains("öğrencileri ilgi ve yeteneklerine göre eşleştirmek için ortak bir etiket")) { $tagInfra++ }
    if ($t.Contains("iki taraflı bir kampüs içi pazaryeridir")) { $mj++ }
    if ($t.Contains("LinkedIn iş ilanları mantığında bir ekip kurma modeli öngörür")) { $exp++ }
  }
  Write-Output "DOĞRULAMA (0 olmalı): 3.6.7=$b367 3.6.8=$b368 3.6.9=$b369 etiketAltyapısı=$tagInfra mjGövde=$mj"
  Write-Output "6.3 genişletilmiş içerik (1 olmalı): $exp"
  Write-Output "Sayfa: $($d.ComputeStatistics(2)) | Kelime: $($d.ComputeStatistics(0))"
  $d.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
