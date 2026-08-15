$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$V = [char]11

$map = @(
  @{ bul = "BÖLÜM 1:"; yeni = ("Bölüm 1  " + $V + "Giriş") }
  @{ bul = "BÖLÜM 2:"; yeni = ("Bölüm 2  " + $V + "Literatür Taraması") }
  @{ bul = "BÖLÜM 3:"; yeni = ("Bölüm 3  " + $V + "Metodoloji ve Sistem Tasarımı") }
  @{ bul = "BÖLÜM 4:"; yeni = ("Bölüm 4  " + $V + "Geliştirme") }
  @{ bul = "BÖLÜM 5:"; yeni = ("Bölüm 5  " + $V + "Değerlendirme ve Sonuçlar") }
  @{ bul = "BÖLÜM 6:"; yeni = ("Bölüm 6  " + $V + "Sonuç ve Gelecek Yönelimleri") }
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)
  $ok = 0
  foreach ($m in $map) {
    foreach ($p in $d.Paragraphs) {
      if (($p.Style.NameLocal -like "Başlık 1*") -and $p.Range.Text.Contains($m.bul)) {
        $rr = $p.Range.Duplicate
        if (($rr.End - $rr.Start) -gt 1) { $rr.End = $rr.End - 1 }
        $rr.Text = $m.yeni
        $ok++; break
      }
    }
  }
  Write-Output "Range.Text ile değiştirilen: $ok / 6"
  foreach ($toc in $d.TablesOfContents) { $toc.Update() }
  $d.Repaginate()
  $d.Save(); $d.Close($true)

  $d = $word.Documents.Open($path, $false, $true)
  Write-Output "--- DOĞRULAMA gövde Başlık 1 ---"
  $n=0
  foreach ($p in $d.Paragraphs) {
    if ($p.Style.NameLocal -like "Başlık 1*") {
      $vis = ($p.Range.Text -replace "`r","" -replace [char]11," | ").Trim()
      if ($vis.Length -gt 0) { Write-Output "  $vis"; $n++; if ($n -ge 8) { break } }
    }
  }
  Write-Output "--- TOC'ta bölüm satırları ---"
  $n=0
  foreach ($p in $d.Paragraphs) {
    if ($p.Style.NameLocal -like "İÇT 1*") {
      $vis = ($p.Range.Text -replace "`r","" -replace [char]11," ").Trim()
      if ($vis -match "ölüm|aynak") { Write-Output "  $($vis.Substring(0,[math]::Min(45,$vis.Length)))"; $n++; if ($n -ge 8) { break } }
    }
  }
  $d.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
