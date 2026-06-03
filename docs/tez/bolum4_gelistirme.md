# BÖLÜM 4: GELİŞTİRME (IMPLEMENTATION)

Bu bölümde, Bölüm 3'te tasarımı sunulan IsikCampusOS platformunun gerçekleştirim süreci ele alınmaktadır. Bölüm; geliştirmede izlenen yaklaşımı ve kullanılan temel teknolojileri, çekirdek altyapının ve fonksiyonel modüllerin hayata geçirilmesini, kullanıcı arayüzünün geliştirilmesini ve süreç boyunca karşılaşılan teknik zorlukları ve bunlara üretilen çözümleri anlatı biçiminde sunmaktadır. Amaç, satır düzeyinde kod ayrıntısı vermek değil; tasarım kararlarının uygulamada nasıl somutlaştığını ve hangi mühendislik tercihlerinin yapıldığını ortaya koymaktır.

## 4.1. Geliştirme Yaklaşımı ve Temel Teknolojiler

Platform, Bölüm 3'te açıklanan yinelemeli ve artımlı yaklaşımla geliştirilmiştir. Her geliştirme döngüsünde önce çekirdek altyapı sağlamlaştırılmış, ardından bir fonksiyonel modül arka uç ve ön yüz tarafıyla birlikte uçtan uca çalışır hâle getirilmiştir. Tüm servisler ve kullanıcı arayüzü, tek bir kod deposunda (monorepo) yönetilmiş; bu sayede ortak sözleşmeler tek yerde tutulmuş ve geliştirme koordinasyonu kolaylaşmıştır.

Arka uç tarafında Java ve Spring Boot ekosistemi tercih edilmiştir. Bu tercihin nedeni; Spring Cloud bileşenlerinin (Gateway, Eureka) mikroservis mimarisini doğrudan desteklemesi ve olgun bir topluluk ekosistemine sahip olmasıdır. Servisler arası asenkron iletişim için Apache Kafka, veri saklama için servis başına ayrı PostgreSQL veri tabanı, kullanıcı arayüzü için React kullanılmıştır. Tüm bileşenler Docker ile konteynerleştirilerek tutarlı bir geliştirme ve dağıtım ortamı sağlanmıştır. Projede kullanılan temel teknolojiler ve kullanım amaçları Tablo 4.1'de özetlenmiştir.

> **[TABLO 4.1 — Temel Teknoloji Yığını]** Aşağıdaki tablo doğrudan kullanılabilir.

| Katman | Teknoloji | Kullanım Amacı |
|--------|-----------|----------------|
| Arka uç | Java 21 / Spring Boot 3 | Mikroservislerin geliştirildiği ana platform |
| API Katmanı | Spring Cloud Gateway | Tek giriş noktası, yönlendirme ve merkezi kimlik doğrulama |
| Servis Keşfi | Spring Cloud Netflix Eureka | Servislerin birbirini dinamik olarak bulması |
| Mesajlaşma | Apache Kafka | Servisler arası olay güdümlü asenkron iletişim |
| Güvenlik | Spring Security + JWT | Kimlik doğrulama ve rol bazlı yetkilendirme |
| Veri | PostgreSQL (servis başına) + Flyway | İlişkisel veri saklama ve sürüm kontrollü şema yönetimi |
| Ön yüz | React + TypeScript | Tek sayfa uygulaması (SPA) arayüzü |
| Dağıtım | Docker & Docker Compose | Konteynerleştirme ve yerel orkestrasyon |

## 4.2. Çekirdek Altyapının Gerçekleştirimi

Platformun tüm modülleri, ortak bir çekirdek altyapı üzerine inşa edilmiştir. Bu altyapının ilk bileşeni, servislerin birbirini bulmasını sağlayan servis keşif katmanıdır: her servis başlangıçta Eureka sunucusuna kaydolur ve diğer servislere sabit ağ adresleri yerine mantıksal servis adlarıyla erişilir. Bu yapı, servislerin konumdan bağımsız çalışmasını ve ileride ölçeklenmesini kolaylaştırmıştır.

İkinci ve en kritik bileşen, tüm dış isteklerin geçtiği API Gateway'dir. İstemci hiçbir servise doğrudan erişemez; tüm trafik Gateway üzerinden akar. Gateway, gelen isteğin taşıdığı JWT'yi merkezî olarak doğrular, geçerli ise token içindeki kullanıcı kimliği ile rolleri çözümler ve bu bilgiyi ilgili servise özel HTTP başlıkları (`X-User-Id`, `X-User-Roles`) olarak iletir. Bu sayede her servis, ayrı ayrı kimlik doğrulama yükü taşımadan, yalnızca yetkilendirme kararına odaklanır. Bu merkezî doğrulama yaklaşımı, mikroservis mimarilerinde önerilen yaygın bir desendir (de Almeida & Canedo, 2022).

