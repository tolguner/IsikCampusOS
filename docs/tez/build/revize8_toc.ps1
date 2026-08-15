$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $false)
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  foreach ($tof in $doc.TablesOfFigures) { $tof.Update() }
  $doc.Repaginate()
  $doc.Save()
  $doc.Close($true)
  Write-Output "TOC güncellendi, kaydedildi."

  # Doğrulama: gövdede hâlâ var mı + TOC'ta görünüyor mu
  $doc2 = $word.Documents.Open($path, $false, $true)
  $bilBody = 0; $mesBody = 0
  foreach ($p in $doc2.Paragraphs) {
    $t = $p.Range.Text
    if ($t.Contains("3.6.5. Bildirim Yönetimi")) { $bilBody++ }
    if ($t.Contains("3.6.6. Bağlam Temelli Mesajlaşma")) { $mesBody++ }
  }
  Write-Output "3.6.5 Bildirim toplam görünüm (gövde+TOC, >=2 iyi): $bilBody"
  Write-Output "3.6.6 Mesajlaşma toplam görünüm (>=2 iyi):         $mesBody"
  Write-Output "Sayfa sayısı: $($doc2.ComputeStatistics(2))"
  Write-Output "Kelime sayısı: $($doc2.ComputeStatistics(0))"
  $doc2.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
