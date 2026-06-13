# Modül özel isimlerini docx'e ekler (başlıklar + Bölüm 1.3 tanıtımı). Biçim/sayfa no/diyagram korunur.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
$f="$build\IsikCampusOS_Tez_v3.docx"
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($f)

function FR($find,$rep){
  $x=$d.Content.Find; $x.ClearFormatting(); $x.Replacement.ClearFormatting(); $x.MatchWildcards=$false
  [void]$x.Execute($find,$false,$false,$false,$false,$false,$true,1,$false,$rep,2)
}

# 1) BAŞLIKLAR (paragraf sonu ^p ile sınırla -> sadece gerçek başlıklar, 1.3 cümlesi etkilenmez)
FR "Kulüp ve Etkinlik Yönetimi^p" "Kulüp ve Etkinlik Yönetimi (ClubHub)^p"
FR "Spor Tesisleri Rezervasyon Sistemi^p" "Spor Tesisleri Rezervasyon Sistemi (SpotReserve)^p"
FR "Kampüs Çevrimiçi Yemek Sipariş ve Yönetim Sistemi^p" "Kampüs Çevrimiçi Yemek Sipariş ve Yönetim Sistemi (UniEats)^p"

# 2) BÖLÜM 1.3 tanıtım cümlesi (benzersiz '(açıklama' kuyruklarıyla)
FR "Yönetimi (kulüp kuruluşu" "Yönetimi — ClubHub (kulüp kuruluşu"
FR "Sistemi (kaynak listeleme" "Sistemi — SpotReserve (kaynak listeleme"
FR "Sistemi (satıcı ve menü" "Sistemi — UniEats (satıcı ve menü"
FR "Sistemi (sürücü/yolcu" "Sistemi — CampusRide (sürücü/yolcu"
FR "Sistemi (beceri profilleri" "Sistemi — ProjectMatch (beceri profilleri"
FR "Pazarı (kısa süreli" "Pazarı — MicroJob (kısa süreli"

# 3) TOC + alanları güncelle
$d.Fields.Update() | Out-Null
foreach($toc in $d.TablesOfContents){ $toc.Update() }
$d.Repaginate()

# doğrula
$tt=$d.TablesOfContents.Item(1).Range.Text
foreach($k in @("ClubHub","SpotReserve","UniEats","CampusRide","ProjectMatch","MicroJob")){
  "TOC içinde '$k': "+([regex]::Matches($tt,[regex]::Escape($k)).Count)+" kez"
}

$d.Save()
$pdf="$build\onizleme_v3.pdf"; Remove-Item $pdf -Force -EA SilentlyContinue
$d.SaveAs([ref]$pdf,[ref]17)
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
# ana konuma kopyala
Copy-Item $f "$build\IsikCampusOS_Tez_SABLON.docx" -Force
try { Copy-Item $f "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx" -Force -EA Stop; Write-Output "ANA DOSYA GÜNCELLENDİ" } catch { Write-Output "Ana dosya kilitli; güncel: build\IsikCampusOS_Tez_v3.docx" }
Write-Output "TAMAM"
