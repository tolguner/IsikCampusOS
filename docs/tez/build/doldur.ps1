# Şablonu Word COM (Range.InsertAfter tabanlı) ile doldurur. Kapak/stil/footer/TOC korunur.
$ErrorActionPreference = "Stop"
$base  = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez"
$build = "$base\build"
$tpl   = "$build\_sablon_kaynak.docx"
$out   = "$build\IsikCampusOS_Tez_v2.docx"
$J = Get-Content "$build\icerik.json" -Raw -Encoding UTF8 | ConvertFrom-Json

# temiz başla
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }
Start-Sleep -Milliseconds 400
Remove-Item $out -Force -EA SilentlyContinue
Copy-Item $tpl $out -Force

$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
$d = $w.Documents.Open($out)

$H1="Başlık 1;h1"; $H3="Başlık 3;h3"; $H5="Başlık 5;h5"; $BODY="Gövde Metni"; $CAP="Resim Yazısı"; $NORMAL="Normal"
function Sty($n){ try{ $d.Styles.Item($n) }catch{ $d.Styles.Item("Normal") } }

function FindReplace($find,$rep){
  $f=$d.Content.Find; $f.ClearFormatting(); $f.Replacement.ClearFormatting(); $f.MatchWildcards=$false
  [void]$f.Execute($find,$false,$false,$false,$false,$false,$true,1,$false,$rep,2)
}
function FindHeadingPara($style,$contains){
  foreach($p in $d.Paragraphs){
    if($p.Style.NameLocal -eq $style){
      $t=($p.Range.Text -replace "[\r\n\x07]"," ").Trim()
      if($t -like "*$contains*"){ return $p }
    }
  }
  return $null
}
# başlıktan sonraki içerik paragraflarını (stop stillerine kadar) sil
function ClearAfter($headPara,$stopStyles){
  $startPos = [int]$headPara.Range.End
  $cur = $headPara.Next()
  $endPos = $startPos
  while($cur -ne $null){
    if($stopStyles -contains $cur.Style.NameLocal){ break }
    $endPos = [int]$cur.Range.End
    $cur = $cur.Next()
  }
  if($endPos -gt $startPos){ [void]$d.Range($startPos,$endPos).Delete() }
}
# bir başlık paragrafının HEMEN ardına, sırayla blok ekle (Range tabanlı, Selection YOK)
# blocks: @{ t=metin; s=stilAdı } dizisi
function InsertBlocksAfterHeading($headPara,$blocks){
  $anchorEnd = [int]$headPara.Range.End
  # sondan başa ekle ki her blok başlığın hemen ardına gelsin -> sıra korunur
  for($k=$blocks.Count-1; $k -ge 0; $k--){
    $b=$blocks[$k]
    $rng=$d.Range($anchorEnd,$anchorEnd)
    [void]$rng.InsertAfter(($b.t)+"`r")
    $rng.Style = Sty $b.s
  }
}

# ---------------- 1) KAPAK ----------------
try { foreach($cc in $d.ContentControls){ if($cc.Tag -eq "Title" -or $cc.Title -eq "Title"){ $cc.LockContents=$false; $cc.Range.Text=$J.baslik } } } catch {}
FindReplace "[TEZ BAŞLIĞI]" $J.baslik
FindReplace "[Tez altyazısı]" $J.altbaslik
FindReplace "[Tez Altyazısı]" $J.altbaslik
FindReplace "Tam Adınız" $J.ad
FindReplace "Danışman: Prof. Dr. Adı Soyadı" ("Danışman: "+$J.danisman)
FindReplace "Ad Soyad" $J.ad
FindReplace "Öğrenci Kimliği" $J.ogrNo
FindReplace "[Ay YIL]" $J.tarih
FindReplace "İsim Soy isim" $J.ad
FindReplace "Akademik yaşamım boyunca beni destekleyen aileme." $J.adanan
FindReplace "[Bu sayfayı  tamamen silebilirsiniz, ya da içeriğini kendi bilgilerinize göre düzenleyerek saklayabilirsiniz." ""
Write-Output "1) Kapak tamam"

# ---------------- 2) ÖZET / ABSTRACT ----------------
$hp = FindHeadingPara $H3 "Özet"; if(-not $hp){ throw "Özet yok" }
ClearAfter $hp @($H3)
$blocks=@()
foreach($p in $J.ozetTR){ $blocks += @{ t=$p; s=$NORMAL } }
$blocks += @{ t=$J.ozetKW; s=$NORMAL }
$blocks += @{ t="Abstract"; s=$H5 }
foreach($p in $J.abstractEN){ $blocks += @{ t=$p; s=$NORMAL } }
$blocks += @{ t=$J.abstractKW; s=$NORMAL }
InsertBlocksAfterHeading $hp $blocks
Write-Output "2) Özet + Abstract tamam"

# ---------------- 3) TEŞEKKÜR ----------------
$hp = FindHeadingPara $H3 "Teşekkür"; if(-not $hp){ throw "Teşekkür yok" }
ClearAfter $hp @($H3)
$blocks=@(); foreach($p in $J.tesekkur){ $blocks += @{ t=$p; s=$NORMAL } }
InsertBlocksAfterHeading $hp $blocks
Write-Output "3) Teşekkür tamam"

# ---------------- 4) KISALTMALAR ----------------
$hp = FindHeadingPara $H3 "Kısaltmalar"; if(-not $hp){ throw "Kısaltmalar yok" }
ClearAfter $hp @($H1,$H3)
$blocks=@(); foreach($row in $J.kisalt){ $blocks += @{ t=($row[0]+": "+$row[1]); s=$NORMAL } }
InsertBlocksAfterHeading $hp $blocks
Write-Output "4) Kısaltmalar tamam"

$d.Save()
Write-Output "ARA KAYIT: ön kısımlar tamam (gövde sonraki adımda)."
$d.Close($false)
$w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "OK"
