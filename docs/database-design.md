# IsikCampusOS Veritabani Tasarimi

## 1. Amac ve Kapsam

Bu dokuman, IsikCampusOS icin coding-ready bir PostgreSQL veri modeli tanimlar. Hedef; modul bazli genisleyebilen, auth/profile/notification/moderation/analytics katmanlari ile alti is modulu arasinda net sinirlari olan, audit ve soft-delete destekli bir veri yapisi kurmaktir.

## 2. Veritabani Stratejisi

- Veritabani olarak PostgreSQL kullanilir.
- **Her microservice kendi bagimsiz PostgreSQL instance'ini kullanir** (per-service database pattern).
- Servisler birbirinin veritabanina dogrudan erisemez; veri paylasimi yalnizca API veya Kafka event'leri araciligiyla gerceklesir.
- Docker Compose ortaminda her servis icin ayri bir PostgreSQL container'i tanimi bulunur.
- Cok kullanilan ortak kimlikler `uuid` tipinde saklanir; bigint surrogate key kullanilmaz.
- Ogrenci, isletme, kulup ve admin akislari icin soft-delete varsayilan yaklasimdir.
- Kritik durum degisiklikleri icin immutable history tablolari veya audit log kullanilir.
- Esnek ama kontrollu genisleme icin `jsonb` sadece yardimci metadata alanlarinda kullanilir; ana is kurallari JSONB icine tasinmaz.
- Her servis kendi Flyway veya Liquibase migration'larini bagimsiz yonetir.

## 3. Servis Veritabanlari

Her microservice kendi veritabanina sahiptir. Asagidaki tablo hem veritabani adini hem de icerdigi tablo gruplarini gosterir.

| Servis | Veritabani | Kapsam |
| --- | --- | --- |
| auth-service | `auth_db` | users, roles, user_roles, email_verification_tokens, refresh_tokens, login_attempts |
| profile-service | `profile_db` | profiles, profile_skills, profile_interests, profile_links, profile_connections, trust_scores |
| notification-service | `notification_db` | notification_templates, notification_preferences, notifications, notification_deliveries |
| moderation-service | `moderation_db` | reports, moderation_cases, moderation_actions, user_sanctions |
| analytics-service | `analytics_db` | analytics_events, daily_module_metrics, entity_activity_snapshots |
| facility-service | `facility_db` | facilities, facility_resources, facility_policies, facility_availability_rules, facility_bookings, booking_checkins; ayrica: campuses, media_assets, tags, entity_tags, outbox_events, audit_log |
| food-service | `food_db` | vendors, vendor_members, menu_items, pickup_slots, food_orders, food_order_items, food_order_status_history |
| ride-service | `ride_db` | ride_offers, ride_requests, ride_matches, ride_participants, ride_ratings |
| event-service | `event_db` | clubs, club_memberships, events, event_rsvps, event_checkins, event_feedbacks |
| projectmatch-service | `projectmatch_db` | skill_profiles, project_posts, project_requirements, project_invitations, project_teams, project_team_members, compatibility_scores |
| microjob-service | `microjob_db` | job_posts, job_proposals, job_contracts, job_deliveries, job_ratings |