Üçüncü bileşen, servisleri birbirine gevşek bağlayan olay akışıdır. Bir serviste gerçekleşen önemli bir durum değişikliği, Apache Kafka üzerinden bir olay olarak yayımlanır ve bu olayla ilgilenen diğer servisler onu asenkron biçimde tüketir. Bunun en belirgin örneği kullanıcı kaydıdır: kimlik servisi yeni bir kullanıcı oluşturduğunda bir kayıt olayı yayar, profil servisi bu olayı dinleyerek ilgili kullanıcı için otomatik olarak boş bir profil oluşturur. İki servis, birbirine senkron biçimde bağımlı olmadan tutarlı bir duruma ulaşır. Olay tüketimi, aynı olayın birden çok kez işlenmesi durumunda mükerrer kayıt oluşmasını önleyecek biçimde (idempotent) tasarlanmıştır.

## 4.3. Fonksiyonel Modüllerin Gerçekleştirimi

Çekirdek altyapı üzerine, platformun altı fonksiyonel modülü sırayla geliştirilmiştir. Modüllerin tümü aynı katmanlı yapıyı (denetleyici – servis – veri erişimi – veri modeli) izlemiş; böylece her yeni modül, önceki modüllerin oturmuş şablonu üzerinden tutarlı biçimde inşa edilmiştir.

**Kulüp ve etkinlik modülü**, platformun en kapsamlı parçası olarak geliştirilmiştir. Bu modülde kulüp yaşam döngüsü, SKS onay akışları, etkinlik durum geçişleri, katılım (RSVP) ve bekleme listesi yönetimi, QR kod ile katılım doğrulaması ve sertifika üretimi gerçekleştirilmiştir. Öne çıkan teknik çözümlerden biri, kapasitesi dolan etkinliklerde devreye giren bekleme listesi mekanizmasıdır: bir katılımcı kaydını iptal ettiğinde, bekleme listesindeki ilk öğrenci ana listeye otomatik olarak yükseltilir. Bir diğer çözüm, belirli aralıklarla çalışan bir zamanlayıcının yaklaşan etkinlikler için katılımcılara otomatik hatırlatma göndermesi ve gönderdiği hatırlatmaları kaydederek tekrarı önlemesidir.

**Tesis rezervasyon modülünde**, kampüs kaynaklarının çakışmasız rezerve edilmesi merkezî gereksinimdir. Bu modülde, bir rezervasyon talebi önce tesis politikasına (minimum ön bildirim süresi, azami rezervasyon süresi gibi) göre, ardından aynı kaynak ve zaman aralığında etkin bir rezervasyon bulunup bulunmadığına göre iki aşamalı olarak doğrulanır. Zaman bilgisinin tutarlılığını korumak için tarih-saat alanları, zaman dilimi bilgisini saklayan bir veri tipiyle tutulmuştur.

**Yemek sipariş modülü**, satıcıların menü yönetimi ile öğrencilerin sipariş takibini bir araya getirir. Sipariş, tanımlı bir durum makinesi boyunca ilerler ve her durum değişikliğinde öğrenciye asenkron bildirim iletilir; teslim aşamasında öğrenci bir teslim koduyla siparişini alır. **Paylaşımlı yolculuk modülü**, önceden planlı carpooling ilanlarını harita üzerinde görselleştirir. Kalkış ve varış konumu, yoğun güzergâhlar için önceden tanımlı popüler toplanma noktalarından seçilebildiği gibi, seyrek güzergâhlar için serbest konum girişiyle de belirlenebilir (hibrit model). Öğrenciler ilanları konuma göre arayabilir ve belirli bir güzergâh için bildirim aboneliği oluşturabilir; eşleştirmede sürücünün rota sapması tolerans sınırı içinde tutulur.

**Proje eşleştirme ve mikro iş modülleri**, ortak bir etiket altyapısı üzerine kurulmuştur. Öğrencilerin profillerine ekledikleri ilgi alanı ve beceri etiketleri, ilanların hedef etiketleriyle eşleştirilerek hem ilan görünürlüğü (herkese açık ya da yalnızca ilgili etiketlere sahip kullanıcılara yönelik) hem de bildirim filtreleme tercihi bu altyapı üzerinden yönetilir. Mikro iş modülü ayrıca, hizmet/ürün sunan ve talep eden öğrencileri tek bir pazaryerinde buluşturur ve tamamlanan işlerde çift yönlü puanlamaya dayalı bir itibar göstergesi üretir.

Modüller arası bağlantı noktalarında, bildirim üretimi gibi ortak işlevler tekrar tekrar kodlanmak yerine merkezî biçimde ele alınmıştır. Bildirim işlevinin, bağımsız bir servise ayrılmak yerine mevcut sürümde etkinlik servisi içinde konumlandırılması, Bölüm 3'te gerekçelendirilen bilinçli bir tasarım kararıdır.

## 4.4. Kullanıcı Arayüzünün Geliştirilmesi

