# Güvenlik Politikası

> **English:** To report a vulnerability, please use GitHub's
> [private vulnerability reporting](https://github.com/tolguner/IsikCampusOS/security/advisories/new)
> instead of opening a public issue. Details in Turkish below.

## Projenin niteliği

Işık CampusOS bir **lisans bitirme projesidir**. Herhangi bir üretim ortamında
çalışmamaktadır, gerçek kullanıcı verisi işlememektedir ve kurumsal bir dağıtımı
yoktur. Depo, akademik çalışmanın çıktısı ve teknik bir referans olarak yayımlanır.

Sürüm etiketi kullanılmaz; **yalnızca `main` dalı** güncel tutulur. Bu nedenle
"desteklenen sürümler" listesi yerine tek kural geçerlidir: güvenlik düzeltmeleri
`main` dalına uygulanır.

## Zafiyet bildirimi

Bir güvenlik açığı bulduysanız **herkese açık issue açmayın.** Bunun yerine:

1. **Tercih edilen yol —** GitHub üzerinden özel bildirim:
   [Security → Report a vulnerability](https://github.com/tolguner/IsikCampusOS/security/advisories/new)
2. **Alternatif —** doğrudan e-posta: `tolgaolguner1@gmail.com`

Bildiriminizde şunları paylaşırsanız değerlendirme hızlanır: etkilenen servis veya
dosya, yeniden üretme adımları, olası etki ve varsa bir kavram kanıtı.

Bu bir öğrenci projesi olduğundan resmî bir yanıt süresi taahhüdü verilmemektedir;
bildirimler makul sürede değerlendirilir ve geçerli bulunanlar `main` dalında
düzeltilir.

## Bilinen ve kabul edilmiş riskler

Aşağıdaki konular bilinmektedir; yeniden bildirmenize gerek yoktur.

### `xlsx` (SheetJS) 0.18.5

npm dağıtımının yaması bulunmayan iki zafiyeti vardır: **CVE-2023-30533**
(prototype pollution) ve **CVE-2024-22363** (ReDoS). Her ikisi de kütüphane bir
dosyayı **ayrıştırırken** tetiklenir.

Bu projede `xlsx` yalnızca katılımcı listesini **yazmak** için kullanılır
(`XLSX.utils.json_to_sheet` + `XLSX.writeFile`); kod tabanında hiçbir
`read` / `readFile` / `parse` çağrısı yoktur, dolayısıyla kullanıcıdan gelen
hiçbir dosya ayrıştırılmaz. Risk bu gerekçeyle kabul edilmiştir.

Kalıcı çözüm seçenekleri
[yol haritası dokümanında](docs/proje/08-yol-haritasi-ve-durum.md) kayıtlıdır.

### Demo hesapları ve yerel kimlik bilgileri

`auth-service` migration'ları, yerel geliştirme ve demo amacıyla kurumsal rollere
sahip hesaplar oluşturur. Bu hesapların BCrypt parola özetleri depoda görünür.
Bunlar **yalnızca yerel demo içindir**; herhangi bir gerçek sisteme erişim sağlamaz.

Aynı şekilde `.env.example` içindeki değerler örnektir. `JWT_SECRET` ve veritabanı
parolasının kod içinde varsayılanı **yoktur** — tanımlanmazlarsa servisler bilinçli
olarak başlamaz (fail-fast). Projeyi kendi ortamınıza kuruyorsanız hem bu değerleri
hem de demo hesaplarının parolalarını mutlaka değiştirin.

### Kapsam dışı bildirimler

- Yalnızca yerel geliştirme ortamını etkileyen yapılandırmalar (`docker-compose.yml`
  varsayılanları, Mailpit, açık geliştirme portları)
- Sömürülebilir bir etki gösterilmeden yalnızca bağımlılık tarayıcısı çıktısı olarak
  raporlanan bulgular
- Depoda yayımlanmayan üçüncü taraf hizmetlere ilişkin bulgular

## Güvenlik açısından alınmış önlemler

- Kimlik doğrulama API Gateway katmanında merkezîleştirilmiştir; servisler
  doğrulanmış kullanıcı ve rolleri güvenilir HTTP başlıklarıyla alır
- Rol bazlı erişim denetimi (RBAC) uç nokta düzeyinde uygulanır
- Parolalar BCrypt ile saklanır
- `JWT_SECRET` ve veritabanı parolası yalnızca ortam değişkeninden okunur; kod
  içinde varsayılanı yoktur (fail-fast)
- Veri tabanı şeması Flyway ile sürümlenir, uygulama açılışta yalnızca doğrulama
  yapar (`ddl-auto: validate`)
- Yarışmalı işlemler (etkinlik katılımı, tesis rezervasyonu) veri tabanı düzeyinde
  tekillik kısıtları ve işlem sınırlarıyla korunur
- Depoda gizli bilgi bulunmaması için `.env` ve türevleri sürüm kontrolü dışındadır
