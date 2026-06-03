# Sayfa numarası: ön kısımlar roman, Bölüm 1'den arabik. Otomatik (XML + footer).
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
$src="$build\IsikCampusOS_Tez_SABLON.docx"
$tmp="$env:TEMP\tez_xml_auto"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
Remove-Item $tmp -Recurse -Force -EA SilentlyContinue
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($src,$tmp)

# document.xml: Kısaltmalar son paragrafına (UX...) ön-kısım sectPr ekle (roman).
# footerReference YOK (Word kaydında rId'ler değişebilir -> bozuk olur). Footer miras alınır, pgNumType formatı uygulanır.
$docp="$tmp\word\document.xml"
$xml=Get-Content $docp -Raw -Encoding UTF8
$sectPr='<w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838" w:code="9"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="709" w:footer="709" w:gutter="0"/><w:pgNumType w:fmt="lowerRoman" w:start="1"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:pPr>'
# UX paragrafını yakala: <w:p ...>(opsiyonel pPr yok)<w:r>...UX: User Experience...
$pattern='(<w:p\b[^>]*>)(<w:r[^>]*><w:t[^>]*>UX: User Experience)'
if($xml -match [regex]$pattern){
  $xml=[regex]::Replace($xml,$pattern,('$1'+$sectPr+'$2'),1)
  Write-Output "Section break (roman) eklendi."
} else {
  Write-Output "! UX paragrafı bulunamadı - sayfa no eklenemedi"
}
# Gövde (belge sonu) sectPr'i arabik start=1 garantile
$secs=[regex]::Matches($xml,'<w:sectPr\b(?:(?!</w:sectPr>)[\s\S])*</w:sectPr>')
if($secs.Count -gt 0){
  $last=$secs[$secs.Count-1]
  if($last.Value -match 'pgNumType'){
    $nv=$last.Value -replace '<w:pgNumType[^>]*/>','<w:pgNumType w:start="1"/>'
  } else {
    $nv=$last.Value -replace '(</w:sectPr>)','<w:pgNumType w:start="1"/>$1'
  }
  $xml=$xml.Remove($last.Index,$last.Length).Insert($last.Index,$nv)
  Write-Output "Gövde sectPr arabik start=1 ayarlandı."
}
[System.IO.File]::WriteAllText($docp,$xml,(New-Object System.Text.UTF8Encoding($false)))

# 3) repack -> v3
$out="$build\IsikCampusOS_Tez_v3.docx"
Remove-Item $out -Force -EA SilentlyContinue
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmp,$out)

# 4) Word'de aç, alanları güncelle, doğrula, ana konuma kopyala
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($out)
1..2 | ForEach-Object { $d.Fields.Update()|Out-Null; foreach($t in $d.TablesOfContents){$t.Update()}; $d.Repaginate() }
$wdHF=1; $si=0
foreach($sec in $d.Sections){ $si++; "S$si numStyle=$($sec.Footers.Item($wdHF).PageNumbers.NumberStyle) (2=roman,0=arabik)" }
$d.Save()
$pdf="$build\onizleme_v3.pdf"; Remove-Item $pdf -Force -EA SilentlyContinue
$d.SaveAs([ref]$pdf,[ref]17)
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Copy-Item $out $src -Force
try { Copy-Item $out "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx" -Force -EA Stop; Write-Output "ANA DOSYA GÜNCELLENDİ" } catch { Write-Output "Ana dosya kilitli; güncel: build\IsikCampusOS_Tez_v3.docx" }
Write-Output "SAYFA NO TAMAM"
