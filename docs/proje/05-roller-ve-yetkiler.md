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
| `ROLE_ADMIN` | Sistem | Sistem yöneticisi. Roller, güvenlik ve sistem geneli yönetim. |
| Kulüp Başkanı (`YONETICI`) | Domain | `KulupUyesi` tablosunda rol = YONETICI. Yalnızca kendi kulübü için etkinlik/duyuru/profil işlemleri yapar. |

> **Not:** Frontend rol gruplandırması (`utils/roles.ts`): SKS yönetimi, öğrenci işleri, tesis yönetimi ve öğrenci. Dashboard yönlendirmesi bu gruplara göre yapılır.

## 3. Yetki Matrisi (çalışan modüller)

| İşlem | student | registrar | sks_admin | facility_admin | admin | Kulüp Başkanı |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Profil görüntüleme/güncelleme | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Öğrenci hesabı oluşturma | — | ✓ | — | — | ✓ | — |
| Öğrenci durumu yönetme | — | ✓ | — | — | ✓ | — |
| Kulübe katılma / ayrılma | ✓ | — | — | — | — | ✓ |
| Kulüp oluşturma / başkan atama | — | — | ✓ | — | ✓ | — |
| Etkinlik taslağı oluşturma | — | — | — | — | ✓ | ✓ (kendi kulübü) |
| Etkinlik onaylama / yayınlama | — | — | ✓ | — | ✓ | — |
| Etkinliğe RSVP | ✓ | — | — | — | — | ✓ |
| Etkinlik check-in / sertifika | — | — | ✓ | — | ✓ | ✓ (kendi kulübü) |
| Kulüp profil talebi onaylama | — | — | ✓ | — | ✓ | — |
| Tesis rezervasyonu oluşturma | ✓ | — | — | — | ✓ | ✓ |
| Tesis kaynak/politika yönetimi | — | — | — | ✓ | ✓ | — |

## 4. Yetki Prensipleri

- **Sahiplik (ownership):** Kullanıcı yalnızca kendi kaydını, rezervasyonunu, RSVP'sini görüp düzenler.
- **Domain sınırı:** Kulüp başkanı yalnızca **kendi** kulübünün etkinliklerini, duyurularını ve üyelerini yönetir.
- **Onay zinciri:** Kulüp ve etkinlik yayını SKS onayına tabidir; kulüp başkanı taslak oluşturur, SKS onaylar/reddeder/revizyon ister.
- **İş kuralları (kodda uygulanan):**
  - Bir öğrenci aynı anda yalnızca bir kulübün başkanı olabilir.
  - Bir akademik danışman aynı anda yalnızca bir kulübe atanabilir.
  - Kulüp başkanı, yerine başkan atanmadan kulüpten ayrılamaz.
  - Üye rol/durum değişikliği yalnızca SKS yetkisiyle yapılır.
  - Danışman e-postası `@isikun.edu.tr` ile bitmelidir.

## 5. Planlanan Modüllerde Roller

Yemek (`vendor_admin`), moderasyon (`moderator`) gibi roller, ilgili modüller geliştirildiğinde sisteme eklenecektir. Şu an bu roller **kodda tanımlı değildir**.
