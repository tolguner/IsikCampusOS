$ErrorActionPreference = "Stop"
$path = "C:\Users\tolga\Desktop\IsikCampusOS\docs\tez\IsikCampusOS_Tez.docx"
Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

function Clean($t) { return ($t -replace "[`r`n`a`007]", "").Trim() }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$log = @()
try {
  $doc = $word.Documents.Open($path, $false, $false)

  # Tabloları bul
  $svc = $null; $db = $null; $req = $null
  foreach ($t in $doc.Tables) {
    $txt = $t.Range.Text
    if ($t.Columns.Count -eq 4 -and $txt -match "projectmatch-service") { $svc = $t }
    elseif ($t.Columns.Count -eq 2 -and $txt -match "projectmatch-service") { $db = $t }
    elseif ($txt -match "In-app bildirim") { $req = $t }
  }
  $log += "svc=$([bool]$svc) db=$([bool]$db) req=$([bool]$req)"

  function RowByCell([object]$tbl, [int]$col, [string]$val) {
    for ($r = 1; $r -le $tbl.Rows.Count; $r++) {
      if ((Clean $tbl.Cell($r, $col).Range.Text) -eq $val) { return $r }
    }
    return -1
  }
  function RowContains([object]$tbl, [int]$col, [string]$sub) {
    for ($r = 1; $r -le $tbl.Rows.Count; $r++) {
      if ((Clean $tbl.Cell($r, $col).Range.Text).Contains($sub)) { return $r }
    }
    return -1
  }
  function SetCell([object]$tbl, [int]$r, [int]$c, [string]$v) { $tbl.Cell($r, $c).Range.Text = $v }

  # ===== SERVİS KATALOĞU (4 sütun) =====
  if ($svc) {
    foreach ($name in @("microjob-service", "projectmatch-service")) {
      $r = RowByCell $svc 2 $name
      if ($r -gt 0) { $svc.Rows.Item($r).Delete(); $log += "svc sil: $name" }
    }
    $r = RowByCell $svc 2 "event-service"
    if ($r -gt 0) { SetCell $svc $r 2 "club-service"; SetCell $svc $r 4 "Kulüp, etkinlik, RSVP, sertifika, duyuru fan-out"; $log += "svc event->club" }
    $r = RowByCell $svc 2 "food-service"
    if ($r -gt 0) { SetCell $svc $r 4 "Satıcı, menü, kampanya, sipariş ve işletme yönetimi" }
    $r = RowByCell $svc 2 "ride-service"
    if ($r -gt 0) { SetCell $svc $r 4 "Paylaşımlı yolculuk ilanı, eşleştirme, doğrulama, puanlama" }
    # notification: facility'den önce ekle
    $r = RowByCell $svc 2 "facility-service"
    if ($r -gt 0) {
      $nr = $svc.Rows.Add($svc.Rows.Item($r))
      SetCell $svc $r 1 "Domain"; SetCell $svc $r 2 "notification-service"; SetCell $svc $r 3 "8083"; SetCell $svc $r 4 "Platform geneli in-app bildirim, SSE akışı, duyuru"
      $log += "svc +notification"
    }
    # message: sona ekle
    $nr = $svc.Rows.Add()
    $last = $svc.Rows.Count
    SetCell $svc $last 1 "Domain"; SetCell $svc $last 2 "message-service"; SetCell $svc $last 3 "8090"; SetCell $svc $last 4 "Bağlam temelli konuşma, mesajlaşma, SSE akışı"
    $log += "svc +message"
  }

  # ===== DB TABLOSU (2 sütun) =====
  if ($db) {
    foreach ($name in @("microjob-service", "projectmatch-service")) {
      $r = RowByCell $db 1 $name
      if ($r -gt 0) { $db.Rows.Item($r).Delete(); $log += "db sil: $name" }
    }
    $r = RowByCell $db 1 "event-service"
    if ($r -gt 0) { SetCell $db $r 1 "club-service"; SetCell $db $r 2 "clubdb"; $log += "db event->club" }
    $r = RowByCell $db 1 "facility-service"
    if ($r -gt 0) {
      $nr = $db.Rows.Add($db.Rows.Item($r))
      SetCell $db $r 1 "notification-service"; SetCell $db $r 2 "notificationdb"
      $log += "db +notification"
    }
    $nr = $db.Rows.Add()
    $last = $db.Rows.Count
    SetCell $db $last 1 "message-service"; SetCell $db $last 2 "messagedb"
    $log += "db +message"
  }

  # ===== GEREKSİNİM MATRİSİ (2 sütun) =====
  if ($req) {
    $r = RowContains $req 1 "Yemek sipariş ve durum takibi"
    if ($r -gt 0) { SetCell $req $r 1 "Yemek sipariş, durum takibi ve işletme yönetimi (menü, kampanya, ciro)" }
    $r = RowContains $req 1 "Planlı paylaşımlı yolculuk"
    if ($r -gt 0) { SetCell $req $r 1 "Planlı paylaşımlı yolculuk (hibrit konum, ilan arama, doğrulama, çift yönlü puan)" }
    $r = RowContains $req 1 "Etiket tabanlı proje eşleştirme"
    if ($r -gt 0) { SetCell $req $r 2 "Tasarlandı (gerçekleştirim gelecek çalışma)"; $log += "req PM tasarlandi" }
    $r = RowContains $req 1 "İki taraflı mikro iş"
    if ($r -gt 0) { SetCell $req $r 2 "Tasarlandı (gerçekleştirim gelecek çalışma)"; $log += "req MJ tasarlandi" }
    $r = RowContains $req 1 "In-app bildirim"
    if ($r -gt 0) { SetCell $req $r 1 "Gerçek zamanlı in-app bildirim (SSE) ve okundu takibi" }
    # mesajlaşma satırı sona
    $nr = $req.Rows.Add()
    $last = $req.Rows.Count
    SetCell $req $last 1 "Bağlam temelli platform içi mesajlaşma"; SetCell $req $last 2 "Karşılandı"
    $log += "req +mesajlasma"
  }

  $doc.Save()
  $doc.Close($true)
  $log | ForEach-Object { Write-Output $_ }
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
}
