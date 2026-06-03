# Sadeleştirme turu 2: 5.2.2, 5.1.4, 3.2.5, Tablo 3.2, Fitts/Hick, 6.2-algoritma maddesi sil + dil düzelt.
# Her yapısal silme AYRI Word oturumu (COM koleksiyon bozulmasını önler). Tasarım korunur.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
function KillWord { Get-Process WINWORD -EA SilentlyContinue | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 700 }

# YEDEK
KillWord
$ts=Get-Date -Format yyyyMMdd_HHmmss
Copy-Item $main "$build\yedek_sadelestirme2_$ts.docx" -Force
Write-Output "YEDEK: yedek_sadelestirme2_$ts.docx"

# --- helper: başlık metinleri arası aralık sil (ayrı oturum) ---
function RemoveRange($fromText,$toText,$label){
  KillWord
  $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
  $d=$w.Documents.Open($main)
  $from=$null; $to=$null
  foreach($p in $d.Paragraphs){
    $t=($p.Range.Text -replace '[\r\n\x07]','').Trim()
    if(-not $from -and $p.Style.NameLocal -like "Başlık*" -and $t -like "*$fromText*"){ $from=$p; continue }
    if($from -and -not $to -and $p.Style.NameLocal -like "Başlık*" -and $t -like "*$toText*"){ $to=$p; break }
  }
  if($from -and $to){ [void]$d.Range([int]$from.Range.Start,[int]$to.Range.Start).Delete(); $d.Save(); Write-Output "OK sil: $label" }
  else { Write-Output "! bulunamadı: $label (from=$($from -ne $null) to=$($to -ne $null))" }
  $d.Close($false); $w.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null; [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null; [GC]::Collect()
}
# --- helper: caption (Resim Yazısı) + sonraki tablo sil ---
function RemoveCaptionTable($capText,$label){
  KillWord
  $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
  $d=$w.Documents.Open($main)
  $cap=$null
  foreach($p in $d.Paragraphs){ if($p.Style.NameLocal -eq "Resim Yazısı"){ $t=($p.Range.Text -replace '[\r\n\x07]','').Trim(); if($t -like "*$capText*"){ $cap=$p; break } } }
  if($cap){
    $start=[int]$cap.Range.Start
    $nx=$cap.Next()
    # sonraki paragraf tablo içindeyse, tablonun sonuna kadar al
    if($nx -and $nx.Range.Tables.Count -gt 0){ $end=[int]$nx.Range.Tables.Item(1).Range.End } else { $end=if($nx){[int]$nx.Range.End}else{[int]$cap.Range.End} }
    [void]$d.Range($start,$end).Delete(); $d.Save(); Write-Output "OK sil: $label"
  } else { Write-Output "! caption bulunamadı: $label" }
  $d.Close($false); $w.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null; [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null; [GC]::Collect()
}
# --- helper: tek paragraf sil (içerik metniyle) ---
function RemovePara($contains,$label){
  KillWord
  $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
  $d=$w.Documents.Open($main)
  $hit=$null
  foreach($p in $d.Paragraphs){ $t=($p.Range.Text -replace '[\r\n\x07]','').Trim(); if($t -like "*$contains*"){ $hit=$p; break } }
  if($hit){ [void]$d.Range([int]$hit.Range.Start,[int]$hit.Range.End).Delete(); $d.Save(); Write-Output "OK sil para: $label" }
  else { Write-Output "! para bulunamadı: $label" }
  $d.Close($false); $w.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null; [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null; [GC]::Collect()
}

# === İŞLEMLER ===
RemoveRange "Güçlü Yönler" "BÖLÜM 6" "5.2.2 Güçlü Yönler"
RemoveRange "Değerlendirme Yöntemine" "Tartışma" "5.1.4 Değerlendirme Yöntemi Notu"
RemoveRange "Bildirim Sorumluluğunun" "Kimlik Doğrulama ve Güvenlik" "3.2.5 Bildirim ADR"
RemoveCaptionTable "Kafka Olay Akışları" "Tablo 3.2 Kafka Olayları"
RemovePara "Algoritmaların ölçeklenmemiş olması" "6.2 Algoritma sınırlılığı maddesi"
RemovePara "Fitts, P. M. (1954)" "Kaynakça Fitts"
RemovePara "Hick, W. E. (1952)" "Kaynakça Hick"

# === Find/Replace (tek oturum, COM-safe) ===
KillWord
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)
function FR($find,$rep,$wild){
  $x=$d.Content.Find; $x.ClearFormatting(); $x.Replacement.ClearFormatting(); $x.MatchWildcards=$wild
  [void]$x.Execute($find,$false,$false,$wild,$false,$false,$true,1,$false,$rep,2)
}
# Fitts/Hick cümlesini (Bölüm 2.3) kaldır (wildcard)
FR "Etkinlik öğelerinin tasarımına yön veren iki klasik ilke*ortaya koyar." "" $true
# Tablo 3.2 atıf cümlesi
FR "Platformda kullanılan başlıca olay akışları Tablo 3.2*sunulmuştur." "" $true
FR " Bu akış Şekil*gösterilmektedir." "" $true
# 5.2.1 temkinli dil -> kesin (bitmiş proje)
FR "tek bir platformda bütünleştirilmesinin teknik olarak uygulanabilir olduğunu göstermektedir" "tek bir platformda başarıyla bütünleştirilmesini sağlamıştır" $false
FR "altında birleştiren bir mimarinin kurulabileceğini göstermiştir" "altında birleştiren bütünleşik bir mimari kurmuştur" $false
$d.Fields.Update()|Out-Null
foreach($t in $d.TablesOfContents){$t.Update()}
foreach($tof in $d.TablesOfFigures){$tof.Update()}
$d.Repaginate()
$d.Save()
Write-Output ("Sayfa: "+$d.ComputeStatistics(2))
$d.Close($false); $w.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null; [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null; [GC]::Collect()
Write-Output "SADELEŞTİRME 2 TAMAM"
