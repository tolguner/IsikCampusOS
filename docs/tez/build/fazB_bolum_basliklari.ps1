$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$V = [char]11  # manuel satır sonu (vertical tab)

$fr = @(
  @{ f = ("BÖLÜM 1:" + $V + "GİRİŞ");                          r = ("Bölüm 1  " + $V + "Giriş") }
  @{ f = ("BÖLÜM 2:" + $V + "LİTERATÜR TARAMASI");            r = ("Bölüm 2  " + $V + "Literatür Taraması") }
  @{ f = ("BÖLÜM 3:" + $V + "METODOLOJİ VE SİSTEM TASARIMI"); r = ("Bölüm 3  " + $V + "Metodoloji ve Sistem Tasarımı") }
  @{ f = ("BÖLÜM 4:" + $V + "GELİŞTİRME");                    r = ("Bölüm 4  " + $V + "Geliştirme") }
  @{ f = ("BÖLÜM 5:" + $V + "DEĞERLENDİRME VE SONUÇLAR");     r = ("Bölüm 5  " + $V + "Değerlendirme ve Sonuçlar") }
  @{ f = ("BÖLÜM 6:" + $V + "SONUÇ VE GELECEK YÖNELİMLERİ");  r = ("Bölüm 6  " + $V + "Sonuç ve Gelecek Yönelimleri") }
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)
  $ok = 0; $miss = @()
  foreach ($e in $fr) {
    $rng = $d.Content; $f = $rng.Find
    $f.ClearFormatting(); $f.Replacement.ClearFormatting()
    $f.Forward = $true; $f.Wrap = 1; $f.MatchWildcards = $false
    $res = $f.Execute($e.f, $false, $false, $false, $false, $false, $true, 1, $false, $e.r, 2)
    if ($res) { $ok++ } else { $miss += $e.r }
  }
  # KAYNAKÇA başlığı (Başlık 1) -> Kaynakça
  foreach ($p in $d.Paragraphs) {
    if (($p.Style.NameLocal -like "Başlık 1*") -and ($p.Range.Text.Trim() -eq "KAYNAKÇA")) {
      $rr = $p.Range.Duplicate; if (($rr.End-$rr.Start) -gt 1) { $rr.End = $rr.End - 1 }
      $rr.Text = "Kaynakça"; $ok++; break
    }
  }
  Write-Output "Değiştirilen başlık: $ok"
  if ($miss.Count -gt 0) { Write-Output "BULUNAMADI:"; $miss | ForEach-Object { Write-Output "  - $_" } }

  foreach ($toc in $d.TablesOfContents) { $toc.Update() }
  $d.Repaginate()
  $d.Save(); $d.Close($true)

  # Doğrulama
  $d = $word.Documents.Open($path, $false, $true)
  Write-Output "--- DOĞRULAMA: gövde Başlık 1 ---"
  $n=0
  foreach ($p in $d.Paragraphs) {
    if ($p.Style.NameLocal -like "Başlık 1*") {
      $vis = ($p.Range.Text -replace "`r","" -replace [char]11," | ").Trim()
      if ($vis.Length -gt 0) { Write-Output "  $vis"; $n++; if ($n -ge 8) { break } }
    }
  }
  $d.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
