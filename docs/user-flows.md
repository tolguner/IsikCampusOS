# IsikCampusOS User Flows

Bu dokuman, IsikCampusOS icin kodlamaya uygun kullanici senaryolari ve modul workflow'larini tanimlar. Hedef, frontend ekranlari, backend state machine'leri, notification event'leri, moderation kurallari ve analytics metrikleri icin ortak referans olusturmaktir.

## 1. Kapsam ve Tasarim Ilkeleri

- Platform university email verification ile baslar.
- RBAC (role-based access control) tum ekran, API ve operasyon akislarinda zorunludur.
- Her user-generated action bir state degisimi, bir notification ve bir analytics eventi uretecek sekilde tasarlanir.
- Cancellation, dispute, moderation ve no-show durumlari ilk sinif akistir; sonradan eklenmis edge case olarak dusunulmez.
- Her modul kendi domain state'ine sahiptir, fakat ortak kimlik, profil, bildirim, moderation ve analytics katmanlarini kullanir.

## 2. Ana Personas

| Persona | Temel hedef | Tipik rolleri | En kritik moduller |
| --- | --- | --- | --- |
| Ogrenci | Hizli sekilde servis bulmak, katilmak, basvurmak, rezervasyon yapmak | `student` | Facility Booking, Food Hub, Ride, Events, ProjectMatch, MicroJobs |
| Kulup yoneticisi | Etkinlik taslagi yaratmak, RSVP toplamak, katilimi artirmak | `club_admin` | Smart Event Engine |
| SKS yetkilisi | Kulup olusturma, etkinlik onaylama, kulup raporlari | `sks_admin` | Smart Event Engine |
| Tesis yoneticisi | Tesis uygunlugunu, kapasiteyi ve kurallari yonetmek | `facility_admin` | Smart Facility Booking |
| Isletme yoneticisi | Menu, siparis ve teslim operasyonunu duzenlemek | `vendor_admin` | Campus Food Hub |
| Admin | Kimlik, rol, moderation, audit ve genel operasyonu izlemek | `admin`, `moderator` | Tum moduller |

## 3. Ortak Onboarding Flow

### 3.1 Entry Conditions

- Kullanici university email ile gelir.
- Domain whitelist kontrolu calisir.
- Kullanici daha once kayitli ise login akisi, degilse register akisi baslar.

### 3.2 Happy Path

1. Kullanici university email girer.
2. Sistem email domain'ini dogrular.
3. Verification maili gonderilir.
4. Kullanici tek kullanimli kod veya link ile email'ini dogrular.
5. Sistem temel profile ekrana yonlendirir.
6. Kullanici ad, soyad, fakulte veya bolum, ilgi alanlari, beceriler, kampus tercihleri ve notification ayarlarini girer.
7. Kullanici en az bir rol secimi yapar veya default student rolune atanir.
8. Sistem RBAC kaydini olusturur.
9. Sistem onboarding tamamlandigini analytics event'i olarak isaretler.
10. Kullanici ana feed veya role uygun dashboard'a yonlendirilir.

### 3.3 Edge Cases

1. Email domain whitelist disindaysa kayit reddedilir ve destek yonlendirmesi verilir.
2. Verification linki suresini asmissa yeniden gonderim akisi acilir.
3. Kullanici daha once kayitliysa duplicate account olusmaz, login yapilir.
4. Profil eksikse kullanici ana islemlere kismen erisebilir, ama kritik aksiyonlardan once profile completion ister.
5. Rol atamasi admin onayina bagliysa kullanici bekleme durumuna girer.
6. Bildirim izinleri reddedilirse in-app notification default olarak aktif kalir.

### 3.4 Completion Criteria

- Email verified olmalidir.
- En az bir rol atanmalidir.
- Temel profil tamamlanmalidir.
- Notification preference'leri kaydedilmelidir.
- Audit log'ta kayit ve ilk login gorunmelidir.

## 4. Ortak Platform Kurallari

### 4.1 RBAC Rules

- `student`: explore, request, apply, RSVP, reserve, bid, rate.
- `club_admin`: event draft create, event manage, attendance view, event analytics (yayin icin SKS onayi gerekir).
- `sks_admin`: club create/approve, club_admin assign, event approve/reject, club reporting.
- `facility_admin`: facility config, schedule manage, booking override, no-show review.
- `vendor_admin`: menu manage, order status update, pickup slot manage, issue resolve.
- `admin`: user review, role assignment, moderation, trust review, analytics, policy control.

