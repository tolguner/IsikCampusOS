$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$paraEdits = @(
  @{ a = "altı hizmet alanının her biri, alanyazında ayrı birer"; n = "Işık CampusOS platformunun kapsadığı hizmet alanlarının her biri, alanyazında ayrı birer araştırma konusu olarak ele alınmıştır. Bu bölümde bu alanlara yönelik mevcut çözümler incelenmekte ve ortak özellikleri olan parçalı/izole yapıları vurgulanmaktadır." }
  @{ a = "Kampüs kaynaklarının adil ve verimli paylaşımı, özellikle spor tesisleri"; n = "Benzer bir örüntü, kampüs kaynaklarının paylaşımında da görülür. Spor tesisleri gibi sınırlı kaynakların adil ve verimli kullanımı, çakışmasız bir rezervasyon yönetimini gerektirir; manuel ve dağınık süreçlerle yürütülen rezervasyonlar çakışmalara ve kaynak israfına yol açmaktadır. German vd. (2021), yükseköğretim kurumları için geliştirdikleri bütünleşik oda rezervasyon sisteminde, fiziksel mekânların ve kullanım kurallarının yazılımda modellenerek uygunluk ve çakışma kontrollerinin otomatikleştirilmesinin rezervasyon verimliliğini artırdığını ve çakışmaları azalttığını ortaya koymuştur. Bu tür sistemler tesis tahsisini etkin biçimde yönetmekle birlikte, çoğunlukla yalnızca rezervasyon işlevine adanmış tekil çözümler olarak geliştirilmekte ve kampüsün bütünleşik hizmet ekosisteminden bağımsız çalışmaktadır." }
  @{ a = "Kampüs içi yemek süreçlerinin dijitalleştirilmesi, fiziki kuyrukların"; n = "Yemek hizmetlerinde de tablo farklı değildir. Kampüs içi yemek süreçlerinin dijitalleştirilmesi, fiziki kuyrukların ve yoğunluğun azaltılmasına yönelik bir araştırma konusudur. Ramiah ve Nagowah (2021), bir üniversite kampüsü için geliştirdikleri akıllı kantin sisteminde, çevrimiçi sipariş panelleri ile mutfak tarafındaki hazırlık süreçleri arasında kurulan asenkron durum köprüsünün, öğrencilerin sipariş durumunu gerçek zamanlı izleyebilmesini ve kantinlerdeki insan yoğunluğunun azaltılmasını sağladığını ortaya koymuştur. Bu yaklaşım, siparişin durumunun öğrenciye dinamik olarak yansıtılmasını ve teslim sürecinin fiziki kuyruk gerektirmeden yürütülmesini mümkün kılmaktadır. Ancak bu sistemler de tipik olarak yemek hizmetine özgü bağımsız uygulamalar olarak tasarlanmakta; öğrencinin kampüs içindeki diğer hizmetlerle aynı arayüz ve kimlik altında bütünleşmemektedir." }
  @{ a = "Kampüs ulaşımında maliyet paylaşımı ve otopark yoğunluğunun"; n = "Ulaşım boyutunda, kampüs içi maliyet paylaşımı ve otopark yoğunluğunun azaltılması sürdürülebilir kampüs mobilitesi literatürünün konusudur. AlQuhtani (2022), banliyö üniversitelerinde paylaşımlı yolculuğun (ridesharing) sürdürülebilir bir ulaşım alternatifi olma potansiyelini incelediği çalışmasında, bu sistemlerin tek kişilik araç kullanımını ve buna bağlı çevresel etkileri azaltma kapasitesine dikkat çekmektedir. Paylaşımlı yolculuk sistemlerinin verimliliğini artıran tasarım yaklaşımlarından biri, yolcuların kapıdan kapıya alınması yerine ortak buluşma noktalarına yönlendirilmesidir; Stiglic vd. (2015), buluşma noktalarının (meeting points) kullanılmasının sürücülerin rota sapmalarını azaltarak ve sürücü-yolcu eşleşme olasılığını artırarak sistem verimliliğini iyileştirdiğini ortaya koymuştur. Eşleştirme ve rota optimizasyonu boyutunda Arslan ve Hoffmann (2025), talep temelli paylaşımlı yolculuğun mikroskobik trafik akışı simülasyonuna entegrasyonunu inceleyerek bu sistemlerin dinamik rota planlaması açısından modellenmesine katkı sunmuştur. Bu alandaki çözümlerin benimsenmesinin önündeki temel engel ise güven sorunudur; paylaşım ekonomisi literatürü (ter Huurne vd., 2017), bu tür P2P sistemlerin ancak güçlü bir güven çerçevesiyle sürdürülebilir olduğunu göstermektedir. Bu durum, paylaşımlı yolculuk gibi çözümlerin kurum dışı ticari uygulamalar yerine, kapalı topluluk güveni sağlayan kurumsal bir platform içinde sunulmasının önemini ortaya koymaktadır." }
  @{ a = "Öğrencilerin yetkinlik ve ilgi alanlarına göre proje ekiplerine atanması"; n = "Akranlar arası iş birliğine gelindiğinde, öğrencilerin yetkinlik ve ilgi alanlarına göre proje ekiplerine atanması, kararlı (stable) eşleştirme problemleri literatürüyle yakından ilişkilidir. Bu alanın temelini oluşturan Gale ve Shapley (1962), iki taraflı tercihlerin çakışmadan ve kararlı biçimde eşleştirilmesini sağlayan kararlı eşleştirme (stable matching) algoritmasını ortaya koymuştur. Bu yaklaşım öğrenci-proje atama (Student-Project Allocation) problemine uyarlanmıştır: Abraham vd. (2007), öğrencilerin ve projelerin tercih listelerine dayalı olarak kararlı atamalar üreten verimli algoritmalar geliştirmiştir. Tercih listelerinde eşitlik (ties) bulunması durumunda kararlılığın korunması sorununu ele alan Olaosebikan ve Manlove (2022) ise, eşitlikli öğrenci-proje atama probleminde süper-kararlılık (super-stability) sağlayan algoritmalar önermiştir. Beceri temelli ekip oluşturma boyutunda Hamidi Rad vd. (2020), uzmanlık alanlarına göre dengeli ekipler kurmaya yönelik öğrenme tabanlı bir yaklaşım geliştirmiştir. Bu çalışmalar güçlü algoritmik temeller sunmakla birlikte, çoğunlukla soyut eşleştirme problemleri olarak ele alınmakta; öğrencinin kampüs içindeki sosyal kimliği, profili ve diğer etkileşimleriyle bütünleşik bir platform bağlamında değerlendirilmemektedir." }
  @{ a = "Kampüs içi kısa süreli işlerin akranlar arası bir pazaryerinde"; n = "Son olarak, kampüs içi kısa süreli işlerin akranlar arası bir pazaryerinde yönetilmesi, gig ekonomisi literatürüyle ilişkilidir. Wood vd. (2019), küresel gig ekonomisinde özerklik ve algoritmik kontrol arasındaki dengeyi inceledikleri çalışmalarında, dijital iş platformlarında itibar ve değerlendirme sistemlerinin platform yönetişimindeki merkezi rolüne ve bu sistemlerin çalışanlar üzerindeki etkilerine dikkat çekmiştir. Paylaşım ekonomisinde güvenin öncüllerini inceleyen ter Huurne vd. (2017) ise, P2P işlemlerde güvenin itibar göstergeleri, platform güveni ve etkileşim deneyimi gibi çok boyutlu öncüllere dayandığını ortaya koymaktadır. Bu bulgular, kampüs içi bir mikro iş pazarının ancak güçlü güven sinyalleri ve kurumsal bir güvence çerçevesiyle işleyebileceğini göstermektedir. Mevcut gig ekonomisi platformları ise genel ve açık nitelikte olup, bir üniversite topluluğunun kapalı güven sınırından ve kurumsal kimlik doğrulamasından yoksundur." }
)