Kullanıcı arayüzü, React ve TypeScript ile tek sayfa uygulaması (SPA) olarak geliştirilmiştir. Uygulama durumu, her domain için ayrı tutulan hafif durum depolarıyla yönetilmiş; arka uç ile iletişim, her isteğe oturum token'ını otomatik ekleyen merkezî bir HTTP istemcisi üzerinden sağlanmıştır.

Arayüzün güvenlik mantığı, korumalı rota yaklaşımıyla kurulmuştur. Bir kullanıcı korumalı bir sayfaya erişmeye çalıştığında üç aşamalı bir denetimden geçer: oturumu yoksa giriş sayfasına, e-postası doğrulanmamışsa doğrulama sayfasına, ilk giriş şifre değişikliği bekliyorsa şifre değiştirme sayfasına yönlendirilir. Bu adımları tamamlayan kullanıcı, rolüne göre uygun panele (SKS yöneticisi, öğrenci işleri, tesis yöneticisi veya öğrenci paneli) otomatik olarak yönlendirilir.

Tasarımın bütününde, Bölüm 2'de ele alınan bilişsel yük azaltma ilkesi gözetilmiştir. Tüm modüller ortak arayüz bileşenleri (kart, liste, form, durum etiketi) ve tutarlı bir renk ve tipografi düzeni üzerine kurulmuş; böylece kullanıcı bir modülden diğerine geçtiğinde aynı etkileşim kalıplarıyla karşılaşmış ve modüller arası bilişsel geçiş maliyeti en aza indirilmiştir.

Platformun çalışan arayüzünden seçilmiş ekranlar aşağıdaki şekillerde sunulmaktadır.

> **[ŞEKİL 4.1 — Giriş ve Kimlik Doğrulama Ekranı]** *(Ekran görüntüsü yer tutucu.)*

> **[ŞEKİL 4.2 — Öğrenci Ana Paneli]** *(Ekran görüntüsü yer tutucu.)*

> **[ŞEKİL 4.3 — Kulüp ve Etkinlik Ekranları (liste, etkinlik detayı ve RSVP)]** *(Ekran görüntüsü yer tutucu.)*

> **[ŞEKİL 4.4 — Tesis Rezervasyon Ekranı]** *(Ekran görüntüsü yer tutucu.)*

> **[ŞEKİL 4.5 — SKS Onay Paneli]** *(Ekran görüntüsü yer tutucu.)*

> **Not (yazım rehberi):** Bu ekran görüntüleri, uygulama çalışır durumdayken alınıp tez dosyasına eklenmeli; her şekil Şekiller Listesi'ne bağlanmalı ve metin içinde atıf almalıdır.

## 4.5. Karşılaşılan Zorluklar ve Çözümler

Geliştirme süreci boyunca, mikroservis mimarisinin doğasından kaynaklanan birkaç teknik zorlukla karşılaşılmış ve bunlara somut çözümler üretilmiştir.

İlk zorluk, **servisler arası veri tutarlılığıdır**. Servislerin kendi veri tabanlarına sahip olması, bir servisteki değişikliğin diğerine yansıtılmasını gerektirmiştir. Bu, senkron çağrı zincirleri yerine Kafka tabanlı asenkron olaylarla çözülmüş; böylece bir servisin geçici olarak erişilemez olması, diğer servisin ana işleyişini durdurmamıştır.

İkinci zorluk, **kimlik doğrulamanın her serviste tekrarlanması riskidir**. Her servisin ayrı ayrı token doğrulaması hem kod tekrarı hem de tutarsızlık doğururdu. Bu sorun, doğrulamanın API Gateway katmanında merkezîleştirilmesi ve sonucun güvenilir HTTP başlıklarıyla servislere iletilmesiyle çözülmüştür.

Üçüncü zorluk, **şema tutarlılığının korunmasıdır**. Geliştirme sırasında otomatik şema güncellemesine güvenmek, ortamlar arası farklılıklara ve veri kaybı riskine yol açabilirdi. Bu nedenle her serviste şema, sürüm kontrollü göç (migration) betikleriyle yönetilmiş ve uygulama başlangıcında yalnızca doğrulama yapacak biçimde yapılandırılmıştır.

Dördüncü olarak, **eşzamanlı işlemlerden kaynaklanan tutarsızlık riski** ele alınmıştır. Özellikle etkinlik katılımı ve tesis rezervasyonu gibi yarışmalı işlemlerde, mükerrer kayıt veya çakışma oluşmaması için hem veri tabanı düzeyinde tekillik kısıtları tanımlanmış hem de ilgili işlemler işlem (transaction) sınırları içinde yürütülmüştür.

Son olarak, modül sayısının artmasıyla **mimari karmaşıklığın yönetilmesi** bir denge sorunu olarak ortaya çıkmıştır. Her işlevi ayrı bir servise bölmek yerine, yalnızca anlamlı domain sınırlarında servis ayrımına gidilmiş; bildirim gibi tek tüketicisi olan işlevler, gereksiz dağıtık karmaşıklıktan kaçınmak için mevcut servis içinde tutulmuştur. Bu denge, geliştirme ve bakım maliyetini kontrol altında tutmuştur.
