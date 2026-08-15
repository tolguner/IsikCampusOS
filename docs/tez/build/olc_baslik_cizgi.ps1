$ErrorActionPreference = "Continue"
$cur = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
$tpl = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build\_sablon_kaynak.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0

function Olc($doc, $etiket) {
  Write-Output "===== $etiket ====="
  foreach ($p in $doc.Paragraphs) {
    $t = ($p.Range.Text -replace "[`r`n]"," ").Trim()
    if ($t -eq "Özet") {
      $pf = $p.ParagraphFormat
      $bb = $pf.Borders.Item(-3)
      $bv = $false; $bls = 0; try { $bls = $bb.LineStyle } catch {}
      try { $bv = ($bb.LineStyle -ne 0) } catch {}
      Write-Output ("  Özet başlık: stil='{0}' sonra={1} altKenarlık?={2} altKenarlıkUzaklık(DistanceFromBottom)={3}" -f $p.Style.NameLocal, [math]::Round($pf.SpaceAfter,1), $bv, $pf.Borders.DistanceFromBottom)
      $nx = $p.Next()
      if ($nx) {
        $nt = ($nx.Range.Text -replace "[`r`n]"," ").Trim(); if ($nt.Length -gt 25) { $nt = $nt.Substring(0,25) }
        Write-Output ("  Sonraki paragraf: stil='{0}' önce={1} metin='{2}'" -f $nx.Style.NameLocal, [math]::Round($nx.ParagraphFormat.SpaceBefore,1), $nt)
      }
      break
    }
  }
}
try {
  $d = $word.Documents.Open($cur, $false, $true); Olc $d "MEVCUT"; $d.Close($false)
  $d2 = $word.Documents.Open($tpl, $false, $true); Olc $d2 "ŞABLON"; $d2.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
