# IsikCampusOS Bitirme Projesi Planlama Dokümanı

**Proje adı:** IsikCampusOS  
**Proje türü:** Mikroservis mimarili dijital kampüs yönetim platformu  
**Hazırlanma tarihi:** 29 Nisan 2026  
**Hedef sunum:** Bitirme projesi danışman değerlendirmesi

## 1. Yönetici Özeti

IsikCampusOS, Işık Üniversitesi öğrencilerinin kampüs içi sosyal, akademik ve operasyonel süreçlere tek platform üzerinden erişmesini hedefleyen modüler bir dijital kampüs işletim sistemi projesidir. Proje; kimlik doğrulama, profil yönetimi, kulüp ve etkinlik yönetimi, tesis rezervasyonu, bildirim, analitik, moderasyon, proje eşleştirme, kampüs içi mikro iş ilanları, yemek siparişi ve paylaşımlı yolculuk gibi alanları ortak bir platform mimarisi altında birleştirmeyi amaçlar.

Mevcut kod tabanında projenin çekirdek altyapısı kurulmaya başlanmıştır. Çalışan veya iskeleti bulunan ana parçalar; React tabanlı frontend, Spring Boot tabanlı API Gateway, Eureka servis kayıt sistemi, auth-service, profile-service ve event-service modülleridir. Altyapı tarafında PostgreSQL, Kafka, Zookeeper, Redis, Zipkin ve Mailpit Docker Compose ile yerel geliştirme ortamında ayağa kaldırılabilir durumdadır.

Bitirme projesi kapsamında hedef, tüm planlanan modülleri aynı derinlikte tamamlamak yerine güçlü ve gösterilebilir bir MVP üretmektir. Bu MVP; güvenli giriş, öğrenci/rol yönetimi, profil sistemi, etkinlik yönetimi, RSVP akışı, temel tesis rezervasyonu, bildirim altyapısı ve yönetici odaklı operasyon ekranlarını kapsayacak şekilde sınırlandırılacaktır.

## 2. Problem Tanımı

Üniversite kampüslerinde birçok süreç dağınık kanallar üzerinden yürütülmektedir. Kulüp etkinlikleri sosyal medya veya mesajlaşma gruplarında duyurulmakta, tesis rezervasyonları çoğu zaman manuel iletişimle ilerlemekte, öğrenciler proje ekibi ya da kampüs içi fırsat bulmak için farklı platformlar arasında dağılmaktadır. Bu dağınık yapı şu problemleri doğurur:

- Güncel bilgiye erişim her öğrenci için eşit ve güvenilir değildir.
- Etkinliklerde kapasite yönetimi, RSVP ve katılım takibi sağlıklı yapılamaz.
- Tesis kullanımı, rezervasyon çakışmaları ve no-show durumları ölçülemez.
- Kulüpler, SKS ve kampüs yönetimi karar alabilecek operasyonel veri üretemez.
- Öğrenciler sosyal, akademik ve üretkenlik odaklı fırsatları geç keşfeder.
- Kampüs içi güven, moderasyon ve hesap verebilirlik mekanizmaları zayıf kalır.

IsikCampusOS bu problemleri tek kimlik, tek arayüz, rol bazlı yetkilendirme ve modüler servis mimarisi ile çözmeyi hedefler.

## 3. Projenin Amacı ve Hedefleri

Projenin temel amacı, kampüs içi hizmetleri ve öğrenci etkileşimlerini tek bir dijital platformda birleştiren, ölçeklenebilir ve genişletilebilir bir sistem geliştirmektir.

Ana hedefler:

