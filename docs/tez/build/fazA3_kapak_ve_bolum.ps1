$ErrorActionPreference = "Continue"
$cur = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$tpl = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\_sablon_kaynak.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  # 1) KAPAK SAYFA NO: Bölüm 1 farklı-ilk-sayfa, ilk sayfa altbilgisini boşalt
  $d = $word.Documents.Open($cur, $false, $false)
  $s1 = $d.Sections.Item(1)
  $s1.PageSetup.DifferentFirstPageHeaderFooter = -1  # true
  $ff = $s1.Footers.Item(2)  # wdHeaderFooterFirstPage
  $ff.Range.Delete() | Out-Null
  $ff.PageNumbers | ForEach-Object { } # no-op
  Write-Output ("Kapak: farklıİlkSayfa=$($s1.PageSetup.DifferentFirstPageHeaderFooter) ilkSayfaAltbilgi='" + (($ff.Range.Text -replace '[\r\n]','').Trim()) + "'")

  # GÖVDE bölüm başlığı yapısını incele (Başlık 1, BÖLÜM içeren)
  Write-Output "--- MEVCUT gövde Başlık 1 paragrafları ---"
  $n=0
  foreach ($p in $d.Paragraphs) {
    if ($p.Style.NameLocal -like "Başlık 1*") {
      $raw = $p.Range.Text
      $vis = $raw -replace "`r","\r" -replace "`n","\n" -replace [char]11,"\v"
      if ($vis.Length -gt 70) { $vis = $vis.Substring(0,70) }
      $lf = $p.Range.ListFormat.ListString
      Write-Output ("  stil='{0}' liste='{1}' metin='{2}'" -f $p.Style.NameLocal,$lf,$vis)
      $n++; if ($n -ge 7) { break }
    }
  }
  $d.Save(); $d.Close($true)
  Write-Output "KAYDEDİLDİ (kapak)."

  # ŞABLON bölüm başlığı yapısı
  Write-Output "--- ŞABLON gövde Başlık 1 paragrafları ---"
  $d2 = $word.Documents.Open($tpl, $false, $true)
  $n=0
  foreach ($p in $d2.Paragraphs) {
    if ($p.Style.NameLocal -like "Başlık 1*") {
      $raw = $p.Range.Text
      $vis = $raw -replace "`r","\r" -replace "`n","\n" -replace [char]11,"\v"
      if ($vis.Length -gt 70) { $vis = $vis.Substring(0,70) }
      $lf = $p.Range.ListFormat.ListString
      Write-Output ("  stil='{0}' liste='{1}' metin='{2}'" -f $p.Style.NameLocal,$lf,$vis)
      $n++; if ($n -ge 5) { break }
    }
  }
  $d2.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
