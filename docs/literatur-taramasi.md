# IsikCampusOS Literatür Taraması

## 1. Giriş

IsikCampusOS projesi, üniversite kampüslerinde dağınık yürüyen sosyal, akademik ve operasyonel süreçleri tek bir dijital platform altında toplamayı hedefleyen modüler bir kampüs yönetim sistemi olarak tasarlanmıştır. Proje; dijital dönüşüm, akıllı kampüs, mikroservis mimarisi, event-driven sistemler, API Gateway, servis keşfi, dağıtık izleme, güvenlik ve kullanıcı deneyimi gibi birden fazla literatür alanıyla ilişkilidir.

Bu literatür taramasının amacı, projenin yalnızca teknik bir uygulama olmadığını; yükseköğretimde dijital dönüşüm, kampüs hizmetlerinin bütünleştirilmesi ve modern yazılım mimarileri bağlamında akademik olarak konumlandırılabilecek bir çalışma olduğunu göstermektir.

## 2. Yükseköğretimde Dijital Dönüşüm

Yükseköğretim kurumlarında dijital dönüşüm, yalnızca mevcut süreçlerin elektronik ortama taşınması olarak görülmemektedir. Literatürde dijital dönüşüm; kurumların iş yapış biçimini, hizmet sunumunu, paydaşlarla etkileşimini, veri kullanımını ve karar alma süreçlerini yeniden yapılandıran daha kapsamlı bir değişim süreci olarak ele alınmaktadır.

Springer Nature'da yayımlanan çok sesli literatür incelemesi, yükseköğretimde dijital dönüşümün kullanıcı odaklı hizmetler üretme, yeni çalışma biçimleri geliştirme, süreçleri iyileştirme ve kurumsal değer üretme amacı taşıdığını vurgular [1]. Benzer şekilde dijital dönüşüm literatürü, yükseköğretim kurumlarının öğrenci deneyimini iyileştirmek için bulut, analitik, mobil teknolojiler, IoT ve yapay zeka gibi teknolojileri kullandığını belirtir [2].

IsikCampusOS bu bağlamda, üniversite içindeki parçalı hizmetleri tek bir kullanıcı deneyimi altında toplama hedefiyle yükseköğretimde dijital dönüşüm literatürüne doğrudan bağlanır. Proje, yalnızca öğrenci bilgi sistemi ya da etkinlik duyuru platformu değildir; kampüs hizmetlerini veri üreten, izlenebilir ve rol bazlı yönetilebilir bir dijital ekosistem haline getirmeyi amaçlar.

## 3. Akıllı Kampüs Yaklaşımı

Akıllı kampüs kavramı, kampüs ortamındaki fiziksel, sosyal ve akademik süreçlerin dijital teknolojiler aracılığıyla daha verimli, ölçülebilir ve kullanıcı odaklı hale getirilmesini ifade eder. "The Making of Smart Campus: A Review and Conceptual Framework" çalışması, akıllı kampüs literatürünün 2017-2022 arasında hızlı biçimde geliştiğini ve kavramın yalnızca IoT tabanlı fiziksel altyapıdan ibaret olmadığını; kaynak optimizasyonu, kullanıcı deneyimi, sürdürülebilirlik ve veri temelli karar alma boyutlarını da içerdiğini belirtir [3].

Akıllı kampüs çalışmalarında IoT, bulut bilişim, büyük veri analitiği ve gösterge panelleri öne çıkan bileşenlerdir. IoT ve akıllı kampüs üzerine yapılan sistematik literatür incelemeleri, kampüs süreçlerinde sensörler, veri toplama, gerçek zamanlı izleme ve büyük veri analitiğinin öğrenme deneyimi ve operasyonel yönetim için kullanılabildiğini göstermektedir [4].

IsikCampusOS'un ilk sürümü IoT odaklı değildir; ancak etkinlik yönetimi, tesis rezervasyonu, bildirimler, analitik olaylar ve rol bazlı dashboard yapılarıyla akıllı kampüs literatüründeki "kampüs hizmetlerini bütünleştirme" ve "veriye dayalı operasyon" hedefleriyle uyumludur. İleriki fazlarda tesis doluluk sensörleri, QR check-in, konum tabanlı bildirimler veya kampüs kullanım analitiği eklenerek IoT tabanlı akıllı kampüs bileşenlerine genişletilebilir.