- Üniversite e-postası ve rol tabanlı erişimle güvenli kullanıcı yönetimi sağlamak.
- Öğrenciler için merkezi kampüs paneli ve kişisel profil altyapısı sunmak.
- Kulüp etkinliklerini oluşturma, onaylama, yayınlama, RSVP ve check-in akışlarıyla yönetmek.
- Tesis rezervasyonlarını çakışmasız ve izlenebilir hale getirmek.
- Bildirim, analitik ve moderasyon gibi ortak platform kabiliyetlerini altyapıya dahil etmek.
- Mikroservis mimarisi, event-driven iletişim ve servis bazlı veri izolasyonu gibi modern yazılım mimarisi yaklaşımlarını uygulamak.
- Danışman değerlendirmesi ve bitirme projesi sunumu için çalışır, anlaşılır ve teknik olarak savunulabilir bir MVP ortaya koymak.

## 4. Kapsam

### 4.1 MVP Kapsamı

Bitirme projesi için öncelikli kapsam aşağıdaki çekirdek modüllerden oluşacaktır:

| Modül | MVP İçeriği |
| --- | --- |
| Kimlik ve Yetkilendirme | Giriş, JWT üretimi, e-posta doğrulama, şifre değiştirme, rol bazlı erişim |
| Öğrenci Yönetimi | Registrar rolü ile öğrenci oluşturma, durum yönetimi, temel kullanıcı listesi |
| Profil Yönetimi | Kullanıcı profilinin otomatik oluşması, görüntülenmesi ve düzenlenmesi |
| Etkinlik Yönetimi | Kulüp, etkinlik oluşturma, yayınlama/onay akışı, RSVP, kapasite ve temel katılım takibi |
| Tesis Rezervasyonu | Tesis/kaynak listeleme, uygunluk kontrolü, rezervasyon oluşturma ve iptal |
| Bildirim Sistemi | Kafka olaylarından in-app bildirim üretme, okundu/okunmadı takibi |
| Yönetici Paneli | Rol bazlı ekranlar, öğrenci ve etkinlik operasyonlarının izlenmesi |
| Altyapı | API Gateway, Eureka, PostgreSQL, Kafka, Docker Compose, Zipkin |

### 4.2 Genişletilmiş Kapsam

Aşağıdaki modüller mimari ve veri modeli seviyesinde planlanacak, ancak bitirme projesi tesliminde tam ürün seviyesinde tamamlanmaları zorunlu kapsam dışında tutulacaktır:

- Campus Food Hub: kampüs içi vendor, menü ve sipariş yönetimi.
- CampusRide: paylaşımlı yolculuk ilanı ve eşleştirme.
- ProjectMatch: beceri tabanlı proje/ekip eşleştirme.
- Campus MicroJob Marketplace: küçük ölçekli kampüs içi iş ilanı ve teklif sistemi.
- Moderation Service: raporlama, vaka yönetimi ve yaptırım süreçleri.
- Analytics Service: modül bazlı kullanım metrikleri ve yönetici dashboard verileri.

Bu modüller için servis dizinleri, veritabanı adları, API sözleşmeleri ve domain akışları dokümantasyonda tanımlanacaktır. Öncelik, çalışır MVP çekirdeğini sağlamlaştırmaktır.

## 5. Kullanıcı Rolleri

| Rol | Sorumluluk |
| --- | --- |
| Student | Etkinlik keşfetme, RSVP yapma, profil yönetme, rezervasyon ve diğer kampüs hizmetlerini kullanma |
| Registrar | Öğrenci hesaplarını oluşturma ve öğrenci durumlarını yönetme |
| Club Admin | Kulüp adına etkinlik taslağı oluşturma, katılım ve etkinlik operasyonlarını takip etme |
| SKS Admin | Kulüp ve etkinlik onay süreçlerini yönetme, kulüp performansını izleme |
| Facility Admin | Tesis kaynaklarını, rezervasyon politikalarını ve kullanım durumlarını yönetme |
| Vendor Admin | İleriki fazda menü ve sipariş operasyonlarını yönetme |
| Moderator | Raporlanan içerikleri ve güven ihlallerini inceleme |
| Admin | Sistem genelindeki roller, güvenlik, moderasyon ve analitik süreçlerini yönetme |

## 6. Fonksiyonel Gereksinimler

