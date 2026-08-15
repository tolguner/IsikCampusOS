$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$reader = New-Object System.IO.StreamReader($entry.Open()); $xml = $reader.ReadToEnd(); $reader.Close(); $zip.Dispose()
$paras = [regex]::Matches($xml, '<w:p[ >].*?</w:p>')
foreach ($pref in @("3.6.1.","3.6.4.","3.6.5.","3.6.6.")) {
  foreach ($pm in $paras) {
    $pv = $pm.Value
    $txt = (([regex]::Matches($pv, '<w:t[^>]*>(.*?)</w:t>') | ForEach-Object { $_.Groups[1].Value }) -join '')
    if ($txt.StartsWith($pref)) {
      $st = ([regex]::Match($pv,'<w:pStyle w:val="([^"]+)"')).Groups[1].Value
      $bot = ([regex]::Match($pv,'<w:bottom[^>]*/?>')).Value
      $hasBdr = [bool]([regex]::Match($pv,'<w:pBdr>').Value)
      $kisa = if ($txt.Length -gt 30) { $txt.Substring(0,30) } else { $txt }
      Write-Output ("{0} | stil={1} | pBdr={2} | bottom={3}" -f $kisa, $st, $hasBdr, $bot)
    }
  }
}