## 4. Dijital Kampüs Platformlarında Bütünleşik Hizmet İhtiyacı

Üniversitelerde dijital hizmetler çoğu zaman farklı sistemlere bölünmüştür: öğrenci bilgi sistemi, öğrenme yönetim sistemi, etkinlik duyuru kanalları, kulüp iletişim grupları, rezervasyon formları ve manuel onay süreçleri birbirinden kopuk çalışır. Bu durum öğrenciler için parçalı kullanıcı deneyimi, yöneticiler için ise düşük izlenebilirlik üretir.

Yükseköğretimde dijital dönüşüm çalışmalarında sıkça vurgulanan konulardan biri, öğrenci deneyimini merkez alan bütünleşik dijital hizmet mimarisidir [1][2]. Akıllı kampüs literatüründe de farklı kampüs servislerinin tek ekosistem içinde bağlanması, kullanıcı deneyimi ve veri temelli yönetim açısından önemli görülmektedir [3].

IsikCampusOS bu ihtiyaca şu şekilde cevap verir:

- Tek kimlik doğrulama altyapısı ile kampüs hizmetlerine ortak erişim sağlar.
- Rol bazlı yetkilendirme ile öğrenci, kulüp yetkilisi, SKS, registrar ve admin gibi aktörleri aynı sistemde yönetir.
- Etkinlik, tesis, bildirim, profil ve analitik gibi modülleri ortak bir mimari altında toplar.
- Modüller arası bağımlılığı doğrudan veritabanı erişimi yerine API ve event tabanlı iletişimle sınırlar.
- Kampüs operasyonlarından ölçülebilir veri üretmeyi hedefler.

## 5. Mikroservis Mimarisi

Mikroservis mimarisi, büyük bir uygulamanın küçük, bağımsız geliştirilebilir ve dağıtılabilir servisler halinde modellenmesini önerir. Literatürde mikroservislerin temel avantajları; bağımsız geliştirme, bağımsız deploy, domain sınırlarının netleşmesi, ölçeklenebilirlik ve teknoloji esnekliği olarak öne çıkar. Ancak aynı literatür, mikroservislerin operasyonel karmaşıklık, dağıtık hata ayıklama, servisler arası iletişim, veri tutarlılığı ve test zorluğu gibi riskler getirdiğini de vurgular [5][6].

"Challenges and Solution Directions of Microservice Architectures" başlıklı sistematik literatür incelemesi, mikroservis mimarisinde performans, ölçeklenebilirlik, servisler arası iletişim, güvenlik, veri yönetimi ve deployment gibi konuların önemli zorluk alanları olduğunu ortaya koyar [5]. "Architecting with Microservices" çalışması ise mikroservis araştırmalarında mimari kararlar, servis iletişimi, pattern kullanımı ve endüstri eğilimlerinin merkezi konular olduğunu gösterir [6].

IsikCampusOS'ta mikroservis mimarisinin tercih edilmesinin nedeni, kampüs platformunun birbirinden farklı domain'leri içermesidir:

- Kimlik ve kullanıcı yönetimi
- Profil yönetimi
- Etkinlik ve kulüp yönetimi
- Tesis rezervasyonu
- Bildirim
- Analitik
- Moderasyon
- Yemek, yolculuk, proje ve mikro iş modülleri

Bu domain'lerin tek bir monolit içinde geliştirilmesi başlangıçta daha kolay görünse de, proje genişledikçe kod bağımlılıkları ve veri modeli karmaşıklığı artacaktır. Mikroservis yaklaşımı, her modülün kendi iş kuralları, veritabanı ve API sınırlarıyla geliştirilebilmesine imkan tanır. Ancak bitirme projesi kapsamında bu mimarinin getirdiği karmaşıklık nedeniyle MVP sınırı dikkatli çizilmelidir.

## 6. API Gateway ve Servis Keşfi