### 6.1 Auth ve Kullanıcı Yönetimi

- Kullanıcılar sistemde e-posta ve şifre ile oturum açabilmelidir.
- Başarılı girişten sonra JWT token üretilmelidir.
- API Gateway, JWT doğrulamasını merkezi olarak yapmalıdır.
- Kullanıcının rolleri downstream servislere header üzerinden aktarılmalıdır.
- Registrar rolündeki kullanıcılar öğrenci hesabı oluşturabilmelidir.
- İlk girişte e-posta doğrulama ve şifre değiştirme akışları desteklenmelidir.
- Kullanıcı durumu aktif, pasif veya benzeri state'lerle yönetilebilmelidir.

### 6.2 Profil Yönetimi

- Yeni kullanıcı oluşturulduğunda profile-service tarafında otomatik profil kaydı oluşmalıdır.
- Profilde ad, soyad, öğrenci numarası, fakülte, bölüm ve kayıt yılı gibi bilgiler tutulmalıdır.
- Kullanıcı kendi profilini görüntüleyebilmeli ve güncelleyebilmelidir.
- İleriki fazlarda beceriler, ilgi alanları, sosyal bağlantılar ve güven skoru desteklenmelidir.

### 6.3 Etkinlik Yönetimi

- Kulüp ve etkinlik modelleri desteklenmelidir.
- Kulüp yetkilisi etkinlik taslağı oluşturabilmelidir.
- SKS yetkilisi etkinliği onaylayabilmeli veya reddedebilmelidir.
- Yayınlanan etkinlikler öğrenci feed'inde listelenmelidir.
- Öğrenci etkinliğe RSVP yapabilmeli veya RSVP iptal edebilmelidir.
- Kapasite dolduğunda waitlist mantığı uygulanmalıdır.
- Etkinlik günü check-in ve katılım raporu üretilebilmelidir.

### 6.4 Tesis Rezervasyonu

- Tesis ve kaynak listesi görüntülenebilmelidir.
- Kullanıcı tarih, saat ve kaynak seçerek uygunluk sorgulayabilmelidir.
- Aynı kaynak için çakışan rezervasyon engellenmelidir.
- Rezervasyon oluşturma, iptal etme ve check-in akışları desteklenmelidir.
- Tesis yöneticisi kullanım yoğunluğu ve no-show durumlarını izleyebilmelidir.

### 6.5 Bildirim ve Analitik

- Kritik domain olayları Kafka üzerinden yayınlanmalıdır.
- Bildirim servisi ilgili olayları dinleyerek in-app bildirim üretmelidir.
- Bildirimler okundu/okunmadı durumuna sahip olmalıdır.
- Analytics tarafında giriş, etkinlik görüntüleme, RSVP, rezervasyon ve iptal gibi aksiyonlar event olarak kaydedilmelidir.

## 7. Teknolojik Altyapı ve Yığın

### 7.1 Frontend

| Teknoloji | Kullanım Amacı |
| --- | --- |
| React 19 | Kullanıcı arayüzü geliştirme |
| TypeScript | Tip güvenliği ve sürdürülebilir frontend geliştirme |
| Vite | Hızlı geliştirme ve build altyapısı |
| React Router | Sayfa yönlendirme ve protected route yapısı |
| Zustand | Client-side auth ve uygulama state yönetimi |
| Axios | REST API çağrıları |
| Tailwind CSS | Stil sistemi ve responsive tasarım |
| Framer Motion | Arayüz animasyonları |
| Lucide React | İkon seti |

Mevcut frontend; login, e-posta doğrulama, şifre değiştirme, registrar dashboard, profil ve ayarlar sayfalarını içermektedir. API istekleri için ortak axios yapılandırması ve token interceptor yapısı kurulmuştur.

### 7.2 Backend

