$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"

Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

# --- Tam paragraf değişimi (255 sınırı yok) ---
$paraEdits = @(
  @{ a = "platformun altı fonksiyonel modülünün tasarımı"; n = "Bu bölümde, platformun fonksiyonel modüllerinin tasarımı ve temel iş kuralları sunulmaktadır. Modüller ortak bir altyapı (kimlik, profil, bildirim, mesajlaşma, olay akışı) üzerine oturur; her biri kendi domain mantığını kapsar. Önce gerçekleştirilen modüller — kulüp ve etkinlik yönetimi, tesis rezervasyonu, yemek siparişi, paylaşımlı yolculuk ile bunları destekleyen bildirim ve mesajlaşma — ele alınmakta; ardından projenin tam vizyonunda yer alan ve bu çalışmada tasarım düzeyinde işlenen proje eşleştirme (ProjectMatch) ile mikro iş (MicroJob) modülleri ve bunların paylaştığı etiket tabanlı eşleştirme altyapısı sunulmaktadır (3.6.7-3.6.9)." }
  @{ a = "öğrencileri ilgi ve yeteneklerine göre eşleştirmek için ortak bir etiket"; n = "ProjectMatch ve MicroJob modüllerinin her ikisi de, öğrencileri ilgi ve yeteneklerine göre eşleştirmek için ortak bir etiket (tag) altyapısı üzerine kurulacak biçimde tasarlanmıştır. Bu altyapı, iki modülde tutarlılığı sağlamak ve mükerrer tasarımı önlemek amacıyla tek bir paylaşılan kavram olarak ele alınmıştır." }
  @{ a = "Yemek sipariş modülü, satıcıların menü yönetimi"; n = "Yemek sipariş modülü, satıcıların işletme yönetimi ile öğrencilerin sipariş takibini bir araya getirir. Satıcı tarafında menü ve kategori yönetimi, kampanya tanımlama, işletme personeli yetkilendirmesi ve ciro takibi; öğrenci tarafında ise favori işletmeler, sipariş verme ve gerçek zamanlı durum izleme yer alır. Sipariş, tanımlı bir durum makinesi boyunca ilerler ve her durum değişikliğinde öğrenciye asenkron bildirim iletilir; teslim aşamasında öğrenci bir teslim koduyla siparişini alır. İşletme bilgisindeki bazı değişiklikler, gerektiğinde bir onay (değişiklik talebi) akışından geçirilir. Paylaşımlı yolculuk modülü, önceden planlı carpooling ilanlarını harita üzerinde görselleştirir. Kalkış ve varış konumu, yoğun güzergâhlar için önceden tanımlı popüler toplanma noktalarından seçilebildiği gibi, seyrek güzergâhlar için serbest konum girişiyle de belirlenebilir (hibrit model). Öğrenciler ilanları konuma göre arayabilir ve belirli bir güzergâh için bildirim aboneliği oluşturabilir; eşleştirmede sürücünün rota sapması tolerans sınırı içinde tutulur. Güvenli bir akran etkileşimi için sürücü araç/ehliyet doğrulamasından geçer, yolculuk sonrası taraflar birbirini çift yönlü olarak puanlar ve uygunsuz durumlar şikâyet mekanizmasıyla yönetime iletilir." }
  @{ a = "Proje eşleştirme ve mikro iş modülleri, ortak bir etiket altyapısı üzerine kurulmuştur"; n = "İşlevsel modüllere ek olarak, platform genelinde paylaşılan iki yetenek bağımsız servisler olarak gerçekleştirilmiştir. Bildirim modülü (notification-service), üretici modüllerin Kafka üzerinden yaydığı bildirim.olustur olaylarını tüketerek bildirimleri kalıcılaştırır, okundu/okunmadı durumunu yönetir ve istemciye sunucu-gönderimli olaylar (SSE) akışıyla gerçek zamanlı iletir. Mesajlaşma modülü (message-service), bir yemek siparişi veya yolculuk ilanı gibi belirli bir bağlama bağlı konuşmalar üzerinden taraflar arasındaki platform içi iletişimi yine SSE akışıyla sağlar." }
  @{ a = "bağımsız bir servise ayrılmak yerine mevcut sürümde etkinlik servisi içinde"; n = "Modüller arası bağlantı noktalarında, bildirim üretimi gibi ortak işlevler her modülde tekrar tekrar kodlanmak yerine merkezî biçimde ele alınmıştır. Bildirim işlevi başlangıçta etkinlik servisi içinde yer almış; ancak tesis, yemek ve yolculuk modülleri de bildirim üretmeye başlayınca, Bölüm 3'te gerekçelendirildiği biçimde bağımsız bir notification-service'e ayrılarak olay güdümlü ortak bir yeteneğe dönüştürülmüştür." }
  @{ a = "birbirinden farklı altı domaini tek bir tutarlı kullanıcı deneyimi"; n = "Elde edilen sonuçlar, kampüs içi dağınık süreçlerin tek bir platformda başarıyla bütünleştirilmesini sağlamıştır. Bölüm 2'de incelenen literatür, kampüs dijitalleşmesinin çoğunlukla parçalı kaldığını ve bütünsel uygulamaların sınırlı olduğunu ortaya koymuştu (Castro Benavides vd., 2020; Polin vd., 2023). Bu çalışma, söz konusu boşluğa somut bir yanıt üreterek; kulüp, tesis, yemek ve ulaşım gibi birbirinden farklı domainleri — ve aynı omurgaya eklenmek üzere tasarlanan proje eşleştirme ile mikro iş modüllerini — tek bir tutarlı kullanıcı deneyimi ve ortak bir güvenlik omurgası altında birleştiren bütünleşik bir mimari kurmuştur." }
  @{ a = "Örneğin proje eşleştirme ve mikro iş modüllerinin aynı etiket altyapısını paylaşması"; n = "Platformun en belirgin katkısı, modüllerin birbirinden yalıtılmış teknik parçalar olarak değil; ortak altyapıyı (kimlik, profil, bildirim, mesajlaşma, etiket sistemi) paylaşan bir bütünün parçaları olarak tasarlanmasıdır. Örneğin bildirim işlevinin tek bir servise toplanarak kulüp, tesis, yemek ve yolculuk modülleri tarafından olay güdümlü biçimde ortak kullanılması, hem geliştirme tekrarını önlemiş hem de kullanıcı açısından tutarlı tek bir bildirim deneyimi sağlamıştır. Benzer biçimde, kullanıcı kaydı gibi bir olayın birden çok servisi (profil oluşturma) tetiklemesi, bütünleşik platform vizyonunun teknik düzeydeki karşılığını oluşturmuştur." }
  @{ a = "kampüs yaşamının altı farklı domainini"; n = "Çalışma, kampüs yaşamının dört temel domainini — kulüp ve etkinlik yönetimi, spor tesisleri rezervasyonu, çevrimiçi yemek siparişi ve planlı paylaşımlı yolculuk — ortak bir kimlik, bildirim ve mesajlaşma altyapısı üzerinde birleştirmiş; projenin tam vizyonundaki beceri tabanlı proje eşleştirme ve kampüs içi mikro iş pazarı modüllerini ise aynı omurgaya eklenmek üzere tasarım düzeyinde ele almıştır. Bölüm 2'de incelenen literatür, kampüs dijitalleşmesinin çoğunlukla parçalı kaldığını ve bu domainleri bütünsel biçimde bir araya getiren uygulamaların sınırlı olduğunu ortaya koymuştu. Bu çalışma, söz konusu boşluğa somut bir yanıt üreterek, birbirinden farklı süreçlerin tek bir kullanıcı deneyimi ve ortak bir güvenlik omurgası altında bütünleştirilebileceğini göstermiştir." }
  @{ a = "Paylaşımlı yolculuk ve mikro iş gibi modüllerin ticari uygulamaların"; n = "Çalışmanın özgün değeri iki düzeyde ortaya çıkmaktadır. Birincisi, üretilen çalışan yazılımın kendisidir; ikincisi ve daha kalıcı olanı ise, kampüs süreçlerinin bütünleştirilmesine ilişkin sunduğu, gerekçelendirilmiş ve genişletilebilir mimari modeldir. Paylaşımlı yolculuk modülünün — ve tasarımı yapılan mikro iş modülünün — ticari uygulamaların birebir kopyası olmak yerine üniversite bağlamına uyarlanması (kapalı topluluk güveni, hibrit konum modeli, çift yönlü itibar; mikro iş tasarımında ücretli/gönüllü ayrımı) ve eğitim bilimleri ile insan-bilgisayar etkileşimi kuramlarıyla (Astin, 1984; Tinto, 1975; Sweller, 1988; Norman, 2004) ilişkilendirilmesi, çalışmayı salt bir yazılım geliştirme egzersizinin ötesine taşımaktadır." }
)