Mikroservis sistemlerinde istemcinin her servise doğrudan bağlanması karmaşıklık ve güvenlik riski yaratır. API Gateway pattern'i, istemci ile servisler arasında merkezi bir giriş noktası sağlayarak yönlendirme, kimlik doğrulama, CORS, rate limiting, logging ve response aggregation gibi sorumlulukları üstlenir. Montesi ve Weber'in "Circuit Breakers, Discovery, and API Gateways in Microservices" çalışması, API Gateway, servis keşfi ve circuit breaker gibi pattern'lerin mikroservis programlamasında yaygın ve temel mimari desenler olduğunu belirtir [7].

Servis keşfi ise mikroservislerin dinamik olarak kayıt olması ve diğer bileşenler tarafından bulunabilmesi için kullanılır. Bu yaklaşım, özellikle servis instance sayısının değişebildiği ortamlarda önemlidir. IsikCampusOS'ta Spring Cloud Gateway API Gateway olarak, Eureka ise servis kayıt ve keşif bileşeni olarak kullanılmıştır.

Projede API Gateway'in görevleri:

- Frontend için tek giriş noktası sağlamak.
- `/api/v1/auth`, `/api/v1/profiles`, `/api/v1/events`, `/api/v1/clubs` gibi route'ları ilgili servislere yönlendirmek.
- JWT doğrulamasını merkezi hale getirmek.
- Doğrulanan kullanıcı kimliği ve rollerini downstream servislere aktarmak.
- CORS ve ileride rate limiting gibi çapraz kesen sorumlulukları yönetmek.

Bu yapı, kampüs platformunun yeni modüllerle genişlemesi durumunda frontend tarafında servis karmaşıklığının artmasını engeller.

## 7. Event-Driven Mimari ve Kafka

Mikroservisler arası iletişim iki ana yolla kurulabilir: senkron REST çağrıları veya asenkron event tabanlı iletişim. Event-driven mimari, bir servisin domain içinde önemli bir olay gerçekleştiğinde bunu event olarak yayınlamasına ve diğer servislerin bu olayı bağımsız biçimde tüketmesine dayanır.

Apache Kafka resmi dokümantasyonu Kafka'yı event streaming platformu olarak tanımlar ve dağıtık uygulamaların event akışlarını paralel, ölçeklenebilir ve hata toleranslı biçimde okuyup yazabilmesini sağladığını belirtir [8]. Bu yaklaşım mikroservislerde gevşek bağlılığı artırır; servislerin birbirini doğrudan çağırmak yerine olaylara tepki vermesini mümkün kılar.

IsikCampusOS'ta Kafka'nın planlanan görevleri:

- `user.registered` event'i ile profile-service'in otomatik profil oluşturması.
- `event.published` veya `event.rsvp.created` event'leri ile notification-service'in bildirim üretmesi.
- Kullanıcı aksiyonlarının analytics-service tarafından toplanması.
- Moderasyon, bildirim ve raporlama süreçlerinin domain servislerinden ayrıştırılması.

Örnek senaryo:

1. Registrar yeni öğrenci oluşturur.
2. auth-service kullanıcıyı kaydeder.
3. auth-service Kafka'ya `user.registered` event'i yayınlar.
4. profile-service bu event'i dinleyerek profil kaydı oluşturur.
5. notification-service hoş geldin veya doğrulama bildirimi üretebilir.

Bu yapı, auth-service'in profile-service'e doğrudan bağımlı olmasını engeller. Ancak event-driven sistemlerde idempotency, event şeması, hata tekrar denemeleri ve eventual consistency gibi konular dikkatle tasarlanmalıdır.

## 8. Veri Yönetimi ve Servis Bazlı Veritabanı

Mikroservis mimarisinde her servisin kendi verisini yönetmesi önerilir. Bu yaklaşım, servislerin birbirinin veritabanına doğrudan erişmesini engeller ve domain sınırlarını korur. IsikCampusOS'ta bu nedenle auth_db, profile_db, event_db, notification_db gibi servis bazlı veritabanları planlanmıştır.

Bu yaklaşımın avantajları:

- Her servis kendi veri modelini bağımsız geliştirebilir.
- Bir servis veri şeması diğer servisleri doğrudan kırmaz.
- Domain sınırları teknik olarak korunur.
- İleride servis bazlı ölçekleme ve taşıma kolaylaşır.

Dezavantajları:

