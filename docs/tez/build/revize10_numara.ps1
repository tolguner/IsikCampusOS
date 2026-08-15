$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$targets = @("3.6.5. Bildirim Yönetimi", "3.6.6. Bağlam Temelli Mesajlaşma")

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $false)
  $fixed = 0
  foreach ($p in $doc.Paragraphs) {
    $t = $p.Range.Text
    $isHeading = $false
    foreach ($tg in $targets) { if ($t.Contains($tg)) { $isHeading = $true } }
    if ($isHeading -and ($p.Style.NameLocal -like "Başlık*")) {
      try { $p.Range.ListFormat.RemoveNumbers() ; $fixed++ } catch {}
    }
  }
  Write-Output "Numara kaldırılan başlık: $fixed"
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  $doc.Repaginate()
  $doc.Save(); $doc.Close($true)

  # Doğrulama: TOC'ta '1.1'/'1.2' öneki kalmadı mı + başlıklar yerinde mi
  $doc = $word.Documents.Open($path, $false, $true)
  $b=0;$m=0;$kotu=0
  foreach ($p in $doc.Paragraphs) {
    $t = $p.Range.Text
    if ($t.Contains("3.6.5. Bildirim Yönetimi")) { $b++; if ($t -match "^\s*1\.\d") { $kotu++ } }
    if ($t.Contains("3.6.6. Bağlam Temelli Mesajlaşma")) { $m++; if ($t -match "^\s*1\.\d") { $kotu++ } }
  }
  Write-Output "3.6.5=$b 3.6.6=$m (her biri 2: gövde+TOC) | '1.x' önekli kötü satır: $kotu (0 olmalı)"
  $doc.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
