# ADIM 1: Caption'ları gerçek Word Caption (SEQ) yap; tablo hücre stilini onar; Şekil/Tablo listelerini doldur.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
$main="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($main)
$wdFieldEmpty=-1; $wdWithInTable=12; $wdAlignCenter=1; $wdAlignLeft=0
$capStyle=$d.Styles.Item("Resim Yazısı")
$normStyle=$d.Styles.Item("Normal")

# --- A) Tablo İÇİNDEKİ 'Resim Yazısı' stilli hücreleri Normal'e çek (tablo metni onarımı) ---
$tblFix=0
foreach($p in $d.Paragraphs){
  if($p.Style.NameLocal -eq "Resim Yazısı" -and $p.Range.Information($wdWithInTable)){
    $p.Style=$normStyle
    $p.Range.ParagraphFormat.Alignment=$wdAlignLeft
    $tblFix++
  }
}
Write-Output "A) Tablo hücre stili onarıldı: $tblFix paragraf"

# --- B) Gerçek caption'ları (tablo DIŞI, 'Şekil/Tablo <no>') SEQ'li yap ---
# Toplama: önce hedef paragrafları listele (canlı koleksiyon değişeceği için index'le)
$caps=@()
foreach($p in $d.Paragraphs){
  if($p.Style.NameLocal -eq "Resim Yazısı" -and -not $p.Range.Information($wdWithInTable)){
    $t=($p.Range.Text -replace '[\r\n\x07]','').Trim()
    if($t -match '^(Şekil|Tablo)\s+[\d.]+\s*[:\.]\s*(.+)$'){
      $caps += [pscustomobject]@{ Para=$p; Label=$matches[1]; Title=$matches[2].Trim() }
    }
  }
}
Write-Output ("B) Gerçek caption sayısı: "+$caps.Count)

$figN=0; $tblN=0
foreach($c in $caps){
  $p=$c.Para; $label=$c.Label; $title=$c.Title
  # paragraf içeriğini temizle (paragraf işaretini koru)
  $r=$p.Range; $r.End=$r.End-1
  $r.Text=""
  # "Label " yaz
  $r=$p.Range; $r.End=$r.End-1; $r.Collapse(0)
  $r.InsertAfter("$label ")
  # SEQ alanı ekle
  $r2=$p.Range; $r2.End=$r2.End-1; $r2.Collapse(0)
  [void]$d.Fields.Add($r2,$wdFieldEmpty,"SEQ $label \* ARABIC",$false)
  # ". Başlık" ekle
  $r3=$p.Range; $r3.End=$r3.End-1; $r3.Collapse(0)
  $r3.InsertAfter(". $title")
  if($label -eq "Şekil"){$figN++}else{$tblN++}
}
Write-Output "   Şekil caption: $figN | Tablo caption: $tblN"

# --- C) Şekil/Tablo Listesi + tüm alanları güncelle ---
$d.Fields.Update() | Out-Null
foreach($toc in $d.TablesOfContents){ $toc.Update() }
try { foreach($tof in $d.TablesOfFigures){ $tof.Update() } } catch {}
$d.Repaginate()

# --- doğrula: Şekil/Tablo listesi alanlarının sonucu ---
foreach($fld in $d.Fields){
  $code=$fld.Code.Text.Trim()
  if($code -match 'TOC \\c'){
    $res=($fld.Result.Text -replace '[\r\n\x07]',' | ').Trim()
    "LISTE ($code): "+$res.Substring(0,[Math]::Min(220,$res.Length))
  }
}
$d.Save()
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "ADIM 1 TAMAM"
