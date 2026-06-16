# 05 — Roller ve Yetkiler

## 1. Rol Modeli

Sistem **rol bazlı erişim kontrolü (RBAC)** kullanır. Roller JWT içinde taşınır ve API Gateway tarafından `X-User-Roles` başlığı olarak downstream servislere iletilir. Bir kullanıcı birden fazla role sahip olabilir.

Roller iki türdür:
- **Sistem rolleri:** auth-service tarafından kullanıcıya atanan kalıcı roller.
- **Domain rolü:** Bir kaynağa özgü, üyelik tablosunda tutulan rol (ör. kulüp başkanlığı). Sistem rolü değildir.

## 2. Roller

| Rol | Tür | Açıklama |
|-----|-----|----------|
| `ROLE_STUDENT` | Sistem | Ana kullanıcı. Kulüplere katılır, etkinliklere RSVP yapar, tesis rezerve eder, profilini yönetir. |
| `ROLE_REGISTRAR` | Sistem | Öğrenci İşleri. Öğrenci hesabı oluşturur, öğrenci durumlarını yönetir. |
| `ROLE_SKS_ADMIN` | Sistem | SKS personeli. Kulüp ve etkinlik onaylarını yönetir, kulüp başkanı atar, kulüp performansını izler. |
| `ROLE_FACILITY_ADMIN` | Sistem | Tesis yöneticisi. Tesis kaynaklarını, politikaları ve uygunluk kurallarını yönetir. |
| `ROLE_VENDOR_ADMIN` | Sistem | İşletme yöneticisi. Kendi satıcı profilini, menüsünü, kampanyalarını, çalışma saatlerini, ciro ve personelini yönetir. |
| `ROLE_VENDOR_STAFF` | Sistem | İşletme personeli. Yetkisi olan işletmenin sipariş operasyonlarını yürütür. |
| `ROLE_RIDE_ADMIN` | Sistem | CampusRide yönetimi. Sürücü/araç doğrulama, şikayet ve yolculuk loglarını inceler. |
| `ROLE_BUILDING_SUPPORT_ADMIN` | Sistem | Yapı, Destek ve Ulaşım Hizmetleri rolü. CampusRide yönetim işlemlerinde yetkilidir. |
| `ROLE_SUPPORT_SERVICES_ADMIN` | Sistem | Destek Hizmetleri. UniEats satıcı/işletme yönetimi ve destek duyuruları için yetkilidir. |
| `ROLE_ADMIN` | Sistem | Sistem yöneticisi. Roller, güvenlik ve sistem geneli yönetim. |
| Kulüp Başkanı (`YONETICI`) | Domain | `KulupUyesi` tablosunda rol = YONETICI. Yalnızca kendi kulübü için etkinlik/duyuru/profil işlemleri yapar. |

> **Not:** Frontend rol gruplandırması `frontend/src/yardimcilar/yetkiler.ts` içindedir. Dashboard yönlendirmesi bu gruplara göre yapılır.

## 3. Yetki Matrisi (çalışan modüller)

| İşlem | student | registrar | sks_admin | facility_admin | vendor_admin | vendor_staff | ride_admin / building_support | support_services | admin | Kulüp Başkanı |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Profil görüntüleme/güncelleme | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Öğrenci hesabı oluşturma | — | ✓ | — | — | — | — | — | — | ✓ | — |
| Öğrenci durumu yönetme | — | ✓ | — | — | — | — | — | — | ✓ | — |
| Kulübe katılma / ayrılma | ✓ | — | — | — | — | — | — | — | — | ✓ |
| Kulüp oluşturma / başkan atama | — | — | ✓ | — | — | — | — | — | ✓ | — |
| Etkinlik taslağı oluşturma | — | — | — | — | — | — | — | — | ✓ | ✓ (kendi kulübü) |
| Etkinlik onaylama / yayınlama | — | — | ✓ | — | — | — | — | — | ✓ | — |
| Etkinliğe RSVP | ✓ | — | — | — | — | — | — | — | — | ✓ |
| Etkinlik check-in / sertifika | — | — | ✓ | — | — | — | — | — | ✓ | ✓ (kendi kulübü) |
| Kulüp profil talebi onaylama | — | — | ✓ | — | — | — | — | — | ✓ | — |
| Tesis rezervasyonu oluşturma | ✓ | — | — | — | — | — | — | — | ✓ | ✓ |
| Tesis kaynak/politika yönetimi | — | — | — | ✓ | — | — | — | — | ✓ | — |
| Satıcı listeleme / yemek siparişi | ✓ | — | — | — | — | — | — | — | ✓ | — |
| İşletme profil/menü/kampanya yönetimi | — | — | — | — | ✓ | — | — | — | ✓ | — |
| İşletme sipariş operasyonu | — | — | — | — | ✓ | ✓ | — | — | ✓ | — |
| İşletme/satıcı yönetimi | — | — | — | — | — | — | — | ✓ | ✓ | — |
| CampusRide ilan/talep/araç işlemleri | ✓ | — | — | — | — | — | — | — | ✓ | — |
| CampusRide doğrulama/şikayet yönetimi | — | — | — | — | — | — | ✓ | — | ✓ | — |
| Bildirimleri okuma / mesajlaşma | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## 4. Yetki Prensipleri

- **Sahiplik (ownership):** Kullanıcı yalnızca kendi kaydını, rezervasyonunu, RSVP'sini görüp düzenler.
- **Domain sınırı:** Kulüp başkanı yalnızca **kendi** kulübünün etkinliklerini, duyurularını ve üyelerini yönetir.
- **İşletme sahipliği:** İşletme yöneticisi ve personeli yalnızca bağlı oldukları satıcı/işletme kayıtlarında işlem yapar.
- **Yolculuk sahipliği:** CampusRide kullanıcıları yalnızca kendi ilan, talep, araç ve doğrulama kayıtlarında işlem yapar; yönetim rolleri doğrulama/şikayet akışlarını inceler.
- **Onay zinciri:** Kulüp ve etkinlik yayını SKS onayına tabidir; kulüp başkanı taslak oluşturur, SKS onaylar/reddeder/revizyon ister.
- **İş kuralları (kodda uygulanan):**
  - Bir öğrenci aynı anda yalnızca bir kulübün başkanı olabilir.
  - Bir akademik danışman aynı anda yalnızca bir kulübe atanabilir.
  - Kulüp başkanı, yerine başkan atanmadan kulüpten ayrılamaz.
  - Üye rol/durum değişikliği yalnızca SKS yetkisiyle yapılır.
  - Danışman e-postası `@isikun.edu.tr` ile bitmelidir.
  - Yemek siparişi yalnızca öğrenci rolüyle verilir; işletme sipariş durumunu kendi panelinden ilerletir.
  - İşletme personeli hesapları `ROLE_VENDOR_ADMIN` tarafından açılır; satıcı-personel bağı food-service içinde tutulur.
  - CampusRide yönetim uçları `ROLE_RIDE_ADMIN`, `ROLE_BUILDING_SUPPORT_ADMIN` veya `ROLE_ADMIN` ister.

## 5. Planlanan Modüllerde Roller

ProjectMatch ve MicroJob için özel roller henüz kodlanmamıştır. Moderasyon (`ROLE_MODERATOR` gibi) ayrı servis/modül açıldığında değerlendirilecektir.
