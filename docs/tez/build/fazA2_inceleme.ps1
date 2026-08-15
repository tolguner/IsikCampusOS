$ErrorActionPreference = "Continue"
$cur = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$tpl = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\_sablon_kaynak.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0

function Incele($doc, $etiket) {
  Write-Output "===== $etiket ====="
  $i = 0
  foreach ($p in $doc.Paragraphs) {
    $t = ($p.Range.Text -replace "[`r`n]"," ").Trim()
    if ($t -eq "Şekil Listesi" -or $t -eq "Tablo Listesi") {
      $pf = $p.ParagraphFormat
      Write-Output ("  BAŞLIK '{0}' stil='{1}' hiza={2} solGirinti={3} ilkSatır={4}" -f $t,$p.Style.NameLocal,$pf.Alignment,$pf.LeftIndent,$pf.FirstLineIndent)
      # sonraki 2 giriş
      $nx = $p.Next()
      for ($k=0;$k -lt 2 -and $nx;$k++) {
        $nt = ($nx.Range.Text -replace "[`r`n]"," ").Trim()
        if ($nt.Length -gt 30) { $nt = $nt.Substring(0,30) }
        $npf = $nx.ParagraphFormat
        Write-Output ("    giriş stil='{0}' hiza={1} solGirinti={2} ilkSatır={3} metin='{4}'" -f $nx.Style.NameLocal,$npf.Alignment,$npf.LeftIndent,$npf.FirstLineIndent,$nt)
        $nx = $nx.Next()
      }
    }
  }
}

try {
  $d = $word.Documents.Open($cur, $false, $true)
  Incele $d "MEVCUT TEZ"
  # Kapak: tarih + bölüm 1 sayfa no
  Write-Output "  --- KAPAK / SAYFA NO ---"
  $sec1 = $d.Sections.Item(1)
  Write-Output ("  Bölüm say: $($d.Sections.Count) | S1 farklıİlkSayfa=$($sec1.PageSetup.DifferentFirstPageHeaderFooter)")
  $ft = $sec1.Footers.Item(1)  # birincil altbilgi
  Write-Output ("  S1 altbilgi metni: '" + (($ft.Range.Text -replace "[`r`n]"," ").Trim()) + "'  | sayfaNoTür=" + $sec1.Footers.Item(1).PageNumbers.NumberStyle)
  $j=0
  foreach ($p in $d.Paragraphs) { if ($p.Range.Text -match "Haziran 2026|HAZİRAN") { Write-Output ("  Tarih paragrafı: '" + (($p.Range.Text -replace "[`r`n]"," ").Trim()) + "'"); $j++; if($j -ge 2){break} } }
  $d.Close($false)

  $d2 = $word.Documents.Open($tpl, $false, $true)
  Incele $d2 "ŞABLON"
  $d2.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
