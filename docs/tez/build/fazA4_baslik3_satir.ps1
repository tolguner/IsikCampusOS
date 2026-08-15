$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($path, $false, $false)
  $b3 = $d.Styles.Item("Başlık 3").ParagraphFormat
  $b3.LineSpacingRule = 4; $b3.LineSpacing = 24
  $d.Save(); $d.Close($true)
  $d = $word.Documents.Open($path, $false, $true)
  Write-Output "Sayfa: $($d.ComputeStatistics(2)) | Kelime: $($d.ComputeStatistics(0))"
  Write-Output "Başlık 3 satır: $($d.Styles.Item('Başlık 3').ParagraphFormat.LineSpacing) | Gövde sonra: $($d.Styles.Item('Gövde Metni').ParagraphFormat.SpaceAfter)"
  $d.Close($false)
  Write-Output "TAMAM."
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