- Cross-service sorgular zorlaşır.
- Dağıtık veri tutarlılığı problemi oluşur.
- Transaction yönetimi monolitik sistemlere göre daha karmaşıktır.
- Eventual consistency ve event tabanlı senkronizasyon gerekir.

Bu nedenle IsikCampusOS'ta doğrudan ortak veritabanı yerine REST API ve Kafka event'leri üzerinden veri paylaşımı hedeflenmiştir. Mevcut geliştirme ortamında tek PostgreSQL container içinde birden fazla database kullanılması pratik bir geliştirme tercihidir; hedef mimari ise servis bazlı veri izolasyonudur.

## 9. Cache, Geçici Veri ve Redis

Redis, düşük gecikmeli okuma/yazma gerektiren senaryolarda kullanılan bellek içi veri deposu ve cache altyapısıdır. Redis dokümantasyonu, in-memory cache kullanımının sık erişilen verileri hızlı sunmak ve backend sistem üzerindeki yükü azaltmak için kullanıldığını açıklar [9].

IsikCampusOS'ta Redis'in olası kullanım alanları şunlardır:

- API Gateway seviyesinde rate limiting.
- Kısa ömürlü doğrulama veya şifre sıfırlama kodları.
- Bildirim sayaçları.
- Sık okunan dashboard metrikleri.
- Geçici oturum veya kullanıcı aksiyon state'leri.

MVP aşamasında Redis'in yoğun kullanımı zorunlu değildir; ancak mikroservis mimarisi içinde performans, güvenlik ve geçici veri yönetimi için uygun bir altyapı bileşenidir.

## 10. Dağıtık İzleme ve Zipkin

Mikroservis mimarisinde bir kullanıcı isteği birden fazla servisten geçebilir. Örneğin bir RSVP isteği API Gateway, event-service, Kafka, notification-service ve analytics-service üzerinden dolaylı bir akış oluşturabilir. Bu durumda hata ayıklama ve performans analizi monolitik sistemlere göre daha zordur.

Zipkin resmi dokümantasyonu Zipkin'i dağıtık izleme sistemi olarak tanımlar. Zipkin, trace ve span kavramlarıyla bir isteğin servisler arasında nasıl ilerlediğini, hangi serviste ne kadar zaman harcadığını ve hatanın nerede oluştuğunu izlemeye yardımcı olur [10].

IsikCampusOS'ta Zipkin'in amacı:

- Servisler arası istek akışlarını görünür hale getirmek.
- Gecikme ve hata kaynaklarını analiz etmek.
- Demo sırasında mikroservis mimarisinin izlenebilirliğini göstermek.
- İleriki fazlarda performans iyileştirme için gözlemlenebilirlik altyapısı sağlamak.

Bu açıdan Zipkin, doğrudan kullanıcıya görünen bir özellik değildir; ancak dağıtık sistemin sürdürülebilirliği için önemli bir altyapı bileşenidir.

## 11. E-posta Testi ve Mailpit

Kampüs platformlarında e-posta doğrulama, şifre sıfırlama, etkinlik bildirimi ve rezervasyon hatırlatma gibi iletişim senaryoları önemlidir. Geliştirme ortamında gerçek kullanıcılara e-posta göndermek riskli ve pratik olmayan bir yaklaşımdır. Bu nedenle lokal e-posta test araçları kullanılır.

Mailpit, uygulamaların SMTP üzerinden gönderdiği e-postaları yakalayarak web arayüzünde görüntülemeye yarayan bir geliştirme aracıdır. Mailpit dokümantasyonu, test e-postası gönderme ve uygulama entegrasyonunu destekleyen bir yapı sunduğunu belirtir [11].

IsikCampusOS'ta Mailpit'in görevi:

- auth-service tarafından gönderilen doğrulama kodlarını lokal ortamda test etmek.
- Şifre sıfırlama e-postalarının içeriğini kontrol etmek.
- Gerçek SMTP hesabı kullanmadan demo ve geliştirme yapmak.
- E-posta gönderimi sırasında kullanıcı inbox'larına gereksiz test maili gitmesini engellemek.

Gerçek üretim ortamında Mailpit yerine Gmail SMTP, Microsoft 365 SMTP, kurumsal SMTP veya transactional mail provider kullanılmalıdır.