### 4.2 Notification Rules

- Create, approve, reject, confirm, cancel, reschedule, match, assign, deliver, rate, report actions notifications uretir.
- Bildirimlerin en az biri in-app olarak saklanir.
- Kritik islerde email notification da uretilebilir.
- Notification delivery failure, application action'yi engellemez; sadece retry queue'ya gider.

### 4.3 Moderation Rules

- Public content: event description, job post, ride post, project post, vendor menu text.
- Moderation queue triggers: spam, duplicate post, abuse report, prohibited content, suspicious trust pattern.
- Moderation sonucu: approve, reject, hide, escalate, suspend, restore.

### 4.4 Trust and Profile Rules

- Profile completion ve campus email verification trust sinyalidir.
- Ratings, reports, cancellations ve no-show davranislari trust score'u etkileyebilir.
- Trust score, ride ve microjob gibi guven odakli moduller icin match filtering'de kullanilir.

### 4.5 Analytics Rules

- Her modul icin create, view, convert, cancel, complete, report ve rating event'leri tutulur.
- Funnel takibi: impression -> action start -> action confirm -> completion.
- Dashboard KPI'lari rol ve modul bazinda ayrilmali, global toplamla karistirilmamalidir.

## 5. Modul Workflow'lari

## 5.1 Smart Facility Booking

### Ama

- Derslik, etut odasi, toplanti alani veya spor alani gibi kaynaklarin cakismaz sekilde rezerve edilmesini saglamak.

### Ana Aktorler

- `student`
- `facility_admin`
- `admin`

### State Model

