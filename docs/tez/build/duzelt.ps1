# Düzeltmeler: başlık otomatik numaralandırmayı kaldır, kapak "BAŞLIK" placeholder temizle, TOC güncelle.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
$f="$build\IsikCampusOS_Tez_SABLON.docx"
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($f)

# 1) Başlık 3 ve Başlık 5 paragraflarındaki otomatik liste numarasını kaldır (manuel numara metinde var)
$cnt=0
foreach($p in $d.Paragraphs){
  $sn=$p.Style.NameLocal
  if($sn -eq "Başlık 3;h3" -or $sn -eq "Başlık 5;h5" -or $sn -eq "Başlık 1;h1"){
    try{
      if($p.Range.ListFormat.ListType -ne 0){ $p.Range.ListFormat.RemoveNumbers(); $cnt++ }
    }catch{}
  }
}
Write-Output "Otomatik numara kaldırılan başlık: $cnt"

# 2) Kapakta kalan 'BAŞLIK' placeholder (tek başına paragraf) temizle
$f2=$d.Content.Find; $f2.ClearFormatting(); $f2.Replacement.ClearFormatting(); $f2.MatchWholeWord=$true; $f2.MatchCase=$true
[void]$f2.Execute("BAŞLIK",$false,$true,$false,$false,$false,$true,1,$false,"",2)

# 3) Alanları + TOC güncelle
$d.Fields.Update() | Out-Null
foreach($toc in $d.TablesOfContents){ $toc.Update() }
$d.Repaginate()
Write-Output ("SAYFA: "+$d.ComputeStatistics(2))

$d.Save()
$pdf="$build\onizleme_sablon.pdf"
Remove-Item $pdf -Force -EA SilentlyContinue
$d.SaveAs([ref]$pdf,[ref]17)
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "DÜZELTME TAMAM"