## 12. Güvenlik ve Kimlik Yönetimi

Dijital kampüs platformları kişisel veri, öğrenci bilgisi, rol bazlı yönetici işlemleri ve operasyonel karar süreçleri içerdiğinden güvenlik kritik öneme sahiptir. IsikCampusOS'ta güvenlik yaklaşımı üç temel katmanda ele alınmıştır:

- Kimlik doğrulama: auth-service üzerinden giriş ve JWT üretimi.
- Merkezi doğrulama: API Gateway üzerinde token kontrolü.
- Yetkilendirme: Roller ve domain kaynak sahipliği üzerinden erişim kontrolü.

JWT tabanlı authentication, stateless API mimarileri için yaygın bir tercihtir. Ancak JWT secret yönetimi, token süresi, refresh token stratejisi, logout davranışı ve rol bilgisinin güncelliği dikkatle ele alınmalıdır. Bitirme projesi kapsamında JWT secret'ın environment variable üzerinden yönetilmesi, public/protected endpoint ayrımının açık tanımlanması ve kritik endpointlerde rol kontrolünün uygulanması gereklidir.

## 13. Frontend Mimarisi ve Kullanıcı Deneyimi

Yükseköğretimde dijital dönüşüm çalışmalarında öğrenci deneyimi merkezi bir konu olarak görülür [1][2]. Bu nedenle IsikCampusOS'un frontend tarafı yalnızca API tüketen basit formlardan oluşmamalı; rol bazlı, anlaşılır ve mobil uyumlu bir kullanıcı deneyimi sunmalıdır.

Projede React, TypeScript, Vite, React Router, Zustand, Axios ve Tailwind CSS tercih edilmiştir. Bu yığın, modern tek sayfa uygulama geliştirme için uygundur:

- React bileşen tabanlı UI geliştirmeyi sağlar.
- TypeScript frontend tarafında veri sözleşmelerinin daha güvenli yönetilmesine yardımcı olur.
- Zustand hafif state yönetimi sağlar.
- React Router protected route yapısı için kullanılır.
- Axios interceptor yapısı token ekleme ve 401 durumunda logout gibi merkezi davranışlara imkan verir.
- Tailwind CSS hızlı ve tutarlı arayüz geliştirmeyi destekler.

Frontend mimarisinde dikkat edilmesi gereken ana konu, backend response modelleri ile TypeScript tiplerinin uyumlu tutulmasıdır. Aksi durumda login sonrası kullanıcı state'i, rol bazlı yönlendirme ve profil ekranlarında hata oluşabilir.

## 14. Literatüre Göre Projenin Konumlandırılması

Literatür incelendiğinde IsikCampusOS'un üç ana eksende konumlandığı görülür:

### 14.1 Akıllı Kampüs ve Dijital Dönüşüm Ekseni

Proje, kampüs hizmetlerini tek bir dijital platform altında birleştirerek öğrenci deneyimini iyileştirmeyi ve kampüs operasyonlarını ölçülebilir hale getirmeyi amaçlar. Bu yönüyle akıllı kampüs ve yükseköğretimde dijital dönüşüm literatürüyle uyumludur.

### 14.2 Modern Yazılım Mimarisi Ekseni

Proje, mikroservis, API Gateway, servis keşfi, event-driven iletişim, servis bazlı veritabanı ve dağıtık izleme gibi modern yazılım mimarisi yaklaşımlarını uygulamalı bir kampüs problemi üzerinde kullanır.

### 14.3 Ürünleşebilir Platform Ekseni

IsikCampusOS tek bir modül değil, genişletilebilir platform yaklaşımıdır. Auth, profile, event, facility, notification, analytics ve moderation gibi ortak servislerle yeni kampüs modüllerinin eklenebileceği bir temel oluşturur. Bu yönüyle ürünleşebilir bir "campus operating system" fikrine yakındır.

## 15. Literatürdeki Boşluk ve Projenin Katkısı

Mevcut literatürde akıllı kampüs çalışmaları çoğunlukla IoT, enerji yönetimi, fiziksel kampüs takibi veya öğrenme analitiği gibi alanlara odaklanmaktadır. Yükseköğretimde dijital dönüşüm çalışmaları ise daha çok strateji, kurum kültürü, öğrenme teknolojileri ve dijital yetkinlikler üzerinden ilerlemektedir.

