# Kalan 3 diyagramı (caption+resim) Content.Find ile güvenilir biçimde sil.
$ErrorActionPreference="Stop"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -EA SilentlyContinue | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Seconds 1
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)

$targets=@("Rezervasyon Çakışma Kontrolü Akışı","Sipariş Durum Makinesi","MicroJob İlan Durum Makinesi")
foreach($tg in $targets){
  $rng=$d.Content
  $f=$rng.Find; $f.ClearFormatting(); $f.MatchWildcards=$false; $f.Text=$tg
  if($f.Execute()){
    $para=$rng.Paragraphs.Item(1)
    # yalnızca caption (Resim Yazısı) ise sil; değilse atla (yanlış eşleşme koruması)
    if($para.Style.NameLocal -eq "Resim Yazısı"){
      $start=[int]$para.Range.Start
      $nx=$para.Next()
      $end=if($nx){[int]$nx.Range.End}else{[int]$para.Range.End}
      [void]$d.Range($start,$end).Delete()
      Write-Output "Silindi: $tg"
    } else {
      Write-Output "! '$tg' bulundu ama stil '$($para.Style.NameLocal)' (caption değil) - atlandı"
    }
  } else { Write-Output "! bulunamadı: $tg" }
}

# SEQ + TOC + liste güncelle
1..2 | ForEach-Object { $d.Fields.Update()|Out-Null; foreach($t in $d.TablesOfContents){$t.Update()}; $d.Repaginate() }
Write-Output ("Sayfa: "+$d.ComputeStatistics(2))
foreach($fld in $d.Fields){ if($fld.Code.Text.Trim() -match 'TOC \\c "Şekil"'){ Write-Output "--- ŞEKİL LİSTESİ ---"; Write-Output (($fld.Result.Text -replace '\x07',' ' -replace '\r',"`n").Trim()) } }
$d.Save(); $d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "KALAN DİYAGRAMLAR TAMAM"
