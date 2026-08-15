$ErrorActionPreference = "Continue"
$cur = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$tpl = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\_sablon_kaynak.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

function Rapor($doc, $etiket) {
  Write-Output "===== $etiket ====="
  foreach ($sn in @("Başlık 1","Başlık 3","Başlık 5","Gövde Metni","Normal")) {
    try {
      $s = $doc.Styles.Item($sn)
      $pf = $s.ParagraphFormat
      $bb = $pf.Borders.Item(-3)  # wdBorderBottom
      $bv = $false; try { $bv = $bb.Visible } catch {}
      Write-Output ("  [{0}] punto={1} önce={2} sonra={3} satır={4}({5}) altÇizgi={6} çizgiUzaklık={7}" -f `
        $sn, [int]$s.Font.Size, [math]::Round($pf.SpaceBefore,1), [math]::Round($pf.SpaceAfter,1), `
        [math]::Round($pf.LineSpacing,1), $pf.LineSpacingRule, $bv, $pf.Borders.DistanceFromBottom)
    } catch { Write-Output "  [$sn] YOK/okunamadı" }
  }
}

try {
  $d1 = $word.Documents.Open($cur, $false, $true)
  Rapor $d1 "MEVCUT TEZ"
  # Mevcut: BÖLÜM 2 başlık paragrafı yapısı
  Write-Output "  --- Bölüm başlığı örnekleri (stil + metin) ---"
  $n=0
  foreach ($p in $d1.Paragraphs) {
    $t = $p.Range.Text
    if ($t -match "^BÖLÜM \d" -or $t -match "^Bölüm \d") {
      Write-Output ("    stil='{0}' metin='{1}'" -f $p.Style.NameLocal, ($t.Substring(0,[math]::Min(40,$t.Length)) -replace "[`r`n]"," / "))
      $n++; if ($n -ge 3) { break }
    }
  }
  $d1.Close($false)

  $d2 = $word.Documents.Open($tpl, $false, $true)
  Rapor $d2 "ŞABLON"
  Write-Output "  --- Şablon bölüm/başlık örnekleri (ilk 12 Başlık-stilli paragraf) ---"
  $n=0
  foreach ($p in $d2.Paragraphs) {
    $st = $p.Style.NameLocal
    if ($st -like "Başlık*") {
      $t = ($p.Range.Text -replace "[`r`n]"," ").Trim()
      if ($t.Length -gt 45) { $t = $t.Substring(0,45) }
      Write-Output ("    [{0}] '{1}'" -f $st, $t)
      $n++; if ($n -ge 12) { break }
    }
  }
  $d2.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