# --- Hedefli Find&Replace (<255 karakter) ---
$fr = @(
  @{ f = "3.6.7. Kampüs İçi Mikro İş Pazarı (MicroJob)"; r = "3.6.9. Kampüs İçi Mikro İş Pazarı (MicroJob)" }
  @{ f = "3.6.6. Proje Eşleştirme Sistemi (ProjectMatch)"; r = "3.6.8. Proje Eşleştirme Sistemi (ProjectMatch)" }
  @{ f = "3.6.5. Etiket Tabanlı İlgi Alanı ve Beceri Altyapısı (Ortak Bileşen)"; r = "3.6.7. Etiket Tabanlı İlgi Alanı ve Beceri Altyapısı (Ortak Bileşen)" }
  @{ f = "(3.6.5)"; r = "(3.6.7)" }
  @{ f = "altı fonksiyonel modülü sırayla"; r = "fonksiyonel modülleri sırayla" }
  @{ f = "(SKS yöneticisi, öğrenci işleri, tesis yöneticisi veya öğrenci paneli)"; r = "— sistem yöneticisi (admin), SKS yöneticisi, öğrenci işleri (registrar), tesis yöneticisi, işletme yetkilisi, yolculuk (ride) yöneticisi veya öğrenci paneli —" }
  @{ f = "bildirim gibi tek tüketicisi olan işlevler, gereksiz dağıtık karmaşıklıktan kaçınmak için mevcut servis içinde tutulmuştur."; r = "bildirim gibi işlevler ise ancak birden çok modül tarafından üretilmeye başlandığında ayrı bir servise (notification-service) taşınmıştır." }
  @{ f = "başlangıçta hedeflenen işlevsel kapsamı karşılamıştır. Karşılanan başlıca gereksinimler"; r = "başlangıçta hedeflenen çekirdek işlevsel kapsamı karşılamış; projenin tam vizyonundaki proje eşleştirme ve mikro iş modülleri ise tasarım düzeyinde ele alınarak gelecek çalışmaya bırakılmıştır. Gereksinimlerin karşılanma durumu" }
  @{ f = "kulüp, tesis, yemek, ulaşım, proje ve mikro iş süreçleri tek bir arayüz ve tek bir kimlik altında toplanmıştır."; r = "kulüp, tesis, yemek ve ulaşım süreçleri, ortak bir bildirim ve mesajlaşma katmanıyla birlikte tek bir arayüz ve tek bir kimlik altında toplanmış; proje eşleştirme ve mikro iş süreçleri ise aynı omurgaya eklenecek biçimde tasarlanmıştır." }
  @{ f = "akranlar arası (P2P) modüllerde (paylaşımlı yolculuk, mikro iş) çift yönlü itibar mekanizmalarının kullanılması"; r = "akranlar arası (P2P) etkileşim içeren paylaşımlı yolculuk modülünde çift yönlü puanlama/itibar mekanizmasının kullanılması (ve aynı yaklaşımın mikro iş tasarımına taşınması)" }
  @{ f = "bildirim gibi tek tüketicili işlevlerin ayrı servise bölünmemesi gibi bilinçli kararlarla"; r = "bir sorumluluğun ancak birden çok üreticisi/tüketicisi ortaya çıktığında ayrı servise taşınması (bildirim işlevinde olduğu gibi) gibi bilinçli kararlarla" }
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$basarili = 0; $bulunamadi = @()
try {
  $doc = $word.Documents.Open($path, $false, $false)

  # Paragraf değişimleri
  foreach ($e in $paraEdits) {
    $found = $false
    foreach ($p in $doc.Paragraphs) {
      $txt = $p.Range.Text
      if ($txt.Contains($e.a)) {
        $rng = $p.Range.Duplicate
        if ($rng.End - $rng.Start -gt 1) { $rng.End = $rng.End - 1 }  # ¶ hariç
        $rng.Text = $e.n
        $found = $true; $basarili++
        break
      }
    }
    if (-not $found) { $bulunamadi += "PARA: " + $e.a }
  }

  # Find&Replace
  foreach ($e in $fr) {
    $rng = $doc.Content
    $f = $rng.Find
    $f.ClearFormatting(); $f.Replacement.ClearFormatting()
    $f.Forward = $true; $f.Wrap = 1; $f.MatchWildcards = $false
    $ok = $f.Execute($e.f, $false, $false, $false, $false, $false, $true, 1, $false, $e.r, 2)
    if ($ok) { $basarili++ } else { $bulunamadi += "FR: " + $e.f }
  }

  $doc.Save()
  $doc.Close($true)
  Write-Output "BAŞARILI değişim: $basarili"
  if ($bulunamadi.Count -gt 0) { Write-Output "BULUNAMADI ($($bulunamadi.Count)):"; $bulunamadi | ForEach-Object { Write-Output "  - $_" } }
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