$basliklar = @(
  "2.4.1. Kulüp ve Etkinlik Yönetimi (ClubHub)",
  "2.4.2. Spor Tesisleri Rezervasyon Sistemi (SpotReserve)",
  "2.4.3. Çevrimiçi Yemek Sipariş ve Yönetim Sistemi (UniEats)",
  "2.4.4. Paylaşımlı Yolculuk Sistemi (CampusRide)",
  "2.4.5. Proje Eşleştirme Sistemi (ProjectMatch)",
  "2.4.6. Kampüs İçi Mikro İş Pazarı (MicroJob)"
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)

  # 1) Paragraf metinlerini değiştir
  $r = 0
  foreach ($e in $paraEdits) {
    foreach ($p in $d.Paragraphs) {
      if ($p.Range.Text.Contains($e.a)) {
        $rng = $p.Range.Duplicate
        if (($rng.End - $rng.Start) -gt 1) { $rng.End = $rng.End - 1 }
        $rng.Text = $e.n; $r++; break
      }
    }
  }
  Write-Output "Paragraf değişimi: $r / 6"

  # 2) 6 alt başlığı sil (sadece gövde Başlık 5)
  $del = 0
  foreach ($h in $basliklar) {
    foreach ($p in $d.Paragraphs) {
      if (($p.Style.NameLocal -like "Başlık 5*") -and $p.Range.Text.Contains($h)) {
        $p.Range.Delete(); $del++; break
      }
    }
  }
  Write-Output "Silinen alt başlık: $del / 6"

  foreach ($toc in $d.TablesOfContents) { $toc.Update() }
  $d.Repaginate()
  $d.Save(); $d.Close($true)

  # DOĞRULAMA
  $d = $word.Documents.Open($path, $false, $true)
  $h=0;$t1=0;$t2=0;$t3=0
  foreach ($p in $d.Paragraphs) {
    $x = $p.Range.Text
    if ($x -match "2\.4\.[1-6]\. ") { $h++ }
    if ($x.Contains("Benzer bir örüntü, kampüs kaynaklarının paylaşımında")) { $t1++ }
    if ($x.Contains("Yemek hizmetlerinde de tablo farklı değildir")) { $t2++ }
    if ($x.Contains("Akranlar arası iş birliğine gelindiğinde")) { $t3++ }
  }
  Write-Output "2.4.1-2.4.6 kalıntı (0 olmalı): $h"
  Write-Output "Geçişler (1 olmalı): SpotReserve=$t1 UniEats=$t2 ProjectMatch=$t3"
  Write-Output "Sayfa: $($d.ComputeStatistics(2)) | Kelime: $($d.ComputeStatistics(0))"
  $d.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
