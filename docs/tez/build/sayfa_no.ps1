# Ön kısımlar roman (i,ii..), Bölüm 1'den itibaren arabik (1,2..) sayfa numarası.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400
$f="$build\IsikCampusOS_Tez_SABLON.docx"
$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($f)

$wdSectionBreakNextPage=2
$wdFieldPage=33
$wdAlignCenter=1
$wdRoman=2          # lowerRoman (NumberStyle)
$wdArabic=0
$wdHFPrimary=1
$wdSeekCurrentPageHeaderFooter=10

# 1) "BÖLÜM 1: GİRİŞ" başlık paragrafını bul, ÖNÜNE next-page section break ekle
$rng=$d.Content
$find=$rng.Find
$find.ClearFormatting(); $find.Text="BÖLÜM 1: GİRİŞ"
if(-not $find.Execute()){ throw "BÖLÜM 1 başlığı bulunamadı" }
# rng artık eşleşen metni gösteriyor; başlangıcına git
$pos=[int]$rng.Start
$ins=$d.Range($pos,$pos)
# section break ekle (başlığın hemen önüne)
$ins.InsertBreak($wdSectionBreakNextPage)
Write-Output "Section break eklendi (Bölüm 1 öncesi). Section sayısı: $($d.Sections.Count)"

# 2) Section'ları al: artık 2 section olmalı. Section1=ön kısım, Section2=gövde
# break sonrası başlık yeni section'ın başına geçti
$sec1=$d.Sections.Item(1)
$sec2=$d.Sections.Item(2)

# 3) Section2 footer'ı section1'den ayır (LinkToPrevious=false) ki farklı numara biçimi olsun
$f2=$sec2.Footers.Item($wdHFPrimary)
$f2.LinkToPrevious=$false
$f1=$sec1.Footers.Item($wdHFPrimary)
$f1.LinkToPrevious=$false

# 4) Footer'lara PAGE alanı ekle (ortalı) — önce temizle
foreach($ff in @($f1,$f2)){
  $ff.Range.Text=""
  $ff.Range.ParagraphFormat.Alignment=$wdAlignCenter
  $ff.Range.Fields.Add($ff.Range, $wdFieldPage) | Out-Null
}

# 5) Numara biçimleri: section1 roman (i..), section2 arabik 1'den
$f1.PageNumbers.NumberStyle=$wdRoman
$f1.PageNumbers.RestartNumberingAtSection=$true
$f1.PageNumbers.StartingNumber=1
$f2.PageNumbers.NumberStyle=$wdArabic
$f2.PageNumbers.RestartNumberingAtSection=$true
$f2.PageNumbers.StartingNumber=1
Write-Output "Sayfa numarası biçimleri ayarlandı: S1=roman, S2=arabik(1)"

# 6) TOC + alan güncelle
$d.Fields.Update() | Out-Null
foreach($toc in $d.TablesOfContents){ $toc.Update() }
$d.Repaginate()

# doğrula
$si=0
foreach($sec in $d.Sections){ $si++; $ff=$sec.Footers.Item($wdHFPrimary); "Section $si : numStyle="+$ff.PageNumbers.NumberStyle+" start="+$ff.PageNumbers.StartingNumber+" alan="+$ff.Range.Fields.Count }

$d.Save()
$pdf="$build\onizleme_sablon.pdf"; Remove-Item $pdf -Force -EA SilentlyContinue
$d.SaveAs([ref]$pdf,[ref]17)
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "SAYFA NUMARASI TAMAM"