Domain states (DB'ye yazilan):

- `draft`
- `pending`
- `confirmed`
- `cancelled`
- `completed`
- `no_show`

UI flow states (ekran bazli):

- available: kaynak uygun gorunumu
- selected: kullanici slot sectigi an
- blocked: bakim veya blackout durumu

### Happy Path

1. Student Facilities ekraninda kaynak filtresi kullanir.
2. Sistem uygun kaynaklari, kapasiteyi ve takvimi listeler.
3. Student tarih, saat, sure ve kisi sayisi secerek slot arar.
4. Sistem conflict check yapar.
5. Uygun slot varsa booking preview gorunur.
6. Student booking'i onaylar.
7. Sistem rezervasyonu confirmed state'ine alir.
8. Notification student'a ve gerekirse facility manager'a gider.
9. Booking zamani gelince check-in ekrani acilir.
10. Student check-in yapar.
11. Sistem booking'i completed state'ine tasir.

### Edge Cases ve Cancellation

1. Slot baska rezervasyonla cakisiyorsa sistem alternatif slotlar sunar.
2. Tesis maintenance veya blackout icindeyse rezervasyon engellenir.
3. Capacity asimi varsa booking reject edilir.
4. Booking window kapanmissa gec rezervasyon engellenir.
5. Student reservation onayindan once vazgecerse booking draft veya selected state'inden cikar.
6. Confirmed rezervasyon iptal edilirse cancellation reason zorunlu olabilir.
7. No-show olursa sistem booking'i no_show state'ine tasir ve trust signal guncellenir.

### Moderation Points

- Tekrarlayan no-show pattern'leri limit veya inceleme tetikleyebilir.
- Sahte grup rezervasyonlari veya policy abuse admin/facility manager incelemesine gider.
- Belirli alanlar icin onay gerektiren kurallar varsa pending_confirm state'i kullanilir.

### Success Metrics

- Booking completion rate
- No-show rate
- Cancellation rate before cutoff
- Average time to reserve
- Utilization rate per facility

### Olaylar

- booking.search_started
- booking.slot_selected
- booking.created
- booking.cancelled
- booking.checked_in
- booking.no_show_marked

## 5.2 Campus Food Hub

### Ama

- Kampus ici vendor'lardan on siparis alinmasini ve pickup yogunlugunun dengelenmesini saglamak.

### Ana Aktorler

- `student`
- `vendor_admin`
- `admin`

### State Model

Domain states (DB'ye yazilan — order_status):

- `draft`
- `placed`
- `accepted`
- `preparing`
- `ready`
- `picked_up`
- `cancelled`
- `refunded`

UI flow states (ekran bazli):

- menu_active: vendor menusu gorunur
- cart_open: sepet acik durumu

### Happy Path

1. Student Food Hub ekraninda vendor listesi gorur.
2. Student vendor secip menu item'larini inceler.
3. Sistem stok ve pickup slot uygunlugunu kontrol eder.
4. Student urunleri sepete ekler.
5. Student pickup zamani secip siparisi onaylar.
6. Sistem order'u placed state'ine alir.
7. Vendor siparisi kabul eder.
8. Vendor siparisi hazirlar ve ready_for_pickup olarak isaretler.
9. Student bildirim alir ve siparisi teslim alir.
10. Siparis picked_up olarak kapanir.

### Edge Cases ve Cancellation

1. Urun stokta yoksa sistem cart'tan cikarir veya alternatif onerir.
2. Pickup slot dolduysa baska slot secimi zorunlu olur.
3. Vendor belirli saatlerde siparis kabul etmiyorsa menu kapali gorunur.
4. Student siparis hazirlanmadan once iptal ederse order cancelled olur.
5. Hazirlama basladiktan sonra iptal yasaklanabilir veya admin policy gerektirebilir.
6. Student pickup gec kalirsa order stale veya expired olabilir.
7. Vendor siparisi reddederse sebep zorunlu tutulur.

### Moderation Points

- Vendor onboarding admin onayina bagli olabilir.
- Menu text'i, fiyat ve urun tanimlari spam veya kurallara aykiri ise moderasyon queue'ya gidebilir.
- Tekrarlayan gec hazirlama, yanlis teslim veya abuse durumlari vendor rating'i etkiler.

### Success Metrics

- Order conversion rate
- Pick-up on time rate
- Cart abandonment rate
- Average preparation time
- Vendor acceptance rate

### Olaylar

- food.vendor_viewed
- food.menu_item_added
- food.order_created
- food.order_accepted
- food.order_ready
- food.order_cancelled
- food.order_picked_up

## 5.3 CampusRide

### Ama

- Kampus ici veya kampus-sehir arasi paylasimli yolculuklar icin guvenli eslesme saglamak.

### Ana Aktorler

- `student`
- `admin`

### State Model

Domain states — ride_offer_status (DB'ye yazilan):

- `draft`
- `open`
- `matched`
- `closed`
- `cancelled`

Domain states — ride_match_status:

- `proposed`
- `accepted`
- `rejected`
- `cancelled`
- `completed`

UI flow states (ekran bazli):

- confirmed: her iki taraf kabul etti
- in_progress: yolculuk devam ediyor
- reported: abuse/safety report acildi

### Happy Path

1. Student ride offer veya ride request olusturur.
2. Sistem rota, tarih, saat, kontenjan ve trust signal bilgilerini toplar.
3. Sistem uyum skorunu hesaplar.
4. Ride ilani open state'ine gelir.
5. Baska bir kullanici ilani gorur ve match baslatir.
6. Iki taraf da confirm eder.
7. Sistem ride'i confirmed state'ine tasir.
8. Yolculuk baslar.
9. Yolculuk tamamlaninca completed state'i yazilir.
10. Taraflar birbirini puanlar.

### Edge Cases ve Cancellation

1. Rota veya saat degisirse ilan yeniden publish veya update edilir.
2. Kontenjan dolarsa yeni match kabul edilmez.
3. Trust score esik altindaysa eslesme engellenir veya risk warning verilir.
4. Taraflardan biri confirmation zaman asiminda kalirsa match expire olur.
5. Driver veya passenger iptal ederse karsi tarafa aninda notification gider.
6. No-show veya gec kalma olursa durum no-show benzeri incident olarak kaydedilir.

### Moderation Points

- Supheli route pattern'leri, spam ilanlar veya scam davranislar moderation queue'ya dusurulur.
- Abuse report, safety report veya repeated cancellation admin incelemesi tetikler.
- Puanlama anomalileri trust score recalculation icin kullanilir.

### Success Metrics

- Match rate
- Confirmation rate
- Ride completion rate
- Cancellation rate
- Average rating
- Report rate

### Olaylar

- ride.post_created
- ride.post_published
- ride.match_created
- ride.confirmed
- ride.started
- ride.completed
- ride.cancelled
- ride.reported

## 5.4 Smart Event Engine

### Ama

- Kulup etkinliklerinin yaratimi, kesfi, RSVP toplama, check-in ve etkisinin olculmesini saglamak.

### Ana Aktorler

- `club_admin`
- `sks_admin`
- `student`
- `admin`

### State Model

Domain states — event_status (DB'ye yazilan):

- `draft`
- `pending_sks_approval`
- `rejected`
- `published`
- `full`
- `completed`
- `cancelled`

UI flow states (ekran bazli):

- rsvp_open: RSVP kabul ediliyor
- archived: etkinlik arsivlendi

### Happy Path

1. `club_admin` event draft olusturur.
2. Baslik, aciklama, tarih, saat, konum, kapasite ve hedef kitle girilir.
3. `club_admin` etkinligi SKS onayina gonderir.
4. Sistem event'i `pending_sks_approval` state'ine alir.
5. `sks_admin` etkinligi inceler.
6. `sks_admin` onaylarsa event `published` olur.
7. `sks_admin` reddederse event `rejected` olur ve sebep notu eklenir.
8. Student feed'de onaylanmis event'i gorur.
9. Student RSVP yapar.
10. Sistem kapasiteyi gunceller ve gerekirse waitlist kullanir.
11. Etkinlik gunu check-in olur.
12. Event completed olur ve feedback toplanir.

### Edge Cases ve Cancellation

1. Kapasite dolarsa RSVP waitlist'e gider.
2. Event tarihi degisirse tum RSVP kullanicilarina update notification gider.
3. Event iptal edilirse RSVP sahipleri otomatik bilgilendirilir.
4. Check-in penceresi kapaniyorsa gec gelenler no-show olarak isaretlenebilir.
5. `club_admin` draft'tan vazgecerse event archived olur.
6. Katilim formu veya ek detaylar eksikse SKS onayina gonderim engellenebilir.
7. Reddedilen etkinlik duzenlenerek yeniden onaya gonderilebilir.

### Moderation Points

- Hassas, spam veya kurallara aykiri event aciklamalari `sks_admin` tarafindan reddedilir.
- Kulup yetkisi olmayan kullanicilar event draft olusturamaz.
- Tekrarlanan iptal veya sahte etkinlik pattern'leri `sks_admin` ve admin tarafinda incelenir.

### Success Metrics

- RSVP count
- RSVP to attendance conversion rate
- No-show rate
- Event completion rate
- Feedback submission rate

### Olaylar

- event.draft_created
- event.review_requested
- event.published
- event.rsvp_created
- event.waitlisted
- event.checked_in
- event.cancelled
- event.feedback_submitted

## 5.5 ProjectMatch

### Ama

- Ogrencileri skill, ilgi ve musaitlik bazinda proje ekipleri ile eslestirmek.

### Ana Aktorler

- `student`
- `admin`

### State Model

Domain states — project_status (DB'ye yazilan):

- `draft`
- `open`
- `in_review`
- `closed`
- `archived`

Domain states — invite_status (DB'ye yazilan):

- `pending`
- `accepted`
- `declined`
- `expired`
- `revoked`

UI flow states (ekran bazli):

- profile_incomplete: beceri profili eksik
- team_formed: takim kuruldu
- searching: aday araniyor

### Happy Path

1. Student skill profile olusturur.
2. Sistem profil tamamlanmasini kontrol eder.
3. Baska bir kullanici proje postu acar.
4. Proje, skill tag ve zaman uyumu ile indekslenir.
5. Student proje feed'inde uygun ilanlari gorur.
6. Student ilana basvurur veya davet alir.
7. Taraflar uyumu degerlendirir.
8. Invite kabul edilirse team_formed olur.
9. Proje ilerledikce post kapatilir.

### Edge Cases ve Cancellation

1. Skill profile eksikse arama sinirli calisir.
2. Proje basvurusu suresini asmissa invite expired olur.
3. Kapasite dolarsa yeni aday kabul edilmez.
4. Davet geri cekilirse sistem decline benzeri state kaydeder.
5. Student ekipten ayrilmak isterse team exit flow'u calisir ve kalan uyeler bilgilendirilir.

### Moderation Points

- Sahte proje ilanlari veya spam recruit post'lar moderation queue'ya gider.
- Kullanicilarin skill beyanlari abuse sinyalleri ile kontrol edilebilir.
- Takip edilen uyum skorunda anomali varsa admin review acilabilir.

### Success Metrics

- Profile completion rate
- Project view to invite rate
- Invite acceptance rate
- Time to team formation
- Team retention rate

### Olaylar

- project.profile_completed
- project.post_created
- project.post_published
- project.invite_sent
- project.invite_accepted
- project.invite_declined
- project.team_formed
- project.closed

## 5.6 Campus MicroJob Marketplace

### Ama

- Kampus ici kucuk islerin teklif, anlasma, teslim ve degerlendirme ile guvenli bicimde yonetilmesini saglamak.

### Ana Aktorler

- `student`
- `admin`

### State Model

Domain states — job_status (DB'ye yazilan):

- `draft`
- `open`
- `in_review`
- `awarded`
- `in_progress`
- `completed`
- `cancelled`
- `expired`

Domain states — contract_status:

- `pending`
- `active`
- `paused`
- `completed`
- `cancelled`
- `disputed`

UI flow states (ekran bazli):

- proposal_received: teklif geldi bildirimi
- submitted: is teslim edildi onay bekleniyor

### Happy Path

1. Student microjob ilani olusturur.
2. Scope, teslim tarihi, gereksinimler ve odul bilgileri girilir.
3. Sistem ilani open state'ine alir.
4. Diger kullanicilar teklif gonderir.
5. Job sahibi teklifler arasindan secim yapar.
6. Taraflar anlasir ve accepted state'i olusur.
7. Is baslar.
8. Is teslim edilir.
9. Job sahibi teslimi onaylar.
10. Sistem completed state'ine tasir.
11. Iki taraf da rating verir.

### Edge Cases ve Cancellation

1. Teklif sure asimina ugrarsa proposal kapanir.
2. Scope degisirse yeni teklif veya revision gerekir.
3. Gorev sahibi iptal ederse teklif sahipleri bilgilendirilir.
4. Worker gec teslim ederse late flag tutulur.
5. Teslim kalite kriterlerini karsilamazsa disputed state acilir.
6. Taraflardan biri gorevi birakmak isterse cancellation reason kaydedilir.

### Moderation Points

- Prohibited work, scam, off-platform payment baskisi ve abusive ilanlar moderation queue'ya gider.
- Sik sik iptal eden veya dispute yaratan kullanicilar trust review alir.
- Teslim onayi olmadan completed state'e gecis sadece admin override ile olabilir.

### Success Metrics

- Job fill rate
- Proposal to acceptance rate
- Completion rate
- Dispute rate
- Average time to hire
- Rating distribution

### Olaylar

- job.post_created
- job.post_published
- job.proposal_received
- job.accepted
- job.submitted
- job.completed
- job.cancelled
- job.disputed

## 6. Role-Based Operational Flows

## 6.1 Student Flow

1. Email verification ve profile completion tamamlanir.
2. Ana feed'de duyurular, uygun moduller ve pending notifications gorulur.
3. Student ihtiyacina gore modulu secerek arama, rezervasyon, RSVP, teklif veya basvuru yapar.
4. Student kendi aktif islerini My Activity ekraninda takip eder.
5. Cancellation, change request veya issue report varsa ilgili aksiyon ekranindan baslatir.
6. Student rating ve feedback vererek trust system'e katki saglar.
7. Student dashboard'u en az sunlari gosterir: active bookings, upcoming events, orders, rides, project invites, job proposals.

## 6.2 Club Admin Flow

1. `club_admin` rol dogrulanir (`sks_admin` tarafindan atanir).
2. Event draft acilir ve hedef kitle belirlenir.
3. `club_admin` etkinligi SKS onayina gonderir.
4. `sks_admin` onayi beklenir; onaylanirsa event published olur, reddedilirse duzenleme yapilabilir.
5. RSVP sayisi, waitlist, no-show ve check-in oranlari izlenir.
6. Gerekirse event update, cancel veya reschedule yapilir (buyuk degisikliklerde yeniden SKS onayi gerekebilir).
7. Event sonrasinda feedback ve analytics raporu incelenir.
8. `club_admin` paneli, upcoming events, approval status, attendance, engagement ve reports gosterir.

## 6.3 SKS Admin Flow

1. `sks_admin` SKS paneline erisir.
2. Yeni kulup olusturma taleplerini inceler; onaylar veya reddeder.
3. Onaylanan kuluplere `club_admin` rolu atar.
4. Etkinlik onay kuyrugundan bekleyen etkinlikleri inceler.
5. Etkinlikleri onaylar veya sebep belirterek reddeder.
6. Kulup bazli aktivite raporlarini izler: etkinlik sayisi, katilim oranlari, iptal oranlari.
7. Gerekirse kulubu askiya alir veya `club_admin` rolunu geri alir.
8. `sks_admin` paneli, pending approvals, active clubs, club performance ve event calendar gosterir.

## 6.4 Facility Admin Flow

1. `facility_admin` ilgili kaynaklara erisim kazanir.
2. Facility listesi, schedule ve policy ayarlari yapilir.
3. Blackout date, capacity limit, check-in policy ve approval rule tanimlanir.
4. Booking talepleri ve conflicts gorulur.
5. Gerekirse ozel rezervasyonlari onaylar veya reddeder.
6. No-show, cancellation ve misuse raporlarini inceler.
7. Facility analytics ile utilization, peak hours ve rejected request sayilari takip edilir.
8. `facility_admin` paneli, kaynak sagligi ve rezervasyon dagilimi gosterir.

## 6.5 Vendor Admin Flow

1. `vendor_admin` admin onayindan gecerek sisteme alinir.
2. Menu, fiyat, stok ve pickup slot'lari tanimlanir.
3. Siparisler accepted -> preparing -> ready sekilde islenir.
4. Stok tukenince menu item gecici olarak passive yapilir.
5. Gec hazirlama, iptal veya teslim problemi varsa ilgili order issue isaretlenir.
6. `vendor_admin` puanlari, order SLA ve cancelled order sayilari izlenir.
7. `vendor_admin` paneli, aktif menu, pending orders, ready orders, slot availability ve rating'leri gosterir.

## 6.6 Admin Flow

1. Admin tum rollerin dogrulama ve yetkilerini izler.
2. Moderation queue'daki event, job, menu, ride ve profile item'larini inceler.
3. Abuse, spam, trust anomaly ve duplicate account sorunlarini cozer.
4. Gerekirse user block, role revoke, content hide veya restore aksiyonlari alir.
5. Analytics dashboard ile modul bazli adoption, cancellation, no-show ve report trendlerini takip eder.
6. Audit log ve security events'i kontrol eder.
7. Policy update ve feature toggle gibi operasyonel kararlar alinirsa ilgili modullere yayilir.

## 7. Shared Acceptance Criteria

- Her action tanimli bir status transition ile sonuclanmalidir.
- Her kritik action notification event'i uretmelidir.
- Her modul kendi analytics metric'lerini kaydetmelidir.
- Yetkisiz rol aksiyonlari 403 veya role-specific denial ile reddedilmelidir.
- Cancellation ve dispute akislari UI'da gizlenmemeli, gorunur ve test edilebilir olmalidir.
- Moderation kararlari audit log ile izlenebilir olmali.

## 8. Basari Metrikleri

### Platform Seviyesi

- Weekly active users
- Profile completion rate
- Verified campus email rate
- Notification open rate
- Moderation resolution time
- Cross-module adoption rate

### Modul Seviyesi

- Facility: booking completion, utilization, no-show rate
- Food: order conversion, pickup timeliness, vendor acceptance
- Ride: match rate, completion rate, report rate
- Event: RSVP to attendance, feedback rate, cancellation rate
- ProjectMatch: invite acceptance, team formation time
- MicroJobs: completion rate, dispute rate, time to hire

## 9. Urun ve Teknik Notlar

- UI tarafinda her modul icin state badge'leri standart olmali: draft, pending, active, full, cancelled, completed, disputed.
- Backend tarafinda state transition'lar tek bir domain service uzerinden gecmeli.
- Notification, moderation ve analytics event'leri domain event olarak ayrilmali.
- Dashboard'lar rol bazli olusturulmali; her kullanici tum modulleri gormemelidir.
- Bu dokumandaki akislardan API contract, database state machine ve acceptance test senaryolari turetilebilir.
