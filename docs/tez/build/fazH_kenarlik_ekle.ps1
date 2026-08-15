$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
# Kilit testi
try { $fs=[System.IO.File]::Open($path,'Open','ReadWrite','None'); $fs.Close() } catch { Write-Output "DOSYA KILITLI — Word'de acik, lutfen kapat."; exit 2 }
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $path "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\yedekler\IsikCampusOS_Tez_cizgi_$ts.docx" -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($path, 'Update')
$entry = $zip.GetEntry('word/document.xml')
$sr = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
$xml = $sr.ReadToEnd(); $sr.Dispose()

function Metin($pv) { (([regex]::Matches($pv, '<w:t[^>]*>(.*?)</w:t>') | ForEach-Object { $_.Groups[1].Value }) -join '') }
function Stil($pv) { ([regex]::Match($pv,'<w:pStyle w:val="([^"]+)"')).Groups[1].Value }

$paras = [regex]::Matches($xml, '<w:p[ >].*?</w:p>')
# 3.6.1 Balk5 pPr (kaynak)
$srcPPr = $null
foreach ($pm in $paras) { $pv=$pm.Value; if ((Stil $pv) -eq "Balk5" -and (Metin $pv).StartsWith("3.6.1.")) { $srcPPr = ([regex]::Match($pv,'<w:pPr>.*?</w:pPr>')).Value; break } }
if (-not $srcPPr -or ($srcPPr -notmatch "pBdr")) { Write-Output "Kaynak pPr/kenarlik bulunamadi"; $zip.Dispose(); exit 1 }

$count = 0
foreach ($pref in @("3.6.5.","3.6.6.")) {
  foreach ($pm in $paras) {
    $pv = $pm.Value
    if ((Stil $pv) -eq "Balk5" -and (Metin $pv).StartsWith($pref)) {
      $oldPPr = ([regex]::Match($pv,'<w:pPr>.*?</w:pPr>')).Value
      $newPara = $pv.Replace($oldPPr, $srcPPr)
      $xml = $xml.Replace($pv, $newPara)
      $count++; break
    }
  }
}

# Geri yaz (UTF-8 BOM'suz)
$stream = $entry.Open(); $stream.SetLength(0)
$enc = New-Object System.Text.UTF8Encoding($false)
$sw = New-Object System.IO.StreamWriter($stream, $enc)
$sw.Write($xml); $sw.Flush(); $sw.Dispose()
$zip.Dispose()
Write-Output "Kenarlik kopyalanan baslik: $count / 2"

# DOGRULAMA
$zip2 = [System.IO.Compression.ZipFile]::OpenRead($path)
$e2 = $zip2.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$r2 = New-Object System.IO.StreamReader($e2.Open()); $x2 = $r2.ReadToEnd(); $r2.Close(); $zip2.Dispose()
$p2 = [regex]::Matches($x2, '<w:p[ >].*?</w:p>')
foreach ($pref in @("3.6.5.","3.6.6.")) {
  foreach ($pm in $p2) { $pv=$pm.Value; if ((Stil $pv) -eq "Balk5" -and (Metin $pv).StartsWith($pref)) { Write-Output ("$pref pBdr var?= " + [bool]([regex]::Match($pv,'<w:pBdr>').Value)); break } }
}