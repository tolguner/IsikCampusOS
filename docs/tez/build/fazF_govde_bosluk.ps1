$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
# Kilit testi (kullanıcı Word'de açık tutuyorsa dur)
try { $fs=[System.IO.File]::Open($path,'Open','ReadWrite','None'); $fs.Close() } catch { Write-Output "DOSYA KİLİTLİ — lütfen Word'de kapat ve tekrar dene."; exit 2 }
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $path "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\yedekler\IsikCampusOS_Tez_bicim2_$ts.docx" -Force

$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)
  $gm = $d.Styles.Item("Gövde Metni").ParagraphFormat
  $gm.SpaceAfter = 10            # şablon: 200 twip = 10pt
  $gm.LineSpacingRule = 1        # 1.5 satır (line=360 auto)
  Write-Output ("Gövde Metni: sonra={0} satırKuralı={1}" -f $gm.SpaceAfter, $gm.LineSpacingRule)
  $d.Repaginate()
  $d.Save(); $d.Close($true)

  $d = $word.Documents.Open($path, $false, $true)
  $g2 = $d.Styles.Item("Gövde Metni").ParagraphFormat
  Write-Output ("Doğrulama: sonra={0} satır={1}" -f $g2.SpaceAfter, $g2.LineSpacing)
  Write-Output "Sayfa: $($d.ComputeStatistics(2))"
  $d.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
