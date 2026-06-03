# Kalan 3 diyagramı SİL: her biri için AYRI Word oturumu (COM koleksiyon bozulmasını önler).
$ErrorActionPreference="Stop"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$targets=@("Rezervasyon Çakışma Kontrolü Akışı","Sipariş Durum Makinesi","MicroJob İlan Durum Makinesi")

foreach($tg in $targets){
  Get-Process WINWORD -EA SilentlyContinue | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 700
  $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
  $d=$w.Documents.Open($main)
  $silindi=$false
  $cnt=$d.Paragraphs.Count
  for($i=1;$i -le $cnt;$i++){
    $p=$d.Paragraphs.Item($i)
    if($p.Style.NameLocal -eq "Resim Yazısı"){
      $t=($p.Range.Text -replace '[\r\n\x07]','').Trim()
      if($t -like "*$tg*"){
        $start=[int]$p.Range.Start
        $nx=$p.Next()
        $end=if($nx){[int]$nx.Range.End}else{[int]$p.Range.End}
        [void]$d.Range($start,$end).Delete()
        $silindi=$true
        break
      }
    }
  }
  if($silindi){ $d.Save(); Write-Output "Silindi: $tg" } else { Write-Output "! bulunamadı (caption): $tg" }
  $d.Close($false); $w.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

# Son: alanları/listeleri güncelle
Get-Process WINWORD -EA SilentlyContinue | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 700
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)
1..2 | ForEach-Object { $d.Fields.Update()|Out-Null; foreach($t in $d.TablesOfContents){$t.Update()}; $d.Repaginate() }
Write-Output ("Sayfa: "+$d.ComputeStatistics(2))
foreach($fld in $d.Fields){ if($fld.Code.Text.Trim() -match 'TOC \\c "Şekil"'){ Write-Output "--- ŞEKİL LİSTESİ ---"; Write-Output (($fld.Result.Text -replace '\x07',' ' -replace '\r',"`n").Trim()) } }
$d.Save(); $d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "TAMAM"
