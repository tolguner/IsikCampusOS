# Her iki section footer'ına ortalı PAGE alanı ekler (roman S1 / arabik S2). Hedefli düzeltme.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -EA SilentlyContinue | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Seconds 1
# yedek
$bk="$build\yedek_footer_$(Get-Date -Format yyyyMMdd_HHmmss).docx"
Copy-Item $main $bk -Force; Write-Output "YEDEK: $bk"

$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)
$wdP=1; $wdFieldPage=33; $wdCenter=1
$sec1=$d.Sections.Item(1); $sec2=$d.Sections.Item(2)
$f1=$sec1.Footers.Item($wdP); $f2=$sec2.Footers.Item($wdP)
# S2'yi S1'den ayır
$f2.LinkToPrevious=$false
$f1.LinkToPrevious=$false
# her footer'a PAGE alanı (ortalı). Footer paragrafı boş -> doğrudan ekle.
foreach($ft in @($f1,$f2)){
  # mevcut alan varsa temizleme; sadece yoksa ekle
  if($ft.Range.Fields.Count -eq 0){
    $ft.Range.ParagraphFormat.Alignment=$wdCenter
    [void]$ft.Range.Fields.Add($ft.Range,$wdFieldPage,"",$true)
    $ft.Range.ParagraphFormat.Alignment=$wdCenter
  }
}
# numara biçimleri garanti
$f1.PageNumbers.NumberStyle=2   # lowerRoman
$f1.PageNumbers.StartingNumber=1
$f1.PageNumbers.RestartNumberingAtSection=$true
$f2.PageNumbers.NumberStyle=0   # arabik
$f2.PageNumbers.StartingNumber=1
$f2.PageNumbers.RestartNumberingAtSection=$true

# güncelle + doğrula
1..2 | ForEach-Object { $d.Fields.Update()|Out-Null; foreach($t in $d.TablesOfContents){$t.Update()}; $d.Repaginate() }
$si=0
foreach($sec in $d.Sections){ $si++; $fp=$sec.Footers.Item($wdP); Write-Output ("S{0}: footerAlan={1} numStyle={2} start={3}" -f $si,$fp.Range.Fields.Count,$fp.PageNumbers.NumberStyle,$fp.PageNumbers.StartingNumber) }
# görünen sayfa numarası örnekleri
$wdAdjPage=4
$ozet=$null; $b1=$null
foreach($p in $d.Paragraphs){
  $t=($p.Range.Text -replace '[\r\n\x07]','').Trim()
  if(-not $ozet -and $p.Style.NameLocal -eq "Başlık 3;h3" -and $t -eq "Özet"){ $ozet=$p }
  if(-not $b1 -and $p.Style.NameLocal -eq "Başlık 1;h1" -and $t -match "BÖLÜM 1"){ $b1=$p }
}
if($ozet){ Write-Output ("Özet görünen sayfa no: "+$ozet.Range.Information($wdAdjPage)) }
if($b1){ Write-Output ("Bölüm 1 görünen sayfa no: "+$b1.Range.Information($wdAdjPage)) }

$d.Save(); $d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "FOOTER SAYFA NO TAMAM"