| Teknoloji | Kullanım Amacı |
| --- | --- |
| Java 21 | Ana backend geliştirme dili |
| Spring Boot 3.2.4 | Mikroservis uygulama çatısı |
| Spring Web | REST API geliştirme |
| Spring Security | Yetkilendirme ve servis güvenliği |
| Spring Data JPA | ORM ve veritabanı erişimi |
| PostgreSQL Driver | PostgreSQL bağlantısı |
| Spring Kafka | Kafka producer/consumer altyapısı |
| Spring Cloud Gateway | API Gateway ve merkezi yönlendirme |
| Spring Cloud Netflix Eureka | Servis keşfi ve kayıt sistemi |
| JJWT | JWT token üretimi ve doğrulama |
| Lombok | Java boilerplate azaltma |
| Spring Mail | E-posta doğrulama ve bildirim |

### 7.3 Altyapı ve DevOps

| Teknoloji | Kullanım Amacı |
| --- | --- |
| Docker Compose | Yerel geliştirme ve demo ortamı |
| PostgreSQL 15 | Servis bazlı ilişkisel veri saklama |
| Apache Kafka | Asenkron domain event iletişimi |
| Zookeeper | Kafka koordinasyonu |
| Redis | Rate limiting, cache veya geçici veri senaryoları |
| Zipkin | Distributed tracing ve servis izleme |
| Mailpit | Lokal e-posta test ortamı |
| Maven | Backend bağımlılık ve build yönetimi |
| npm | Frontend bağımlılık ve build yönetimi |

## 8. Mimari Tasarım

Sistem mikroservis mimarisiyle tasarlanmıştır. İstemci uygulaması tüm istekleri API Gateway'e gönderir. Gateway, public olmayan endpoint'lerde JWT doğrulaması yapar ve doğrulanan kullanıcı kimliğini downstream servislere `X-User-Id` ve `X-User-Roles` header'larıyla iletir.

Servisler kendi domain sınırları içinde çalışır ve doğrudan başka servislerin veritabanına erişmez. Senkron iletişim REST API üzerinden, asenkron iletişim Kafka topic'leri üzerinden yapılır. Bu yapı hem servis bağımsızlığını artırır hem de gelecekte yeni modüllerin sisteme eklenmesini kolaylaştırır.

### 8.1 Mevcut Servisler

| Servis | Port | Mevcut Durum | Sorumluluk |
| --- | --- | --- | --- |
| eureka-server | 8761 | Mevcut | Servis kayıt ve keşif |
| api-gateway | 8080 | Mevcut | Merkezi yönlendirme, CORS, JWT doğrulama |
| auth-service | 8081 | Mevcut | Giriş, JWT, e-posta doğrulama, öğrenci yönetimi |
| profile-service | 8082 | Mevcut | Profil kayıtları ve kullanıcı profil API'leri |
| event-service | 8089 | Mevcut | Kulüp, etkinlik, RSVP altyapısı |
| frontend | 5173 | Mevcut | React tabanlı kullanıcı arayüzü |

### 8.2 Planlanan Servisler

| Servis | Port | Sorumluluk |
| --- | --- | --- |
| notification-service | 8083 | In-app ve e-posta bildirimleri |
| moderation-service | 8084 | Raporlama, vaka ve yaptırım yönetimi |
| analytics-service | 8085 | Olay toplama, metrik ve dashboard verisi |
| facility-service | 8086 | Tesis rezervasyonları ve check-in |
| food-service | 8087 | Vendor, menü ve sipariş yönetimi |
| ride-service | 8088 | Paylaşımlı yolculuk ilanı ve eşleştirme |
| projectmatch-service | 8090 | Proje ilanı, davet ve ekip eşleştirme |
| microjob-service | 8091 | İş ilanı, teklif, kontrat ve teslimat |

## 9. Veri Yönetimi

Veri katmanında servis bazlı veritabanı yaklaşımı benimsenmiştir. Geliştirme ortamında tek PostgreSQL container içinde birden fazla veritabanı oluşturulmaktadır. Hedef mimaride her servis kendi veritabanı şemasına ve migration sürecine sahip olacaktır.

