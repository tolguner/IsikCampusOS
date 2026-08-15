$ErrorActionPreference = "Stop"
$cur = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$tpl = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\_sablon_kaynak.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  # Şablon Gövde Metni ayarlarını oku
  $dt = $word.Documents.Open($tpl, $false, $true)
  $tg = $dt.Styles.Item("Gövde Metni").ParagraphFormat
  $tAfter = $tg.SpaceAfter; $tBefore = $tg.SpaceBefore; $tLS = $tg.LineSpacing; $tRule = $tg.LineSpacingRule
  Write-Output "ŞABLON Gövde Metni: önce=$tBefore sonra=$tAfter satır=$tLS rule=$tRule"
  $dt.Close($false)

  # Mevcut belgeye uygula
  $d = $word.Documents.Open($cur, $false, $false)
  $cg = $d.Styles.Item("Gövde Metni").ParagraphFormat
  Write-Output "ÖNCE (mevcut stil): önce=$($cg.SpaceBefore) sonra=$($cg.SpaceAfter) satır=$($cg.LineSpacing) rule=$($cg.LineSpacingRule)"
  $cg.SpaceAfter = $tAfter
  $cg.SpaceBefore = $tBefore
  $cg.LineSpacingRule = $tRule
  $cg.LineSpacing = $tLS
  Write-Output "SONRA (mevcut stil): sonra=$($cg.SpaceAfter) rule=$($cg.LineSpacingRule) satır=$($cg.LineSpacing)"

  # Doğrudan-biçim geçersiz kılma kontrolü: birkaç gövde paragrafının efektif sonra-boşluğu
  $ornek = 0; $direct0 = 0
  foreach ($p in $d.Paragraphs) {
    if ($p.Style.NameLocal -like "Gövde*") {
      $ornek++
      if ([math]::Round($p.Format.SpaceAfter,1) -ne [math]::Round($tAfter,1)) { $direct0++ }
      if ($ornek -ge 60) { break }
    }
  }
  Write-Output "Örnek gövde paragrafı: $ornek | stil ile uyuşmayan (doğrudan-biçim) : $direct0"

  $d.Save(); $d.Close($true)
  Write-Output "KAYDEDİLDİ."
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
