# GÖVDE: demo bölümleri sil, JSON gövdeyi şablon stilleriyle yaz, diyagramları göm.
# Caption'lar: ÜSTTE, 'Resim Yazısı' stili, gerçek SEQ alanı (Şekil/Tablo listeleri otomatik dolar).
# Yöntem: Selection + EndKey(wdStory) -> her paragraf belge sonuna, stil kaymadan.
$ErrorActionPreference="Stop"
$build="C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\build"
$src="$build\IsikCampusOS_Tez_v2.docx"
$J = Get-Content "$build\icerik.json" -Raw -Encoding UTF8 | ConvertFrom-Json
Get-Process WINWORD -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | ForEach-Object { try{$_.Kill()}catch{} }; Start-Sleep -Milliseconds 400

$w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
$d=$w.Documents.Open($src)
$sel=$w.Selection
$wdStory=6; $wdFieldEmpty=-1; $wdAlignCenter=1; $wdAlignJustify=3; $wdAlignLeft=0
$H1="Başlık 1;h1"; $H3="Başlık 3;h3"; $H5="Başlık 5;h5"; $BODY="Gövde Metni"; $CAP="Resim Yazısı"; $NORMAL="Normal"
function Sty($n){ try{ $d.Styles.Item($n) }catch{ $d.Styles.Item("Normal") } }
function GoEnd(){ [void]$sel.EndKey($wdStory) }

# --- demo gövdeyi sil: ilk Başlık 1'den belge sonuna (son ¶ hariç) ---
$firstH1=$null
foreach($p in $d.Paragraphs){ if($p.Style.NameLocal -eq $H1){ $firstH1=$p; break } }
if(-not $firstH1){ throw "İlk Başlık 1 yok" }
$delStart=[int]$firstH1.Range.Start
$docEnd=[int]$d.Content.End
[void]$d.Range($delStart,[Math]::Max($delStart,$docEnd-1)).Delete()
Write-Output "Demo gövde silindi."

function StyleFor($blk){
  switch($blk.k){
    "h" { if($blk.lv -eq 1){return $H1} elseif($blk.lv -eq 3){return $H3} else {return $H5} }
    "p" { return $BODY }; "li" { return $NORMAL }; "np" { return $NORMAL }
    "note" { return $NORMAL }; "eq" { return $NORMAL }; default { return $BODY }
  }
}
function EmitText($text,$styleName,$align){
  GoEnd
  $sel.Style = Sty $styleName
  if($align -ne $null){ $sel.ParagraphFormat.Alignment=$align }
  $sel.TypeText([string]$text)
  $sel.TypeParagraph()
}
function EmitCaption($label,$title){
  GoEnd
  $sel.Style = Sty $CAP
  $sel.ParagraphFormat.Alignment=$wdAlignCenter
  $sel.TypeText("$label ")
  [void]$d.Fields.Add($sel.Range,$wdFieldEmpty,"SEQ $label \* ARABIC",$false)
  GoEnd
  $sel.TypeText(". $title")
  $sel.TypeParagraph()
}

$figN=0
foreach($blk in $J.govde){
  switch($blk.k){
    "fig" {
      # caption ÜSTTE
      EmitCaption "Şekil" $blk.title
      # resim (ortalı) veya yer tutucu
      GoEnd; $sel.Style=Sty $NORMAL; $sel.ParagraphFormat.Alignment=$wdAlignCenter
      if($blk.img -and (Test-Path $blk.img)){
        $shape=$d.InlineShapes.AddPicture($blk.img,$false,$true,$sel.Range)
        $maxW=415.0
        if($shape.Width -gt $maxW){ $r=$shape.Height/$shape.Width; $shape.Width=$maxW; $shape.Height=[math]::Round($maxW*$r) }
        GoEnd; $sel.TypeParagraph()
      } else {
        $sel.TypeText("[ Ekran görüntüsü buraya eklenecek — "+$blk.title+" ]"); $sel.TypeParagraph()
      }
      $figN++
    }
    "tbl" {
      if($blk.cap){ EmitCaption "Tablo" $blk.cap.title }
      $rows=$blk.rows.Count; $cols=$blk.rows[0].Count
      GoEnd
      $tbl=$d.Tables.Add($sel.Range,$rows,$cols)
      try { $tbl.Style="Tablo Kılavuzu" } catch {}
      $tbl.Borders.Enable=$true
      for($ri=0;$ri -lt $rows;$ri++){
        for($ci=0;$ci -lt $cols;$ci++){
          $cell=$tbl.Cell($ri+1,$ci+1); $cell.Range.Style=Sty $NORMAL
          $cell.Range.Text=[string]$blk.rows[$ri][$ci]
          if($ri -eq 0){ $cell.Range.Bold=$true }
        }
      }
      GoEnd; $sel.TypeParagraph()
    }
    "h"  { EmitText $blk.t (StyleFor $blk) $null }
    "eq" { EmitText $blk.t $NORMAL $wdAlignCenter }
    "li" { EmitText ("• "+$blk.t) $NORMAL $wdAlignJustify }
    "np" { EmitText $blk.t $NORMAL $wdAlignJustify }
    "note" { EmitText $blk.t $NORMAL $wdAlignJustify }
    default { EmitText $blk.t $BODY $wdAlignJustify }
  }
}
Write-Output ("Gövde eklendi. Şekil: "+$figN)

$d.Fields.Update() | Out-Null
foreach($toc in $d.TablesOfContents){ $toc.Update() }
$d.Repaginate()
$final="$build\IsikCampusOS_Tez_SABLON.docx"
$d.SaveAs([ref]$final)
$d.Close($false); $w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sel)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($d)|Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w)|Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Output "GÖVDE TAMAM -> $final"
