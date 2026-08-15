$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$paraEdits = @(
  @{ a = "kampüs yaşamının altı fonksiyonel alanını"; n = "Platform, kampüs yaşamının temel hizmet alanlarını —kulüp ve etkinlik yönetimi, spor tesisi rezervasyonu, çevrimiçi yemek siparişi ve planlı paylaşımlı yolculuk— ortak bir kimlik, bildirim ve mesajlaşma altyapısı üzerinde bütünleştirmektedir. Beceri tabanlı proje eşleştirme ve kampüs içi mikro iş pazarı modülleri ise tasarlanarak platformun genişletilebilirliğini ortaya koyan gelecek modüller olarak konumlandırılmıştır. Sistem, mikroservis mimarisi ile geliştirilmiş; API Gateway üzerinden merkezî kimlik doğrulama (JWT), servis keşfi, Apache Kafka tabanlı olay güdümlü iletişim ve servis başına veri tabanı izolasyonu yaklaşımlarını bir araya getirmektedir. Tasarım kararları, eğitim bilimleri (öğrenci katılımı ve kalıcılığı) ve insan-bilgisayar etkileşimi (bilişsel yük, arayüz tutarlılığı) kuramlarıyla; teknik tercihler ise güncel yazılım mimarisi literatürüyle gerekçelendirilmiştir." }
  @{ a = "altı temel fonksiyonel modül ve bunları destekleyen"; n = "Proje, Işık CampusOS platformunu temel fonksiyonel modüller ve bunları destekleyen çekirdek altyapı etrafında ele almaktadır. Çekirdek altyapı; kimlik doğrulama ve yetkilendirme, kullanıcı profili yönetimi, merkezi yönlendirme (API Gateway), servis keşfi, asenkron mesajlaşma ve platform geneli bildirim bileşenlerini kapsar. Bu altyapı üzerine inşa edilen ve gerçekleştirilen fonksiyonel modüller şunlardır: Kulüp ve Etkinlik Yönetimi — ClubHub (kulüp kuruluşu, üyelik, etkinlik planlama, onay akışları ve katılım takibi); Spor Tesisleri Rezervasyon Sistemi — SpotReserve (kaynak listeleme, uygunluk yönetimi, çakışmasız rezervasyon ve check-in); Kampüs Çevrimiçi Yemek Sipariş ve Yönetim Sistemi — UniEats (satıcı, menü, kampanya ve favori yönetimi, işletme paneli, sipariş alma ve sipariş durumunun asenkron takibi); ve Paylaşımlı Yolculuk Sistemi — CampusRide (sürücü/yolcu ilanları, rota ve uygunluk temelli eşleştirme, araç/ehliyet doğrulama, çift yönlü puanlama ve kapalı topluluk güven sinyalleri). Bu modüller, platform genelinde paylaşılan bir bildirim ve bağlam temelli mesajlaşma altyapısıyla desteklenir. Ayrıca, projenin tam vizyonunda yer alan iki modül — Proje Eşleştirme Sistemi (ProjectMatch: beceri profilleri, proje ilanları ve uyum temelli akran eşleştirme) ve Kampüs İçi Mikro İş Pazarı (MicroJob: kısa süreli iş ilanları, teklif ve anlaşma süreçleri ile itibar temelli güven göstergeleri) — tasarım düzeyinde ele alınmış; bunların gerçekleştirimi, platformun genişletilebilirliğini ortaya koyan bir gelecek çalışma olarak konumlandırılmıştır (bkz. Bölüm 6). Platform, duyarlı (responsive) bir web uygulaması olarak tasarlanmış olup masaüstü ve mobil tarayıcılarda kullanılabilir biçimde kurgulanmıştır." }
)

$fr = @(
  @{ f = "Gerçek kullanıcı kitlesiyle saha çalışması ve algoritmaların büyük ölçekli değerlendirilmesi gelecek çalışma olarak önerilmiştir."; r = "Proje eşleştirme ve mikro iş modüllerinin gerçekleştirimi, gerçek kullanıcı kitlesiyle saha çalışması ve algoritmaların büyük ölçekli değerlendirilmesi gelecek çalışma olarak önerilmiştir." }
  @{ f = "belirli sınırlar içinde tutulmuştur. Öğrenci Bilgi Sistemi (SIS) ve Öğrenme"; r = "belirli sınırlar içinde tutulmuştur. Proje eşleştirme ve mikro iş modüllerinin gerçekleştirimi tasarım aşamasına bırakılmış; Öğrenci Bilgi Sistemi (SIS) ve Öğrenme" }
  @{ f = "event-service"; r = "club-service" }
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$ok = 0; $miss = @()
try {
  $doc = $word.Documents.Open($path, $false, $false)
  foreach ($e in $paraEdits) {
    $found = $false
    foreach ($p in $doc.Paragraphs) {
      if ($p.Range.Text.Contains($e.a)) {
        $rng = $p.Range.Duplicate
        if ($rng.End - $rng.Start -gt 1) { $rng.End = $rng.End - 1 }
        $rng.Text = $e.n; $found = $true; $ok++; break
      }
    }
    if (-not $found) { $miss += "PARA: " + $e.a }
  }
  foreach ($e in $fr) {
    $rng = $doc.Content; $f = $rng.Find
    $f.ClearFormatting(); $f.Replacement.ClearFormatting()
    $f.Forward = $true; $f.Wrap = 1; $f.MatchWildcards = $false
    $res = $f.Execute($e.f, $false, $false, $false, $false, $false, $true, 1, $false, $e.r, 2)
    if ($res) { $ok++ } else { $miss += "FR: " + $e.f }
  }
  $doc.Save(); $doc.Close($true)
  Write-Output "BAŞARILI: $ok"
  if ($miss.Count -gt 0) { Write-Output "BULUNAMADI:"; $miss | ForEach-Object { Write-Output "  - $_" } }
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