IsikCampusOS'un katkısı, kampüs içi günlük operasyonları ve öğrenci sosyal yaşamını bir araya getiren uygulamalı ve modüler bir platform önermesidir. Proje özellikle şu boşluklara cevap verir:

- Kulüp etkinlikleri, tesis rezervasyonu ve öğrenci profili gibi süreçleri aynı mimaride birleştirir.
- Kampüs süreçlerini yalnızca duyuru değil, state transition, onay, bildirim ve ölçüm mantığıyla ele alır.
- Öğrenci, SKS, registrar ve admin gibi farklı aktörleri rol bazlı tek sistemde modeller.
- Mikroservis ve event-driven mimariyi akademik kampüs senaryosuna uygular.
- İleride IoT ve analytics ile genişleyebilecek bir temel sağlar.

## 16. Sonuç

Literatür, yükseköğretimde dijital dönüşümün öğrenci deneyimi, operasyonel verimlilik, veri temelli karar alma ve entegre hizmet mimarisi açısından önemli olduğunu göstermektedir. Akıllı kampüs çalışmaları, kampüs kaynaklarının ve kullanıcı etkileşimlerinin dijital olarak izlenebilir ve yönetilebilir hale getirilmesini vurgular. Mikroservis ve event-driven mimari literatürü ise bu tür çok modüllü platformların bağımsız geliştirilebilir, ölçeklenebilir ve sürdürülebilir biçimde tasarlanması için güçlü bir teknik temel sunar.

IsikCampusOS, bu literatür alanlarını birleştirerek kampüs içi süreçleri tek platformda toplayan, mikroservis tabanlı, event-driven ve genişletilebilir bir dijital kampüs platformu olarak konumlandırılabilir. Bitirme projesi açısından en doğru strateji, tüm modülleri yüzeysel biçimde tamamlamak yerine auth, profile, event, facility ve notification merkezli bir MVP'yi güçlü biçimde teslim etmek; kalan modülleri ise mimari tasarım ve yol haritası olarak sunmaktır.

## Kaynakça

[1] Benavides, L. M. C., Arias, J. A. T., Serna, M. D. A., Bedoya, J. W. B., & Burgos, D. "Digital transformation in higher education institutions: A systematic literature review." Education and Information Technologies. https://link.springer.com/article/10.1007/s10639-022-11544-0

[2] Mhlanga, D. ve ilgili literatür bağlamı; "Digital Transformation in the Higher Education Sector: A Systematic Literature Review." Administrative Sciences, MDPI. https://www.mdpi.com/2076-3387/16/1/1

[3] Omotayo, T., Awuzie, B., Egbelakin, T., Obi, L., & Ogunnusi, M. "The Making of Smart Campus: A Review and Conceptual Framework." Buildings, MDPI. https://www.mdpi.com/2075-5309/13/4/891

[4] "Internet of Things and Its Applications to Smart Campus: A Systematic Literature Review." https://www.researchgate.net/publication/366153276_Internet_of_Things_and_Its_Applications_to_Smart_Campus_A_Systematic_Literature_Review

[5] Li, S. et al. "Challenges and Solution Directions of Microservice Architectures: A Systematic Literature Review." Applied Sciences, MDPI. https://www.mdpi.com/2076-3417/12/11/5507

[6] Di Francesco, P., Lago, P., & Malavolta, I. "Architecting with Microservices: A Systematic Mapping Study." https://www.researchgate.net/publication/330245786_Architecting_with_Microservices_a_Systematic_Mapping_Study

[7] Montesi, F., & Weber, J. "Circuit Breakers, Discovery, and API Gateways in Microservices." arXiv:1609.05830. https://arxiv.org/abs/1609.05830

[8] Apache Kafka Documentation. "Introduction." https://kafka.apache.org/intro/

[9] Redis Documentation. "In-memory cache." https://redis.io/glossary/in-memory-cache/

[10] OpenZipkin. "Architecture." https://zipkin.io/pages/architecture.html

[11] Mailpit Documentation. "Testing Mailpit." https://mailpit.axllent.org/docs/install/testing/