| Servis | Veritabanı |
| --- | --- |
| auth-service | auth_db |
| profile-service | profile_db |
| notification-service | notification_db |
| moderation-service | moderation_db |
| analytics-service | analytics_db |
| facility-service | facility_db |
| food-service | food_db |
| ride-service | ride_db |
| event-service | event_db |
| projectmatch-service | projectmatch_db |
| microjob-service | microjob_db |

Mevcut durumda servislerde `ddl-auto: update` yaklaşımı kullanılmaktadır. Bitirme projesi olgunlaştırma sürecinde Flyway veya Liquibase ile migration disiplinine geçilmesi planlanmaktadır.

## 10. Güvenlik Tasarımı

Güvenlik yaklaşımı dört ana katmandan oluşur:

- Kimlik doğrulama: auth-service üzerinden e-posta/şifre girişi ve JWT üretimi.
- Merkezi doğrulama: API Gateway üzerinde JWT doğrulama ve protected route kontrolü.
- Rol bazlı yetkilendirme: student, registrar, club_admin, sks_admin, facility_admin, admin gibi roller.
- Domain bazlı yetki: Her servis kendi kaynakları üzerinde owner veya role kontrolü yapar.

Ek güvenlik gereksinimleri:

- JWT secret değeri environment variable üzerinden yönetilmelidir.
- Public endpoint listesi netleştirilmelidir.
- Yetkisiz erişimler 401 veya 403 ile reddedilmelidir.
- Kritik işlemler audit log veya analytics event olarak kaydedilmelidir.
- E-posta doğrulama tamamlanmadan kritik kullanıcı aksiyonları kısıtlanmalıdır.

## 11. Test ve Kalite Planı

Backend tarafında Maven tabanlı test altyapısı kullanılacaktır. Öncelikli test alanları:

- Auth login başarılı/başarısız senaryoları.
- JWT üretimi ve doğrulama.
- Öğrenci oluşturma ve durum değiştirme.
- Profil oluşturma event consumer davranışı.
- RSVP kapasite, waitlist ve iptal senaryoları.
- Yetkisiz event approve/check-in denemeleri.
- Tesis rezervasyon çakışma kontrolü.

Frontend tarafında önerilen test yaklaşımı:

- Vitest ve React Testing Library ile component ve store testleri.
- Login formu, protected route ve auth store senaryoları.
- Registrar dashboard render kontrolü.
- İleriki fazda Playwright ile uçtan uca smoke testler.

Kalite hedefleri:

- Backend ve frontend build komutları hatasız tamamlanmalıdır.
- Kritik business rule'lar testlerle korunmalıdır.
- API sözleşmeleri dokümante edilmelidir.
- UI tarafında rol bazlı yönlendirme ve yetkisiz ekran erişimi kontrol edilmelidir.

## 12. Geliştirme Yol Haritası

| Faz | İçerik | Çıktı |
| --- | --- | --- |
| Faz 1 | Mevcut MVP çekirdeğini derlenebilir ve tutarlı hale getirme | Frontend/backend build, auth-profile-event entegrasyonu |
| Faz 2 | Güvenlik ve rol kontrolleri | Gateway auth stratejisi, role-based authorization, JWT config |
| Faz 3 | Event modülünü uçtan uca tamamlama | Etkinlik feed, RSVP, SKS onay, check-in |
| Faz 4 | Facility Booking MVP | Kaynak listeleme, uygunluk, rezervasyon, iptal |
| Faz 5 | Notification altyapısı | Kafka event consumer, in-app notification API |
| Faz 6 | Admin ve operasyon ekranları | Registrar, SKS/facility admin panelleri |
| Faz 7 | Test, migration ve demo hazırlığı | Flyway, testler, demo verisi, sunum senaryosu |
| Faz 8 | Genişletilmiş modül tasarımları | Food, Ride, ProjectMatch ve MicroJob için teknik taslak |

