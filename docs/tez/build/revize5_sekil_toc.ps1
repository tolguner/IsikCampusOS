$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$png  = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\diagrams\sekil_3_1_v2.png"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $false)

  # 1) Şekil 1 (Genel Sistem Mimarisi) görselini bul ve değiştir
  $paras = @($doc.Paragraphs)
  $capIdx = -1
  for ($i = 0; $i -lt $paras.Count; $i++) {
    if ($paras[$i].Range.Text.Contains("Genel Sistem Mimarisi")) { $capIdx = $i; break }
  }
  if ($capIdx -lt 0) { Write-Output "SEKIL: caption bulunamadı"; }
  else {
    $shp = $null
    for ($k = $capIdx; $k -le [Math]::Min($capIdx + 3, $paras.Count - 1); $k++) {
      if ($paras[$k].Range.InlineShapes.Count -gt 0) { $shp = $paras[$k].Range.InlineShapes.Item(1); break }
    }
    if ($null -eq $shp) { Write-Output "SEKIL: inline görsel bulunamadı" }
    else {
      $oldW = $shp.Width
      $loc = $shp.Range.Duplicate
      $loc.Collapse(1)
      $shp.Delete()
      $ns = $doc.InlineShapes.AddPicture($png, $false, $true, $loc)
      $natW = $ns.Width; $natH = $ns.Height
      $ns.LockAspectRatio = -1
      $ns.Width = $oldW
      Write-Output ("SEKIL: değiştirildi (eskiGenişlik={0}, doğalEn={1}x{2})" -f [int]$oldW, [int]$natW, [int]$natH)
    }
  }

  # 2) TOC + Şekil/Tablo listeleri + tüm alanlar güncelle
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  foreach ($tof in $doc.TablesOfFigures) { $tof.Update() }
  $doc.Fields.Update() | Out-Null
  # Üst bilgi/alt bilgi alanları (sayfa no) için story döngüsü
  foreach ($sec in $doc.Sections) {
    foreach ($hf in @($sec.Headers, $sec.Footers)) {
      foreach ($h in $hf) { try { $h.Range.Fields.Update() | Out-Null } catch {} }
    }
  }
  $doc.Repaginate()

  $doc.Save()
  $doc.Close($true)
  Write-Output "TAMAM: şekil + TOC/alanlar güncellendi, kaydedildi."
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
