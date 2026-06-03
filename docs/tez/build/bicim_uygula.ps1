# Yönerge biçim kurallarını STİL düzeyinde uygular (tüm metne yayılır).
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
$f="$build\IsikCampusOS_Tez_SABLON.docx"
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($f)

$CM=28.35           # 1 cm = 28.35 pt
$wdAlignJustify=3
$wdLineSpace1pt5=1  # LineSpacingRule: 1 = wdLineSpace1pt5
$FONT="Palatino Linotype"

# ---- 1) Kenar boşlukları 2.54 cm (tüm section) ----
foreach($sec in $d.Sections){
  $ps=$sec.PageSetup
  $ps.TopMargin=2.54*$CM; $ps.BottomMargin=2.54*$CM; $ps.LeftMargin=2.54*$CM; $ps.RightMargin=2.54*$CM
}
Write-Output "1) Kenar boşlukları 2.54 cm"

# ---- 2) GÖVDE stilleri: Palatino, 12pt, justify, 1.5 satır, 1.27cm ilk girinti, 0 boşluk ----
function FixBody($styleName){
  try{
    $s=$d.Styles.Item($styleName)
    $s.Font.Name=$FONT; $s.Font.Size=12
    $pf=$s.ParagraphFormat
    $pf.Alignment=$wdAlignJustify
    $pf.LineSpacingRule=$wdLineSpace1pt5
    $pf.FirstLineIndent=1.27*$CM
    $pf.SpaceBefore=0; $pf.SpaceAfter=0
    Write-Output "   stil ayarlandı: $styleName"
  }catch{ Write-Output "   ! stil yok: $styleName" }
}
FixBody "Gövde Metni"
FixBody "Normal"

# ---- 3) BAŞLIK stilleri: Palatino, 12pt değil ama font tutarlı; justify değil (başlık), boşluk korunur ----
# Yönerge "tüm raporda tek yazı tipi" -> başlıkları da Palatino yap (boyut/kalın korunur)
foreach($hs in @("Başlık 1;h1","Başlık 3;h3","Başlık 5;h5")){
  try{ $s=$d.Styles.Item($hs); $s.Font.Name=$FONT }catch{}
}
# Resim Yazısı (caption) da Palatino
try{ $d.Styles.Item("Resim Yazısı").Font.Name=$FONT }catch{}
Write-Output "3) Başlık + caption fontu Palatino"

# ---- 4) Doğrudan paragraf override'larını temizle (gövde + normal paragrafları stile uysun) ----
# Bazı paragraflara InsertAfter sırasında doğrudan hizalama atanmış olabilir; stile bağla.
$fixed=0
foreach($p in $d.Paragraphs){
  $sn=$p.Style.NameLocal
  if($sn -eq "Gövde Metni" -or $sn -eq "Normal"){
    $pf=$p.Format
    # eşitlik tablo/şekil ortalananları atlamak için: yalnızca sola/şu an justify olmayanları düzelt
    if($pf.Alignment -ne 1){ # 1=center (şekil/denklem ortalı kalsın)
      $pf.Alignment=$wdAlignJustify
      $pf.LineSpacingRule=$wdLineSpace1pt5
      $pf.SpaceBefore=0; $pf.SpaceAfter=0
      if($pf.FirstLineIndent -lt 1*$CM){ $pf.FirstLineIndent=1.27*$CM }
      $fixed++
    }
  }
}
Write-Output "4) Paragraf override düzeltildi: $fixed"

# ---- 5) Tüm metin fontunu Palatino'ya zorla (kapak hariç tutmaya gerek yok; kapak zaten Palatino) ----
# (stil bazlı yeterli; ek garanti için gövde+ön kısım aralığı)

# ---- 6) TOC + alanları güncelle, kaydet, PDF ----
$d.Fields.Update() | Out-Null
foreach($toc in $d.TablesOfContents){ $toc.Update() }
$d.Repaginate()
Write-Output ("SAYFA: "+$d.ComputeStatistics(2))
$d.Save()
$pdf="$build\onizleme_sablon.pdf"; Remove-Item $pdf -Force -EA SilentlyContinue
$d.SaveAs([ref]$pdf,[ref]17)
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "BİÇİM UYGULANDI"
