$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
# Yedek
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $path "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\yedekler\IsikCampusOS_Tez_bicim_$ts.docx" -Force

$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)
  # Başlık 3 stilini 1.5 satıra çevir (wdLineSpace1pt5 = 1)
  $b3s = $d.Styles.Item("Başlık 3")
  $b3s.ParagraphFormat.LineSpacingRule = 1
  $b3s.ParagraphFormat.LineSpacing = 18
  Write-Output ("Başlık 3 stili: kural={0} satır={1}" -f $b3s.ParagraphFormat.LineSpacingRule, $b3s.ParagraphFormat.LineSpacing)
  $d.Repaginate()
  $d.Save(); $d.Close($true)

  # Doğrulama: Özet başlığının efektif satır aralığı
  $d = $word.Documents.Open($path, $false, $true)
  foreach ($p in $d.Paragraphs) {
    if (($p.Range.Text -replace "[`r`n]","").Trim() -eq "Özet" -and $p.Style.NameLocal -like "Başlık 3*") {
      Write-Output ("Özet başlık: satırKuralı={0} (1=1.5satır olmalı) satır={1}" -f $p.ParagraphFormat.LineSpacingRule, $p.ParagraphFormat.LineSpacing)
      break
    }
  }
  Write-Output "Sayfa: $($d.ComputeStatistics(2))"
  $d.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