> **Not**: `campuses`, `media_assets`, `tags`, `outbox_events` ve `audit_log` gibi ortak referans tablolari her serviste kendi veritabaninda bagimsiz kopyalar olarak tutulabilir; ya da bu veriler API araciligiyla ilgili servis tarafindan saglanir (ornegin facility-service kampus bilgisini auth/profile-service'den okuyabilir).

## 4. Standart Kolonlar ve Tipler

Tum mutable tablolar icin ortak kolon seti:

- `id uuid primary key`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `created_by uuid null`
- `updated_by uuid null`
- `deleted_at timestamptz null`
- `deleted_by uuid null`
- `version int not null default 0`
- `status varchar(...) not null`

Ek kurallar:

- `created_at` ve `updated_at` UTC tutulur.
- `version` optimistic locking icin kullanilir.
- `deleted_at is null` satirlari aktif kayit kabul edilir.
- `status` sadece is durumu olan entity'lerde zorunludur.
- Lookup/enum tablolarinda soft-delete yerine sabit referans mantigi tercih edilir.

## 5. Naming Conventions

- Schema, tablo ve kolon isimleri lowercase snake_case olur.
- Tablo adlari cogul kullanilir: `users`, `facility_bookings`, `job_proposals`.
- Foreign key kolonlari `<referans>_id` seklinde adlandirilir.
- Tarih kolonlari `_at`, sayisal zaman araliklari `_minutes` / `_days` ile biter.
- Boolean kolonlar `is_` ile baslar: `is_active`, `is_required`, `is_public`.
- Enum isimleri `*_status`, `*_type`, `*_role`, `*_channel` formatindadir.
- JPA entity siniflari singular tutulabilir; tablo adlari ile birebir ayni olmak zorunda degildir.

## 6. Core Schema

### 6.1 `core.campuses`

Kampus ve gelecekteki multi-campus genisleme icin referans tablo.

- `id`, `code`, `name`, `timezone`, `is_active`, `metadata`
- `code` unique olmalidir.

### 6.2 `core.media_assets`

Profil resmi, etkinlik goruntusu, menuler, teslim kanitlari ve ek dosyalar icin ortak medya kaydi.

- `id`, `owner_user_id`, `storage_key`, `file_name`, `mime_type`, `file_size_bytes`, `checksum`, `usage_scope`, `metadata`
- `owner_user_id` `auth.users.id` ile iliskilenir.

### 6.3 `core.tags`

Arama, etiketleme ve segmentasyon icin ortak tag tablosu.

- `id`, `tag_type`, `name`, `slug`, `is_active`
- `slug` unique olmalidir.

### 6.4 `core.entity_tags`

Polimorfik etiket baglantisi.

- `id`, `entity_type`, `entity_id`, `tag_id`, `created_at`
- `entity_type` ornekleri: `event`, `project_post`, `job_post`, `profile`.

### 6.5 `core.outbox_events`

Domain event ve asenkron entegrasyon icin outbox kalibi.

- `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload_json`, `status`, `available_at`, `processed_at`, `retry_count`
- `status` degerleri: `pending`, `processing`, `published`, `failed`.

### 6.6 `core.audit_log`

Kritik islem ve denetim izi.

- `id`, `actor_user_id`, `action_type`, `entity_type`, `entity_id`, `before_json`, `after_json`, `ip_address`, `user_agent`, `created_at`
- Append-only tutulur; soft-delete uygulanmaz.

## 7. Auth Schema

### 7.1 `auth.users`

Platform kimlik kaydi.

- `id`, `university_email`, `email_verified_at`, `password_hash`, `full_name`, `student_number`, `phone_number`, `status`, `last_login_at`
- `university_email` unique olmalidir.
- `status` degerleri: `pending_verification`, `active`, `suspended`, `deleted`.

### 7.2 `auth.roles`

Sistem rolleri.

- `id`, `code`, `name`, `description`, `is_system`
- `code` unique olmalidir.
- Ornek roller: `student`, `club_admin`, `sks_admin`, `vendor_admin`, `facility_admin`, `moderator`, `admin`.

### 7.3 `auth.user_roles`

Kullanici-rol iliskisi.

- `id`, `user_id`, `role_id`, `assigned_by`, `assigned_at`, `status`
- `user_id + role_id` unique olmalidir.
- `status` degerleri: `active`, `revoked`.

### 7.4 `auth.email_verification_tokens`

Universite e-posta dogrulama akisi.

- `id`, `user_id`, `email`, `token_hash`, `expires_at`, `verified_at`, `attempt_count`, `status`
- `status` degerleri: `issued`, `used`, `expired`, `revoked`.

### 7.5 `auth.refresh_tokens`

JWT refresh veya session yenileme icin.

- `id`, `user_id`, `token_hash`, `issued_at`, `expires_at`, `revoked_at`, `device_name`, `ip_address`, `status`
- Ayni cihaz icin coklu token desteklenebilir.

### 7.6 `auth.login_attempts`

Giris deneme ve guvenlik kaydi.

- `id`, `user_id`, `university_email`, `attempted_at`, `success`, `failure_reason`, `ip_address`, `user_agent`
- Rate limiting ve abuse analizinde kullanilir.

## 8. Profile Schema

### 8.1 `profile.profiles`

Kullaniciya ait ana profil.

- `id`, `user_id`, `display_name`, `bio`, `avatar_asset_id`, `faculty`, `department`, `graduation_year`, `campus_id`, `profile_completeness`, `trust_score`, `status`
- `user_id` unique olmalidir.
- `avatar_asset_id` `core.media_assets.id` ile baglanir.

### 8.2 `profile.profile_skills`

Kullanici yetenekleri.

- `id`, `profile_id`, `skill_name`, `skill_level`, `years_of_experience`, `is_verified`, `source`, `status`
- `profile_id + skill_name` unique olmalidir.
- `skill_level` degerleri: `beginner`, `intermediate`, `advanced`, `expert`.

### 8.3 `profile.profile_interests`

Ilgi alanlari ve kesif sinyalleri.

- `id`, `profile_id`, `interest_name`, `weight`, `status`
- `profile_id + interest_name` unique olmalidir.

### 8.4 `profile.profile_links`

Kullaniciya ait dis baglantilar.

- `id`, `profile_id`, `link_type`, `url`, `label`, `is_public`, `status`
- `link_type` ornekleri: `linkedin`, `github`, `instagram`, `portfolio`.

### 8.5 `profile.profile_connections`

Opsiyonel sosyal baglantilar ve takip modeli.

- `id`, `follower_user_id`, `followed_user_id`, `status`, `created_at`
- `follower_user_id + followed_user_id` unique olmalidir.

### 8.6 `profile.trust_scores`

Guven puani snapshot kaydi.

- `id`, `user_id`, `score_value`, `score_type`, `calculated_at`, `source_count`, `reason_json`, `status`
- `score_type` ornekleri: `ride`, `microjob`, `global`.

## 9. Notification Schema

### 9.1 `notification.notification_templates`

Sablon bazli bildirim metinleri.

- `id`, `template_key`, `channel`, `subject_template`, `body_template`, `locale`, `is_active`
- `template_key` unique olmalidir.

### 9.2 `notification.notification_preferences`

Kullanici kanal tercihleri.

- `id`, `user_id`, `notification_key`, `channel`, `is_enabled`, `quiet_hours_json`, `status`
- `user_id + notification_key + channel` unique olmalidir.

### 9.3 `notification.notifications`

Kullaniciya giden bildirim kaydi.

- `id`, `recipient_user_id`, `notification_key`, `channel`, `title`, `body`, `entity_type`, `entity_id`, `priority`, `status`, `sent_at`, `read_at`
- `status` degerleri: `queued`, `sent`, `delivered`, `read`, `failed`, `cancelled`.

### 9.4 `notification.notification_deliveries`

Kanal bazli teslimat detayi.

- `id`, `notification_id`, `channel`, `provider_message_id`, `delivered_at`, `failed_at`, `failure_reason`, `retry_count`, `status`
- Bir bildirim birden fazla kanal ile teslim edilebilir.

## 10. Moderation Schema

### 10.1 `moderation.reports`

Kullanici, ilan veya icerik raporlari.

- `id`, `reporter_user_id`, `target_entity_type`, `target_entity_id`, `reason_code`, `details`, `priority`, `status`
- `status` degerleri: `open`, `triaged`, `in_review`, `resolved`, `dismissed`.

### 10.2 `moderation.moderation_cases`

Raporlardan veya otomatik kurallardan uretilen vaka.

- `id`, `case_number`, `source_report_id`, `assigned_to_user_id`, `case_type`, `severity`, `status`, `opened_at`, `closed_at`
- `case_number` unique olmalidir.
- `status` degerleri: `open`, `investigating`, `actioned`, `closed`.

### 10.3 `moderation.moderation_actions`

Denetim adimlari.

- `id`, `case_id`, `actor_user_id`, `action_type`, `notes`, `created_at`
- `action_type` ornekleri: `warn`, `hide_content`, `remove_content`, `suspend_user`, `dismiss`.

### 10.4 `moderation.user_sanctions`

Kullanici yaptirimlari.

- `id`, `user_id`, `case_id`, `sanction_type`, `reason`, `starts_at`, `ends_at`, `status`
- `sanction_type` ornekleri: `warning`, `temporary_suspension`, `permanent_ban`.

## 11. Analytics Schema

### 11.1 `analytics.analytics_events`

Ham olay akisi ve KPI girdi katmani.

- `id`, `event_name`, `module_name`, `actor_user_id`, `entity_type`, `entity_id`, `occurred_at`, `payload_json`, `numeric_value`
- Partition aylik bazda dusunulebilir.

### 11.2 `analytics.daily_module_metrics`

Gunluk toplu metrikler.

- `id`, `metric_date`, `module_name`, `metric_key`, `metric_value`, `dimensions_json`, `created_at`
- `module_name` ornekleri: `facility`, `food`, `ride`, `event`, `projectmatch`, `microjob`.

### 11.3 `analytics.entity_activity_snapshots`

Yonetim panosu icin periyodik ozetler.

- `id`, `entity_type`, `entity_id`, `snapshot_date`, `activity_score`, `related_count`, `payload_json`

## 12. Facility Schema

### 12.1 `facility.facilities`

Kampus icindeki bookable fiziksel kaynak.

- `id`, `campus_id`, `name`, `facility_type`, `description`, `location_text`, `capacity`, `status`
- `facility_type` degerleri: `meeting_room`, `study_room`, `sports_area`, `lab`, `other`.

### 12.2 `facility.facility_resources`

Rezervasyon yapilabilen alt kaynak veya birim.

- `id`, `facility_id`, `resource_code`, `name`, `resource_type`, `capacity`, `is_bookable`, `status`
- `facility_id + resource_code` unique olmalidir.

### 12.3 `facility.facility_policies`

Rezervasyon kurallari.

- `id`, `facility_id`, `booking_window_days`, `min_notice_minutes`, `cancellation_deadline_minutes`, `checkin_required`, `auto_no_show_minutes`, `max_booking_duration_minutes`, `status`
- One-to-one veya one-to-many model uygulanabilir.

### 12.4 `facility.facility_availability_rules`

Haftalik uygunluk kurallari.

- `id`, `resource_id`, `day_of_week`, `start_time`, `end_time`, `valid_from`, `valid_to`, `status`
- `day_of_week` 1-7 arasi tutulabilir.

### 12.5 `facility.facility_bookings`

Ana rezervasyon kaydi.

- `id`, `resource_id`, `booked_by_user_id`, `start_at`, `end_at`, `purpose`, `participant_count`, `status`, `cancelled_at`, `cancel_reason`, `no_show_at`
- `status` degerleri: `draft`, `pending`, `confirmed`, `cancelled`, `completed`, `no_show`.
- PostgreSQL `EXCLUDE` constraint ile `resource_id` ve zaman araligi cakismasi engellenmelidir.

### 12.6 `facility.booking_checkins`

Rezervasyon check-in kaydi.

- `id`, `booking_id`, `user_id`, `checked_in_at`, `method`, `proof_asset_id`, `status`
- `booking_id` unique olmalidir.

## 13. Food Schema

### 13.1 `food.vendors`

Kampus yeme-iCme isletmeleri.

- `id`, `campus_id`, `name`, `description`, `contact_user_id`, `status`, `is_active`
- `status` degerleri: `pending`, `active`, `paused`, `suspended`.

### 13.2 `food.vendor_members`

Isletme personeli ve yetkileri.

- `id`, `vendor_id`, `user_id`, `member_role`, `status`, `assigned_at`
- `vendor_id + user_id` unique olmalidir.
- `member_role` degerleri: `owner`, `manager`, `staff`.

### 13.3 `food.menu_items`

Menu urunleri.

- `id`, `vendor_id`, `name`, `description`, `price`, `currency`, `image_asset_id`, `is_available`, `status`
- `status` degerleri: `active`, `inactive`, `out_of_stock`.

### 13.4 `food.pickup_slots`

Teslim alma zaman araliklari.

- `id`, `vendor_id`, `slot_date`, `start_at`, `end_at`, `capacity`, `order_limit`, `status`
- `status` degerleri: `open`, `full`, `closed`, `cancelled`.

### 13.5 `food.food_orders`

Ana siparis kaydi.

- `id`, `customer_user_id`, `vendor_id`, `pickup_slot_id`, `pickup_code`, `subtotal_amount`, `delivery_fee_amount`, `total_amount`, `currency`, `special_instructions`, `status`, `ordered_at`, `paid_at`, `cancelled_at`
- `status` degerleri: `draft`, `placed`, `accepted`, `preparing`, `ready`, `picked_up`, `cancelled`, `refunded`.

### 13.6 `food.food_order_items`

Siparis satirlari.

- `id`, `food_order_id`, `menu_item_id`, `quantity`, `unit_price`, `line_total`, `notes`
- `food_order_id + menu_item_id` unique olmalidir.

### 13.7 `food.food_order_status_history`

Siparis durum degisiklik gecrisi.

- `id`, `food_order_id`, `from_status`, `to_status`, `changed_by_user_id`, `changed_at`, `reason`

## 14. Ride Schema

### 14.1 `ride.ride_offers`

Surucu ilanlari.

- `id`, `driver_user_id`, `origin_text`, `destination_text`, `departure_at`, `seats_available`, `route_notes`, `status`
- `status` degerleri: `draft`, `open`, `matched`, `closed`, `cancelled`.

### 14.2 `ride.ride_requests`

Yolcu talepleri.

- `id`, `passenger_user_id`, `origin_text`, `destination_text`, `desired_departure_start`, `desired_departure_end`, `seat_count`, `status`, `created_at`
- `status` degerleri: `open`, `matched`, `expired`, `cancelled`.

### 14.3 `ride.ride_matches`

Eslesme kaydi.

- `id`, `ride_offer_id`, `ride_request_id`, `match_score`, `status`, `matched_at`, `accepted_at`, `cancelled_at`
- `ride_offer_id + ride_request_id` unique olmalidir.
- `status` degerleri: `proposed`, `accepted`, `rejected`, `cancelled`, `completed`.

### 14.4 `ride.ride_participants`

Eslesen yolculuktaki katilimcilar.

- `id`, `ride_match_id`, `user_id`, `participant_role`, `pickup_point`, `dropoff_point`, `status`
- `ride_match_id + user_id` unique olmalidir.
- `participant_role` degerleri: `driver`, `passenger`.

### 14.5 `ride.ride_ratings`

Yolculuk sonrasi puanlama.

- `id`, `ride_match_id`, `rater_user_id`, `rated_user_id`, `score`, `comment`, `created_at`, `status`
- `score` ornegi 1-5 arasi tutulabilir.

## 15. Event Schema

### 15.1 `event.clubs`

Kulup veya topluluk kaydi.

- `id`, `campus_id`, `created_by_user_id`, `approved_by_user_id`, `name`, `description`, `logo_asset_id`, `status`
- `status` degerleri: `pending_approval`, `active`, `paused`, `suspended`, `archived`.

### 15.2 `event.club_memberships`

Kulup uyelikleri ve admin rolleri.

- `id`, `club_id`, `user_id`, `membership_role`, `status`, `joined_at`
- `club_id + user_id` unique olmalidir.
- `membership_role` degerleri: `member`, `admin`.
- KURAL: `membership_role = 'admin'` olan kayitlar icin ayni `club_id` ile yalnizca 1 kisi olabilir (partial unique index on club_id).
- KURAL: Bir `user_id` ayni anda yalnizca 1 kulupten `admin` rolu alabilir (partial unique index on user_id).

### 15.3 `event.events`

Ana etkinlik kaydi.

- `id`, `club_id`, `created_by_user_id`, `approved_by_user_id`, `approved_at`, `rejection_reason`, `title`, `description`, `venue_text`, `starts_at`, `ends_at`, `capacity`, `visibility`, `status`
- `status` degerleri: `draft`, `pending_sks_approval`, `rejected`, `published`, `full`, `completed`, `cancelled`.

### 15.4 `event.event_rsvps`

Katilim niyeti ve rezervasyon.

- `id`, `event_id`, `user_id`, `rsvp_status`, `registered_at`, `cancelled_at`, `source`
- `event_id + user_id` unique olmalidir.
- `rsvp_status` degerleri: `going`, `maybe`, `not_going`, `waitlisted`.

### 15.5 `event.event_checkins`

Etkinlik katilim dogrulamasi.

- `id`, `event_id`, `user_id`, `checked_in_at`, `method`, `proof_asset_id`, `status`
- `event_id + user_id` unique olmalidir.

### 15.6 `event.event_feedbacks`

Etkinlik sonu geri bildirim.

- `id`, `event_id`, `user_id`, `rating`, `comment`, `submitted_at`, `status`
- `event_id + user_id` unique olmalidir.

## 16. ProjectMatch Schema

### 16.1 `projectmatch.skill_profiles`

Eslesme motoru icin genisletilmis yetenek profili.

- `id`, `user_id`, `headline`, `availability_text`, `preferred_roles`, `visibility`, `updated_at`, `status`
- `user_id` unique olmalidir.
- Bu tablo profile tarafindaki skill kayitlarinin matching odakli ozetidir.

### 16.2 `projectmatch.project_posts`

Proje ilanlari.

- `id`, `owner_user_id`, `club_id`, `title`, `description`, `required_team_size`, `deadline_at`, `visibility`, `status`
- `status` degerleri: `draft`, `open`, `in_review`, `closed`, `archived`.

### 16.3 `projectmatch.project_requirements`

Proje icin gerekli yetenek ve kriterler.

- `id`, `project_post_id`, `skill_name`, `min_level`, `weight`, `is_nice_to_have`, `status`
- `project_post_id + skill_name` unique olmalidir.

### 16.4 `projectmatch.project_invitations`

Takim davet akisi.

- `id`, `project_post_id`, `invited_user_id`, `inviter_user_id`, `message`, `status`, `sent_at`, `responded_at`
- `status` degerleri: `pending`, `accepted`, `declined`, `expired`, `revoked`.

### 16.5 `projectmatch.project_teams`

Proje takim kaydi.

- `id`, `project_post_id`, `name`, `status`, `created_at`
- `status` degerleri: `forming`, `active`, `completed`, `disbanded`.

### 16.6 `projectmatch.project_team_members`

Takim uyeleri.

- `id`, `team_id`, `user_id`, `member_role`, `joined_at`, `status`
- `team_id + user_id` unique olmalidir.

### 16.7 `projectmatch.compatibility_scores`

Uyum puani snapshot'i.

- `id`, `project_post_id`, `candidate_user_id`, `score_value`, `factors_json`, `calculated_at`, `status`
- `project_post_id + candidate_user_id` unique olmalidir.

## 17. MicroJob Schema

### 17.1 `microjob.job_posts`

Mikro is ilanlari.

- `id`, `owner_user_id`, `title`, `description`, `budget_type`, `budget_min`, `budget_max`, `currency`, `deadline_at`, `visibility`, `status`
- `status` degerleri: `draft`, `open`, `in_review`, `awarded`, `in_progress`, `completed`, `cancelled`, `expired`.

### 17.2 `microjob.job_proposals`

Teklifler.

- `id`, `job_post_id`, `applicant_user_id`, `cover_letter`, `proposed_amount`, `estimated_days`, `status`, `submitted_at`
- `job_post_id + applicant_user_id` unique olmalidir.
- `status` degerleri: `submitted`, `shortlisted`, `rejected`, `withdrawn`, `accepted`.

### 17.3 `microjob.job_contracts`

Anlasma ve teslimat cati kaydi.

- `id`, `job_post_id`, `proposal_id`, `client_user_id`, `contractor_user_id`, `agreed_amount`, `starts_at`, `due_at`, `terms_json`, `status`
- `status` degerleri: `pending`, `active`, `paused`, `completed`, `cancelled`, `disputed`.

### 17.4 `microjob.job_deliveries`

Teslim veya milestone kaydi.

- `id`, `contract_id`, `delivery_number`, `delivery_type`, `payload_asset_id`, `notes`, `submitted_at`, `reviewed_at`, `status`
- `delivery_type` ornekleri: `file`, `link`, `text`, `milestone`.

### 17.5 `microjob.job_ratings`

Is sonu puanlama.

- `id`, `contract_id`, `rater_user_id`, `rated_user_id`, `score`, `comment`, `created_at`, `status`
- `contract_id + rater_user_id` unique olmalidir.

## 18. Iliskiler ve Kardinaliteler

- `auth.users` 1-1 `profile.profiles`
- `auth.users` N-N `auth.roles` via `auth.user_roles`
- `auth.users` 1-N `auth.refresh_tokens`, `auth.login_attempts`, `notification.notifications`, `moderation.reports`
- `profile.profiles` 1-N `profile.profile_skills`, `profile.profile_interests`, `profile.profile_links`
- `profile.profiles` 1-N `profile.trust_scores`; en guncel puan `profiles.trust_score` icinde cache'lenebilir
- `facility.facilities` 1-N `facility.facility_resources`
- `facility.facility_resources` 1-N `facility.facility_availability_rules`, `facility.facility_bookings`
- `facility.facility_bookings` 1-1 `facility.booking_checkins`
- `food.vendors` 1-N `food.vendor_members`, `food.menu_items`, `food.pickup_slots`, `food.food_orders`
- `food.food_orders` 1-N `food.food_order_items`, 1-N `food.food_order_status_history`
- `ride.ride_offers` 1-N `ride.ride_matches`
- `ride.ride_requests` 1-N `ride.ride_matches`
- `ride.ride_matches` 1-N `ride.ride_participants`, 1-N `ride.ride_ratings`
- `event.clubs` 1-N `event.club_memberships`, `event.events`
- `event.events` 1-N `event.event_rsvps`, `event.event_checkins`, `event.event_feedbacks`
- `projectmatch.project_posts` 1-N `projectmatch.project_requirements`, `projectmatch.project_invitations`, `projectmatch.project_teams`, `projectmatch.compatibility_scores`
- `projectmatch.project_teams` 1-N `projectmatch.project_team_members`
- `microjob.job_posts` 1-N `microjob.job_proposals`, `microjob.job_contracts`
- `microjob.job_contracts` 1-N `microjob.job_deliveries`, `microjob.job_ratings`

## 19. Enum ve Status Tanimlari

### Ortak enum'lar

- `entity_status`: `draft`, `pending`, `active`, `paused`, `closed`, `cancelled`, `archived`, `deleted`
- `visibility`: `private`, `campus`, `public`
- `notification_channel`: `in_app`, `email`, `push`
- `report_status`: `open`, `triaged`, `in_review`, `resolved`, `dismissed`
- `sanction_type`: `warning`, `temporary_suspension`, `permanent_ban`

### Auth

- `user_status`: `pending_verification`, `active`, `suspended`, `deleted`
- `verification_status`: `issued`, `used`, `expired`, `revoked`

### Facility

- `booking_status`: `draft`, `pending`, `confirmed`, `cancelled`, `completed`, `no_show`
- `checkin_status`: `pending`, `checked_in`, `failed`

### Food

- `vendor_status`: `pending`, `active`, `paused`, `suspended`
- `pickup_slot_status`: `open`, `full`, `closed`, `cancelled`
- `order_status`: `draft`, `placed`, `accepted`, `preparing`, `ready`, `picked_up`, `cancelled`, `refunded`

### Ride

- `ride_offer_status`: `draft`, `open`, `matched`, `closed`, `cancelled`
- `ride_request_status`: `open`, `matched`, `expired`, `cancelled`
- `ride_match_status`: `proposed`, `accepted`, `rejected`, `cancelled`, `completed`

### Event

- `event_status`: `draft`, `pending_sks_approval`, `rejected`, `published`, `full`, `completed`, `cancelled`
- `rsvp_status`: `going`, `maybe`, `not_going`, `waitlisted`

### ProjectMatch

- `project_status`: `draft`, `open`, `in_review`, `closed`, `archived`
- `invite_status`: `pending`, `accepted`, `declined`, `expired`, `revoked`

### MicroJob

- `job_status`: `draft`, `open`, `in_review`, `awarded`, `in_progress`, `completed`, `cancelled`, `expired`
- `proposal_status`: `submitted`, `shortlisted`, `rejected`, `withdrawn`, `accepted`
- `contract_status`: `pending`, `active`, `paused`, `completed`, `cancelled`, `disputed`

## 20. Indexing Stratejisi

- Tum tablolar icin `primary key(id)` zorunludur.
- `deleted_at is null` filtrelenen tablolarda partial index kullanilir.
- `created_at desc` veya `updated_at desc` siralamali liste ekranlari icin indeks eklenir.
- `user_id`, `status`, `entity_type`, `entity_id`, `campus_id` gibi filtre kolonlari composite index'e alinmali.
- `email`, `code`, `slug`, `case_number`, `pickup_code` gibi dogal anahtarlar unique index ile korunmali.
- Mesafeli liste ekranlari icin tipik indeks formu: `(status, created_at desc)` veya `(owner_user_id, status, created_at desc)`.
- Arama ihtiyaci olan alanlarda GIN + `tsvector` veya trigram index dusunulmelidir.
- `jsonb` alanlarda yalnizca gercek ihtiyac varsa GIN index kullanilir.
- `facility.facility_bookings` icin `resource_id + tstzrange(start_at, end_at)` exclusion constraint uygulanmalidir.
- `event.event_rsvps`, `event.event_checkins`, `food.food_order_items`, `microjob.job_proposals` gibi cift anahtarli tablolar icin benzersiz composite index gerekir.

## 21. Audit ve Soft-Delete Yaklasimi

- Kullanici tarafindan gorulen ana entity'lerde soft-delete kullanilir.
- Soft-delete alanlari: `deleted_at`, `deleted_by`.
- Mantiksal silme sonrasinda kayit raporlama ve tarihce icin korunur.
- Fiziksel silme yalnizca gecici token, cache veya test verisi gibi geri kazanimi gerekmeyen kayitlarda uygulanir.
- Durum gecisleri kritik ise `*_status_history` tablolari veya `core.audit_log` kullanilir.
- Audit log append-only olmalidir; update/delete yapilmaz.
- PII temizligi gerekiyorsa soft-delete ile birlikte anonymization batch job calistirilir.

## 22. Kritik Constraint Onerileri

- `auth.users.university_email` unique.
- `auth.user_roles(user_id, role_id)` unique.
- `profile.profiles.user_id` unique.
- `profile.profile_skills(profile_id, skill_name)` unique.
- `profile.profile_interests(profile_id, interest_name)` unique.
- `facility.booking_checkins.booking_id` unique.
- `facility.facility_bookings` icin zaman cakisma kontrolu exclusion constraint.
- `food.food_order_items(food_order_id, menu_item_id)` unique.
- `event.event_rsvps(event_id, user_id)` unique.
- `event.event_checkins(event_id, user_id)` unique.
- `projectmatch.project_invitations(project_post_id, invited_user_id)` unique.
- `projectmatch.project_team_members(team_id, user_id)` unique.
- `microjob.job_proposals(job_post_id, applicant_user_id)` unique.

## 23. Migration Guideline

- Migration araci olarak Flyway veya Liquibase kullanilir.
- Ilk versiyon `V001__init_core.sql` gibi katman katman yazilir.
- Once `core` ve `auth`, sonra `profile` ve `notification`, ardindan is modulleri migrate edilmelidir.
- Her migration tek bir amaca hizmet etmeli; buyuk ve karmasik degisiklikler parcali uygulanmalidir.
- Kolon ekleme -> backfill -> not null -> index sirasi izlenmelidir.
- Varolan kolonu yeniden adlandirmak yerine yeni kolon ekleyip gecis yapmak tercih edilir.
- Buyuk tablolar icin index olusturma asamasinda `CREATE INDEX CONCURRENTLY` kullanimi dusunulmelidir.
- Geriye donuk uyumluluk icin once schema genisletilir, sonra uygulama yeni kolona gecirilir, en son eski alan kaldirilir.
- Seed verileri `roles`, `campuses`, sabit `tags` ve sistem `notification_templates` icin repeatable migration ile yonetilebilir.
- Ozellikle `outbox_events`, `analytics_events` ve history tablolarinda partition stratejisi ileride eklenebilir; ilk surumde tablo yapisi partition dostu tasarlanmalidir.
- Multi-campus destek acilirken `campus_id` kolonlari kontrollu bir migration ile operasyonel tablolara eklenmelidir.

## 24. Uygulama Notlari

- IsikCampusOS microservices mimarisi ile basladi; her servis bagimsiz bir PostgreSQL instance'ina sahiptir.
- Servisler birbirinin veritabanina dogrudan erisemez; cross-service veri ihtiyaci Kafka event veya REST API araciligiyla karsilanir.
- Ortak `user_id` referansi her servisin kendi tablosunda saklanir; merkezi `users` tablosuna join yapilmaz.
- Raporlama ve analitik ihtiyaci icin transaction tablolarindan ayri aggregate tablolar kullanmak performans kazandirir.
- Arama, filtreleme ve dashboard query'leri icin okuma modeli ile yazma modeli ayrilabilir; ancak ilk surumde bu zorunlu degildir.
- Docker Compose ortaminda her servis icin ayri `postgres` container tanimi bulunmalidir.
- Migration'lar her servisin kendi `src/main/resources/db/migration/` dizininde Flyway dosyalari ile yonetilir.