## 13. Riskler ve Önlemler

| Risk | Etki | Önlem |
| --- | --- | --- |
| Çok geniş ürün kapsamı | Bitirme süresinde tamamlanamama | MVP kapsamı auth, profile, event, facility ve notification ile sınırlandırılmalı |
| Mikroservis karmaşıklığı | Entegrasyon ve debug süresinin artması | Önce çekirdek servisler stabilize edilmeli, sonra yeni servis eklenmeli |
| Kafka topic uyumsuzlukları | Servisler arası otomasyonun çalışmaması | Ortak event sözleşmeleri yazılı hale getirilmeli |
| Migration eksikliği | Veritabanı şema tutarsızlığı | Flyway/Liquibase planı uygulanmalı |
| Test eksikliği | Demo sırasında kritik hata riski | Öncelikli business rule testleri eklenmeli |
| Rol kontrollerinin eksik kalması | Güvenlik açığı | Gateway ve servis seviyesinde yetki kontrolleri tamamlanmalı |
| Frontend/backend response uyumsuzluğu | Runtime veya TypeScript hataları | DTO ve frontend type sözleşmeleri eşitlenmeli |

## 14. Beklenen Akademik Katkı

Bu proje yalnızca CRUD tabanlı bir web uygulaması değil, gerçek hayatta karşılaşılan kampüs süreçlerini domain odaklı modelleyen bir platform denemesidir. Akademik açıdan proje şu başlıklarda değer üretir:

- Mikroservis mimarisinin gerçek bir kampüs problemi üzerinde uygulanması.
- Event-driven servis iletişimi ve Kafka kullanımının gösterilmesi.
- API Gateway, service discovery ve merkezi authentication yapısının uygulanması.
- Rol bazlı erişim ve domain bazlı yetkilendirme tasarımı.
- Modüler ürün kapsamı ve MVP planlama disiplininin gösterilmesi.
- Genişletilebilir veri modeli ve servis sınırlarının tanımlanması.
- Frontend ve backend entegrasyonunun uçtan uca sunulması.

## 15. Başarı Kriterleri

Bitirme projesinin başarılı sayılması için aşağıdaki çıktılar hedeflenmektedir:

- Kullanıcı güvenli şekilde giriş yapabilmelidir.
- Registrar rolü öğrenci hesabı oluşturabilmelidir.
- Yeni kullanıcı için profil kaydı oluşmalıdır.
- Öğrenci, etkinlikleri görüntüleyip RSVP yapabilmelidir.
- SKS veya yetkili rol etkinlik onay sürecini yönetebilmelidir.
- Tesis rezervasyonu için temel çakışma kontrolü çalışmalıdır.
- Kritik aksiyonlar bildirim veya analytics event'i üretebilmelidir.
- Sistem Docker Compose altyapısıyla yerel demo ortamında çalıştırılabilmelidir.
- Frontend ve backend build süreçleri hatasız tamamlanmalıdır.
- Proje mimarisi, teknoloji yığını ve yol haritası dokümante edilmiş olmalıdır.

## 16. Sonuç

IsikCampusOS, kampüs içi dijital süreçleri tek platform altında toplamayı hedefleyen kapsamlı ve teknik olarak güçlü bir bitirme projesi adayıdır. Mevcut kod tabanı projenin çekirdek altyapısını oluşturmaya başlamış durumdadır. Bundan sonraki en doğru yaklaşım, tüm modülleri yüzeysel biçimde eklemek yerine auth, profile, event, facility ve notification merkezli bir MVP'yi güvenli, test edilebilir ve demo edilebilir seviyeye getirmektir.

Bu plan doğrultusunda proje; modern yazılım mimarisi, kullanıcı deneyimi, güvenlik, veri yönetimi ve operasyonel kampüs süreçlerini bir arada ele alan, danışman değerlendirmesinde teknik derinliği savunulabilir bir çalışma olarak konumlandırılabilir.
