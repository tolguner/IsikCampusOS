# Bölüm 3 sadeleştirme: 3.7 bölümü + 4 diyagram + atıf cümleleri sil; kalan şekil numaralarını düzelt.
# HEDEFLİ Word COM (kullanıcının tasarım düzenlemeleri korunur). Pipeline ÇALIŞTIRILMAZ.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -EA SilentlyContinue | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Seconds 1
try { $fs=[IO.File]::Open($main,'Open','ReadWrite','None'); $fs.Close() } catch { Write-Output "DOSYA KİLİTLİ — Word'de kapat."; exit }
# taze yedek
$ts=Get-Date -Format yyyyMMdd_HHmmss
Copy-Item $main "$build\yedek_sadelestirme_oncesi_$ts.docx" -Force
Write-Output "YEDEK: yedek_sadelestirme_oncesi_$ts.docx"

$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)
$H1="Başlık 1;h1"; $H3="Başlık 3;h3"; $CAP="Resim Yazısı"
function FindPara($styleMatch,$contains){
  foreach($p in $d.Paragraphs){
    if($p.Style.NameLocal -like $styleMatch){
      $t=($p.Range.Text -replace '[\r\n\x07]','').Trim()
      if($t -like "*$contains*"){ return $p }
    }
  }
  return $null
}
function FR($find,$rep){
  $x=$d.Content.Find; $x.ClearFormatting(); $x.Replacement.ClearFormatting(); $x.MatchWildcards=$false
  [void]$x.Execute($find,$false,$false,$false,$false,$false,$true,1,$false,$rep,2)
}

# --- 1) Bölüm 3.7 (Önerilen Algoritmik Tasarımlar) -> BÖLÜM 4 arası sil (Şekil 3.9 + denklemler dahil) ---
$h37=FindPara $H3 "Önerilen Algoritmik"
$h4=FindPara $H1 "BÖLÜM 4"
if($h37 -and $h4){
  [void]$d.Range([int]$h37.Range.Start,[int]$h4.Range.Start).Delete()
  Write-Output "1) Bölüm 3.7 silindi (algoritmalar + Şekil 3.9 + denklemler)."
} else { Write-Output "! 3.7 veya BÖLÜM 4 bulunamadı (h37=$($h37 -ne $null) h4=$($h4 -ne $null))" }

# --- 2) 4 diyagram (caption + resim paragrafı) sil ---
$targets=@("Olay Güdümlü Kullanıcı Kaydı","Rezervasyon Çakışma Kontrolü","Sipariş Durum Makinesi","MicroJob İlan Durum Makinesi")
foreach($tg in $targets){
  $cap=FindPara $CAP $tg
  if($cap){
    $start=[int]$cap.Range.Start
    $nx=$cap.Next()
    $end=if($nx){[int]$nx.Range.End}else{[int]$cap.Range.End}
    [void]$d.Range($start,$end).Delete()
    Write-Output "2) Diyagram silindi: $tg"
  } else { Write-Output "! caption bulunamadı: $tg" }
}

# --- 3) Atıf cümlelerini sil ---
FR " Bu akış Şekil 3.3'te gösterilmektedir." ""
FR "Rezervasyon oluşturma sırasındaki çakışma kontrolü mantığı Şekil 3.6'da gösterilmektedir.^p" ""
FR "Sipariş yaşam döngüsü Şekil 3.7'de gösterilmektedir.^p" ""
FR "MicroJob ilanının yaşam döngüsü Şekil 3.8'de gösterilmektedir.^p" ""
FR " Bu uyum skoru ve kararlı eşleştirme formülasyonu Bölüm 3.7'de sunulmaktadır." ""
Write-Output "3) Atıf cümleleri temizlendi."

# --- 4) Kalan şekil atıf numaralarını SEQ sırasına göre düzelt ---
FR "Şekil 3.1" "Şekil 1"
FR "Şekil 3.2" "Şekil 2"
FR "Şekil 3.4" "Şekil 3"
FR "Şekil 3.5" "Şekil 4"
Write-Output "4) Kalan şekil atıfları yeniden numaralandı."

# --- 5) SEQ + TOC + Şekil/Tablo listesi güncelle ---
1..2 | ForEach-Object { $d.Fields.Update()|Out-Null; foreach($t in $d.TablesOfContents){$t.Update()}; $d.Repaginate() }
Write-Output ("Sayfa: "+$d.ComputeStatistics(2))
foreach($fld in $d.Fields){ if($fld.Code.Text.Trim() -match 'TOC \\c "Şekil"'){ $r=($fld.Result.Text -replace '\x07',' ' -replace '\r',"`n").Trim(); Write-Output "--- ŞEKİL LİSTESİ ---"; Write-Output $r } }

$d.Save(); $d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "SADELEŞTİRME TAMAM"
