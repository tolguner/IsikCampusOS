$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$png  = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\diagrams\sekil_3_1_v2.png"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $false)
  Write-Output "Toplam inline görsel: $($doc.InlineShapes.Count)"

  $target = $null
  foreach ($s in $doc.InlineShapes) {
    try {
      $p = $s.Range.Paragraphs.Item(1)
      $ctx = $p.Range.Text
      try { if ($p.Previous()) { $ctx += " " + $p.Previous().Range.Text } } catch {}
      try { if ($p.Previous() -and $p.Previous().Previous()) { $ctx += " " + $p.Previous().Previous().Range.Text } } catch {}
      if ($ctx.Contains("Genel Sistem Mimarisi")) { $target = $s; break }
    } catch {}
  }

  if ($null -eq $target) { Write-Output "HATA: mimari görsel bulunamadı" }
  else {
    $oldW = $target.Width; $oldH = $target.Height
    $loc = $target.Range.Duplicate; $loc.Collapse(1)
    $target.Delete()
    $ns = $doc.InlineShapes.AddPicture($png, $false, $true, $loc)
    $ns.LockAspectRatio = -1
    $ns.Width = $oldW
    Write-Output ("DEĞİŞTİRİLDİ: eski {0}x{1} -> yeni genişlik {2}, yükseklik {3}" -f [int]$oldW,[int]$oldH,[int]$ns.Width,[int]$ns.Height)
    foreach ($tof in $doc.TablesOfFigures) { $tof.Update() }
    $doc.Save(); $doc.Close($true)
    Write-Output "KAYDEDİLDİ."
  }
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
