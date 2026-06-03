# ADIM 1b: Yanlış 'Başlık' stilinde kalan diyagram/şekil caption'larını Resim Yazısı + SEQ yap.
$ErrorActionPreference="Stop"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)
$wdFieldEmpty=-1; $wdWithInTable=12; $wdAlignCenter=1
$capStyle=$d.Styles.Item("Resim Yazısı")

# Henüz işlenmemiş caption'lar: metni "(Şekil|Tablo) <no.no>:" formatında (':' var, SEQ yok)
$caps=@()
foreach($p in $d.Paragraphs){
  if($p.Range.Information($wdWithInTable)){ continue }
  $t=($p.Range.Text -replace '[\r\n\x07]','').Trim()
  if($t -match '^(Şekil|Tablo)\s+\d+(?:\.\d+)+\s*:\s*(.+)$'){
    $caps += [pscustomobject]@{ Para=$p; Label=$matches[1]; Title=$matches[2].Trim(); Eski=$t }
  }
}
Write-Output ("İşlenmemiş caption bulundu: "+$caps.Count)
foreach($c in $caps){ "  ["+$c.Para.Style.NameLocal+"] "+$c.Eski.Substring(0,[Math]::Min(50,$c.Eski.Length)) }

foreach($c in $caps){
  $p=$c.Para; $label=$c.Label; $title=$c.Title
  $p.Style=$capStyle
  $p.Range.ParagraphFormat.Alignment=$wdAlignCenter
  # içeriği temizle (paragraf işareti hariç)
  $r=$p.Range; $r.End=$r.End-1; $r.Text=""
  $r=$p.Range; $r.End=$r.End-1; $r.Collapse(0); $r.InsertAfter("$label ")
  $r2=$p.Range; $r2.End=$r2.End-1; $r2.Collapse(0)
  [void]$d.Fields.Add($r2,$wdFieldEmpty,"SEQ $label \* ARABIC",$false)
  $r3=$p.Range; $r3.End=$r3.End-1; $r3.Collapse(0); $r3.InsertAfter(". $title")
}
Write-Output "Düzeltildi + SEQ'lendi."

# Alanları + TOC + listeler güncelle (2 kez, SEQ numaraları otursun)
1..2 | ForEach-Object {
  $d.Fields.Update() | Out-Null
  foreach($toc in $d.TablesOfContents){ $toc.Update() }
  $d.Repaginate()
}

# Doğrula: Şekil/Tablo listeleri
foreach($fld in $d.Fields){
  $code=$fld.Code.Text.Trim()
  if($code -match 'TOC \\c'){
    $res=($fld.Result.Text -replace '[\r\n\x07]',' | ').Trim()
    "LISTE ($code): "+$res.Substring(0,[Math]::Min(400,$res.Length))
  }
}
$d.Save(); $d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "ADIM 1b TAMAM"
