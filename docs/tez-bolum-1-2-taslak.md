# IsikCampusOS Tez Taslağı - Bölüm 1 ve Bölüm 2

Bu dosya, Word şablonuna aktarılmadan önce içerik akışını kontrol etmek için hazırlanmış çalışma taslağıdır.

Tez başlığı: IsikCampusOS: Mikroservis Tabanlı Dijital Kampüs Platformu  
Öğrenci: Tolga Olguner  
Öğrenci No: 23YOBI1053  
Danışman: Dr. Şahin Aydın

---

# BÖLÜM 1: GİRİŞ

Bu bölüm, IsikCampusOS projesinin ortaya çıkış nedenini, ele aldığı problem alanını ve çalışmanın akademik bağlamını açıklamaktadır. Tez kapsamında geliştirilen sistem, üniversite kampüslerinde öğrenci, kulüp, idari birim ve kampüs hizmetleri arasındaki sosyal ve operasyonel süreçleri tek bir dijital platform altında toplamayı amaçlayan mikroservis tabanlı bir dijital kampüs platformu olarak ele alınmaktadır.

## 1.1. Arka Plan ve Motivasyon

Yükseköğretim kurumlarında dijitalleşme, yalnızca fiziksel süreçlerin elektronik ortama aktarılmasıyla sınırlı değildir. Dijital dönüşüm; kurumların hizmet sunma biçimlerini, paydaşlarla etkileşimini, veri toplama ve karar alma süreçlerini yeniden şekillendiren daha kapsamlı bir değişim alanı olarak değerlendirilmektedir. Benavides, Tamayo Arias, Arango Serna, Branch Bedoya ve Burgos (2020), yükseköğretim kurumlarında dijital dönüşümün teknoloji kullanımının ötesinde kurumsal süreçler, kullanıcı deneyimi, veri temelli karar alma ve organizasyonel yetkinliklerle ilişkili olduğunu vurgulamaktadır. Bu bakış açısı, üniversite kampüslerinde öğrencilerin günlük yaşamını etkileyen sosyal ve operasyonel süreçlerin de dijital dönüşüm kapsamında ele alınmasını gerekli kılmaktadır.

Üniversite kampüslerinde öğrenciler birçok farklı hizmete ve bilgi kaynağına ihtiyaç duyar. Kulüp etkinlikleri, etkinlik onay süreçleri, öğrenci duyuruları, tesis rezervasyonları, kampüs içi işletmeler, proje ekipleri, öğrenci profilleri ve bildirimler çoğu zaman farklı kanallar üzerinden yürütülür. Bu kanallar arasında sosyal medya hesapları, WhatsApp grupları, e-posta duyuruları, Google Sheets dosyaları, bireysel formlar ve sözlü koordinasyon yer alabilir. Böyle bir yapı başlangıçta pratik görünse de, süreçler büyüdükçe bilgi dağınıklığı, erişilebilirlik sorunu, izlenebilirlik eksikliği ve manuel iş yükü ortaya çıkar.

Akıllı kampüs literatürü de benzer bir ihtiyaca işaret etmektedir. Omotayo, Awuzie, Egbelakin, Obi ve Ogunnusi (2023), akıllı kampüs kavramını yükseköğretimde dijital dönüşüm fırsatlarıyla gelişen, teknoloji ve veri kullanımıyla kampüs deneyimini iyileştirmeyi hedefleyen bir yaklaşım olarak ele almaktadır. Türkiye bağlamında Nebati (2023), akıllı kampüs çalışmalarında dijital dönüşüm, karar verme, sürdürülebilirlik, hizmet kalitesi ve kullanıcı ihtiyaçlarının birlikte değerlendirilmesi gerektiğini belirtmektedir. Altun ve Zencirkıran (2021) ise akıllı kampüs uygulamalarının yalnızca teknolojik altyapı değil, kampüs yaşamını etkileyen hizmetlerin planlanması ve yönetilmesi açısından da ele alınması gerektiğini ortaya koymaktadır.

IsikCampusOS projesinin motivasyonu bu noktada ortaya çıkmaktadır. Proje, kampüs içi süreçleri birbirinden kopuk araçlar yerine tek kimlik, rol bazlı erişim, modüler servisler, merkezi yönlendirme, bildirim altyapısı ve izlenebilir veri akışları üzerinden yönetmeyi hedeflemektedir. Sistem yalnızca bir etkinlik duyuru uygulaması olarak değil; öğrenci, kulüp yöneticisi, SKS yetkilisi, registrar, admin ve ileride tesis ya da işletme yöneticisi gibi farklı aktörlerin aynı dijital omurga üzerinde çalışabildiği bütünleşik bir kampüs işletim sistemi olarak kurgulanmıştır.

Bu çalışmanın teknik motivasyonu ise mikroservis mimarisinden kaynaklanmaktadır. Kampüs platformu; kimlik doğrulama, profil yönetimi, kulüp ve etkinlik yönetimi, bildirim, tesis rezervasyonu, yemek siparişi, yolculuk eşleştirme, proje ekipleri, mikro iş pazaryeri, moderasyon ve analitik gibi farklı domain'lerden oluşmaktadır. Bu domain'lerin tek bir monolitik uygulama içinde geliştirilmesi başlangıçta daha basit görünse de, sistemin büyümesiyle birlikte kod bağımlılıkları, veri modeli karmaşıklığı ve dağıtım zorlukları artacaktır. Söylemez, Tekinerdogan ve Tarhan (2022), mikroservis mimarisinin modülerlik, bağımsız geliştirme, bakım kolaylığı ve esnek yapılandırma gibi avantajlar sunduğunu; ancak servis yönetimi, veri tutarlılığı, güvenlik ve gözlemlenebilirlik gibi zorlukların dikkatle ele alınması gerektiğini belirtmektedir.

Bu nedenle IsikCampusOS, mikroservis mimarisini kampüs yönetim alanına uyarlayan bir sistem tasarımı olarak ele alınmıştır. Sistem, API Gateway üzerinden merkezi giriş noktası sunmakta, Eureka ile servis keşfi sağlamayı, Kafka ile domain olaylarını asenkron biçimde taşımayı, PostgreSQL ile servis bazlı veri izolasyonu kurmayı ve React tabanlı bir frontend ile kullanıcı deneyimini birleştirmeyi hedeflemektedir. Spring Cloud Gateway'in API yönlendirme ve çapraz kesen sorumluluklar için sunduğu yapı, Spring Cloud Netflix Eureka'nın servis keşfi desteği, Kafka'nın event streaming yaklaşımı ve Zipkin'in dağıtık izleme modeli, projenin teknik mimari kararlarını destekleyen temel bileşenlerdir.

Bu bağlamda çalışmanın motivasyonu üç ana noktada özetlenebilir. Birincisi, kampüs içi hizmetlerin ve sosyal koordinasyonun tek dijital platformda toplanması ihtiyacıdır. İkincisi, öğrenci ve idari aktörler arasında rol bazlı, izlenebilir ve yönetilebilir iş akışlarının kurulmasıdır. Üçüncüsü ise, kampüs platformunun ileride yeni modüllerle genişleyebilmesi için mikroservis tabanlı ve event-driven bir mimariyle tasarlanmasıdır.

## 1.2. Problem Tanımı

Üniversite kampüslerinde birçok süreç farklı aktörler ve farklı araçlar arasında parçalı biçimde yürütülür. Öğrenciler etkinlikleri sosyal medya duyurularından takip edebilir, kulüpler etkinlik katılımını mesaj gruplarıyla toplayabilir, SKS onay süreçleri e-posta veya manuel formlar üzerinden ilerleyebilir, tesis rezervasyonları ayrı listelerle takip edilebilir ve bildirimler tutarlı bir sistem yerine dağınık kanallardan gönderilebilir. Bu durum hem öğrenci deneyimini hem de idari yönetilebilirliği olumsuz etkiler.

Bu tezde ele alınan temel problem, kampüs içi sosyal ve operasyonel süreçlerin dağınık, izlenmesi zor ve modüler biçimde genişletilemeyen araçlarla yürütülmesidir. Bu problem, aşağıdaki alt problemlerle somutlaşmaktadır:

1. Bilgi dağınıklığı: Etkinlik, duyuru, kulüp, rezervasyon ve diğer kampüs hizmetlerine ait bilgiler farklı kanallarda yer aldığında öğrenciler güncel ve doğru bilgiye erişmekte zorlanır.
2. Manuel koordinasyon yükü: Kulüp yöneticileri ve idari birimler katılım, onay, üyelik, duyuru ve raporlama süreçlerini çoğu zaman manuel olarak takip eder.
3. Rol ve yetki belirsizliği: Öğrenci, kulüp başkanı, SKS yetkilisi, registrar ve admin gibi rollerin farklı yetkilerle çalışması gerekirken, dağınık araçlarda bu ayrım güvenilir biçimde uygulanamaz.
4. İzlenebilirlik eksikliği: Bir etkinlik başvurusunun ne zaman oluşturulduğu, kim tarafından onaylandığı, kaç kişinin katıldığı veya hangi bildirimin gönderildiği gibi bilgiler standart bir veri modeliyle kaydedilmediğinde kurumsal hafıza oluşmaz.
5. Modüler genişleme zorluğu: Kampüs platformuna tesis rezervasyonu, yemek siparişi, yolculuk eşleştirme veya proje ekibi bulma gibi yeni modüller eklemek, ortak kimlik ve ortak bildirim altyapısı yoksa tekrar eden geliştirme maliyeti üretir.
6. Veri temelli karar alma eksikliği: Kampüs yönetimi ve kulüpler, etkinlik katılımı, no-show oranı, aktif kullanıcı sayısı veya modül bazlı kullanım gibi metrikleri düzenli biçimde göremediğinde kararlar sezgisel kalır.

Bu alt problemler, yalnızca kullanıcı arayüzü tasarımıyla çözülebilecek problemler değildir. Problem, aynı zamanda sistem mimarisi, veri yönetimi, kimlik doğrulama, yetkilendirme, servisler arası iletişim ve operasyonel izleme kararlarını da içerir. Bu nedenle IsikCampusOS projesi, kampüs süreçleri için yalnızca tekil bir web uygulaması değil; modüler, ölçeklenebilir, rol bazlı ve izlenebilir bir dijital kampüs platformu olarak tasarlanmıştır.

Çalışmanın temel araştırma sorusu şu şekilde ifade edilebilir:

IsikCampusOS gibi mikroservis tabanlı bir dijital kampüs platformu, üniversite kampüslerindeki dağınık sosyal ve operasyonel süreçleri tek bir modüler mimari altında nasıl bütünleştirebilir ve bu bütünleşme öğrenci deneyimi, idari yönetilebilirlik ve sistem genişletilebilirliği açısından hangi beklenen kazanımları sağlayabilir?

Bu araştırma sorusu doğrultusunda çalışmanın amacı, IsikCampusOS'un sistem tasarımını, mimari kararlarını, uygulama bileşenlerini ve beklenen etkilerini akademik bir çerçevede ortaya koymaktır. Tez kapsamında sistem; kimlik doğrulama, profil yönetimi, kulüp ve etkinlik yönetimi, RSVP, check-in, bildirim, sertifika doğrulama, tesis rezervasyonu, yemek siparişi, kampüs yolculuğu, proje eşleştirme, mikro iş pazaryeri, moderasyon ve analitik bileşenleriyle final ürün mimarisi olarak değerlendirilmiştir.

Bu çalışmanın katkısı üç düzeyde ele alınabilir. İlk olarak, kampüs içi süreçlerin tek platformda bütünleştirilmesine yönelik uygulamalı bir sistem modeli sunulmaktadır. İkinci olarak, mikroservis mimarisi, API Gateway, servis keşfi, event-driven iletişim ve servis bazlı veri yönetimi gibi modern yazılım mimarisi yaklaşımları kampüs yönetim problemi üzerinde somutlaştırılmaktadır. Üçüncü olarak, sistemin gelecekte mobil uygulama, IoT destekli tesis doluluk ölçümü, gelişmiş analitik ve üniversite bilgi sistemleri entegrasyonu gibi alanlara genişleyebilmesi için modüler bir temel önerilmektedir.

# BÖLÜM 2: LİTERATÜR TARAMASI

Bu bölüm, IsikCampusOS projesinin dayandığı akademik ve teknik literatürü incelemektedir. Literatür taraması dört ana eksende ele alınmıştır: yükseköğretimde dijital dönüşüm, akıllı kampüs yaklaşımları, bütünleşik dijital kampüs platformu ihtiyacı ve mikroservis tabanlı modern yazılım mimarileri. Bu eksenler, projenin hem yönetim bilişim sistemleri bağlamındaki konumunu hem de teknik mimari tercihlerini açıklamak için gereklidir.

## 2.1. İlgili Çalışmalar

### 2.1.1. Yükseköğretimde Dijital Dönüşüm

Dijital dönüşüm, yükseköğretim kurumları için yalnızca çevrimiçi ders platformları veya dijital belge yönetimi anlamına gelmez. Kurumsal süreçlerin yeniden tasarlanması, öğrenci deneyiminin iyileştirilmesi, veriye dayalı karar alma mekanizmalarının geliştirilmesi ve farklı paydaşların dijital hizmetlere erişiminin artırılması bu dönüşümün temel parçalarıdır. Benavides ve diğerleri (2020), yükseköğretim kurumlarında dijital dönüşümün teknoloji, süreç, insan ve kurum boyutlarının birlikte ele alınması gereken karmaşık bir alan olduğunu ortaya koymaktadır.

Bu yaklaşım IsikCampusOS açısından önemlidir; çünkü proje yalnızca bir yazılım geliştirme çalışması değildir. Proje, kampüs içi süreçlerin nasıl düzenleneceğine, rollerin nasıl ayrılacağına, kullanıcıların hizmetlere nasıl erişeceğine ve kampüs yönetiminin hangi verileri üreteceğine ilişkin bir yönetim bilişim sistemi önerisidir. Bu nedenle sistemin başarısı yalnızca teknik olarak çalışmasına değil, aynı zamanda kampüs içindeki gerçek süreçleri sadeleştirmesine ve ölçülebilir hale getirmesine bağlıdır.

Yükseköğretimde dijital dönüşüm literatürü, kullanıcı odaklı hizmet tasarımının önemini de vurgular. Öğrenciler çoğu zaman tek bir işlem için birden fazla dijital veya fiziksel kanala başvurmak zorunda kaldığında hizmet deneyimi parçalanır. IsikCampusOS, bu parçalanmayı azaltmak için tek kimlik, tek giriş noktası ve rol bazlı dashboard yaklaşımı sunmaktadır. Öğrenci etkinlik keşfi, kulüp üyeliği, RSVP, bildirim, profil ve ilerleyen modüllerde tesis rezervasyonu gibi işlemleri aynı platform üzerinden gerçekleştirebilir. Bu durum, dijital dönüşümün kullanıcı deneyimi boyutuyla uyumludur.

### 2.1.2. Akıllı Kampüs Yaklaşımı

Akıllı kampüs kavramı, üniversite kampüslerinde teknoloji ve veri kullanımının fiziksel, sosyal, akademik ve idari süreçleri iyileştirmek amacıyla bütünleştirilmesini ifade eder. Omotayo ve diğerleri (2023), akıllı kampüsün yükseköğretimde dijital dönüşümle yakından ilişkili olduğunu ve kampüslerin yalnızca fiziksel altyapıdan değil, toplum, ekonomi, çevre ve yönetişim boyutlarından oluşan çok katmanlı sistemler olarak değerlendirilmesi gerektiğini belirtmektedir.

Türkiye literatüründe Nebati (2023), akıllı kampüs tasarımında farklı kriterlerin önceliklendirilmesi gerektiğini ve dijital dönüşümün kampüs performansı ile ilişkilendirilebileceğini göstermektedir. Altun ve Zencirkıran (2021) ise akıllı kampüs teknolojileri ve uygulamalarını inceleyerek kampüslerin teknolojiyle nasıl dönüştüğünü ve bu dönüşümün kullanıcı ihtiyaçlarıyla birlikte değerlendirilmesi gerektiğini vurgulamaktadır.

IsikCampusOS, akıllı kampüs kavramını IoT sensörleriyle sınırlı görmemektedir. Sistem ilk aşamada kampüs içi sosyal ve operasyonel akışların dijitalleştirilmesine odaklanmaktadır. Kulüp yönetimi, etkinlik onayı, RSVP, check-in, bildirim, profil, tesis rezervasyonu, proje eşleştirme ve analitik gibi modüller, kampüsün veri üreten ve yönetilebilir bir dijital ekosisteme dönüşmesine katkı sağlar. İlerleyen aşamalarda IoT destekli tesis doluluk ölçümü, konum tabanlı bildirimler ve gelişmiş kampüs analitiği sisteme eklenebilir.

Bu nedenle IsikCampusOS, akıllı kampüs literatüründeki iki temel hedefle uyumludur. Birincisi, kampüs hizmetlerinin kullanıcı odaklı biçimde bütünleştirilmesidir. İkincisi, kampüs operasyonlarından karar almaya yardımcı olacak veri üretilmesidir. Proje, fiziksel altyapıdan önce süreç altyapısını dijitalleştiren bir akıllı kampüs platformu olarak konumlandırılabilir.

### 2.1.3. Bütünleşik Dijital Kampüs Platformu İhtiyacı

Üniversite kampüslerinde dijital hizmetler çoğu zaman farklı sistemlerde yer alır. Öğrenci bilgi sistemi, öğrenme yönetim sistemi, kulüp duyuruları, sosyal medya kanalları, rezervasyon listeleri ve idari onay formları birbirinden bağımsız çalışabilir. Bu bağımsızlık her bir sistem için kısa vadede esneklik sağlasa da, öğrenciler ve yöneticiler açısından parçalı bir deneyim üretir.

Bütünleşik platform yaklaşımı, ortak kimlik doğrulama, rol bazlı erişim, ortak bildirim altyapısı, standart veri modeli ve modüler servis yapısı ile bu parçalanmayı azaltmayı amaçlar. IsikCampusOS bu ihtiyaca, kampüs hizmetlerini tek dijital omurga altında birleştirerek cevap vermektedir. Sistem, öğrencinin etkinlik keşfetmesini, kulübe katılmasını, RSVP yapmasını, bildirimi almasını ve ileride tesis ya da diğer kampüs hizmetlerine erişmesini aynı kullanıcı deneyimi içinde ele almaktadır.

Bütünleşik yapı, idari aktörler açısından da önemlidir. SKS yetkilisi kulüp ve etkinlik onay süreçlerini izleyebilir; registrar öğrenci yönetimi yapabilir; kulüp başkanı üyeleri, duyuruları ve etkinlikleri yönetebilir; admin ise sistem genelindeki kullanıcı, rol, bildirim ve analitik süreçleri takip edebilir. Bu rol bazlı yapı, dağınık araçlarda çoğu zaman manuel olarak yürütülen yetki ayrımını sistem seviyesine taşır.

### 2.1.4. Mikroservis Mimarisi

Mikroservis mimarisi, büyük bir yazılım sisteminin küçük, bağımsız geliştirilebilir ve bağımsız dağıtılabilir servislerden oluşmasını öneren bir mimari yaklaşımdır. Söylemez ve diğerleri (2022), mikroservis mimarisinin modülerlik, bağımsız geliştirme, bakım kolaylığı ve esnek yapılandırma gibi avantajlar sunduğunu; ancak bu mimarinin uygulanmasının servis yönetimi, veri yönetimi, güvenlik, performans ve operasyonel karmaşıklık gibi zorlukları da beraberinde getirdiğini belirtmektedir.

IsikCampusOS gibi çok modüllü bir kampüs platformunda mikroservis yaklaşımı mimari açıdan anlamlıdır. Çünkü sistemde kimlik doğrulama, profil, etkinlik, bildirim, tesis, yemek, yolculuk, proje eşleştirme, mikro iş, moderasyon ve analitik gibi farklı iş alanları bulunmaktadır. Her alanın kendi veri modeli, iş kuralları ve kullanıcı akışları vardır. Bu servislerin ayrı sınırlar içinde tasarlanması, sistemin yeni modüllerle genişlemesini kolaylaştırır.

Ancak mikroservis mimarisi her durumda otomatik olarak en doğru çözüm değildir. Dağıtık sistemlerde servisler arası iletişim, hata yönetimi, veri tutarlılığı, izleme ve test süreçleri daha karmaşık hale gelir. Bu nedenle IsikCampusOS mimarisinde API Gateway, servis keşfi, event-driven iletişim, servis bazlı veri izolasyonu ve dağıtık izleme birlikte düşünülmüştür. Böylece mikroservis mimarisinin avantajlarından yararlanırken, temel operasyonel riskler mimari seviyede ele alınmaktadır.

### 2.1.5. API Gateway, Servis Keşfi ve Event-Driven Mimari

Mikroservis tabanlı sistemlerde istemcinin her servise doğrudan erişmesi güvenlik, yönlendirme ve bakım açısından karmaşıklık oluşturur. API Gateway deseni, istemci ile servisler arasında merkezi bir giriş noktası sağlayarak yönlendirme, kimlik doğrulama, CORS, logging, rate limiting ve benzeri çapraz kesen sorumlulukları üstlenebilir. Montesi ve Weber (2016), API Gateway, servis keşfi ve circuit breaker gibi desenlerin mikroservis programlamasında yaygın kullanılan temel desenler olduğunu belirtmektedir.

IsikCampusOS'ta API Gateway, frontend uygulamasının tüm backend servislerine tek bir giriş noktasından ulaşmasını sağlar. JWT doğrulama gateway katmanında merkezi biçimde yapılır ve doğrulanan kullanıcı kimliği ile rol bilgisi downstream servislere header olarak aktarılır. Bu tasarım, her servisin kimlik doğrulama mantığını baştan yazmasını engeller ve güvenlik politikasını merkezi hale getirir. Spring Cloud Gateway resmi dokümantasyonu da gateway yapısının API yönlendirme ve güvenlik, izleme, dayanıklılık gibi çapraz kesen sorumlulukları yönetmek için kullanılabileceğini belirtmektedir.

Servis keşfi, mikroservislerin dinamik ortamda birbirini bulmasını sağlar. Spring Cloud Netflix dokümantasyonunda Eureka, servislerin kendini kayıt ettiği ve diğer bileşenlerin servis instance bilgilerine erişebildiği bir servis keşif mekanizması olarak açıklanmaktadır. IsikCampusOS'ta Eureka, servislerin merkezi olarak kayıt edilmesini ve gateway ya da diğer servisler tarafından bulunmasını sağlayan altyapı bileşeni olarak tasarlanmıştır.

Event-driven mimari ise servisler arası gevşek bağlılığı artırmak için kullanılır. Apache Kafka resmi dokümantasyonu Kafka'yı kayıt akışlarının publish-subscribe modeliyle okunup yazılmasını, dayanıklı biçimde saklanmasını ve gerçek zamanlı işlenmesini sağlayan dağıtık bir streaming platform olarak tanımlamaktadır. IsikCampusOS'ta Kafka, kullanıcı kaydı, profil oluşturma, etkinlik yayınlama, RSVP, bildirim, analitik ve sertifika süreçlerinde domain event'lerinin taşınması için kullanılmaktadır. Böylece örneğin auth-service üzerinde oluşan bir kullanıcı kaydı, profile-service ve notification-service gibi servisler tarafından asenkron biçimde işlenebilir.

### 2.1.6. Güvenlik, Gözlemlenebilirlik ve Operasyonel Yönetim

Dijital kampüs platformları öğrenci bilgileri, rol bazlı yetkiler, etkinlik katılım verileri, duyurular ve idari süreçleri içerdiği için güvenlik kritik öneme sahiptir. IsikCampusOS'ta güvenlik yaklaşımı; üniversite e-postası doğrulama, JWT tabanlı kimlik doğrulama, rol bazlı erişim kontrolü ve kaynak sahipliği kontrolleri üzerine kuruludur. Gateway katmanında merkezi token doğrulama yapılması, servislerin yalnızca doğrulanmış kullanıcı bağlamıyla çalışmasını sağlar.

Dağıtık mimarilerde gözlemlenebilirlik de temel bir gereksinimdir. Bir kullanıcı isteği API Gateway, auth-service, event-service, Kafka ve notification-service gibi birden fazla bileşenden geçebilir. Bu nedenle hata ayıklama ve performans analizi için izleme mekanizmaları gerekir. OpenZipkin mimari dokümantasyonunda Zipkin, span verilerinin uygulamalardan asenkron olarak toplanması ve dağıtık istek akışlarının izlenmesi için kullanılan bir sistem olarak açıklanmaktadır. IsikCampusOS'ta Zipkin, mikroservisler arası isteklerin izlenebilirliğini artırmak ve ileride performans analizlerine altyapı sağlamak amacıyla konumlandırılmıştır.

Bu literatür ve teknik kaynaklar birlikte değerlendirildiğinde, IsikCampusOS'un yalnızca bir uygulama geliştirme projesi değil, yükseköğretimde dijital dönüşüm ve akıllı kampüs yaklaşımlarıyla ilişkili, mikroservis tabanlı bir yönetim bilişim sistemi tasarımı olduğu görülmektedir. Proje, kampüs içi hizmetleri bütünleştirme hedefini modern yazılım mimarisi desenleriyle birleştirmekte; böylece hem kullanıcı deneyimi hem de teknik sürdürülebilirlik açısından değerlendirilebilir bir model sunmaktadır.

---

# Bu Taslakta Kullanılan Kaynakça

Altun, G., & Zencirkıran, M. (2021). Akıllı kampüs teknolojileri ve uygulamaları üzerine bir araştırma. *Mimarlık ve Yaşam, 6*(2), 319-336. https://doi.org/10.26835/my.850103

Apache Kafka. (n.d.). *Introduction*. Retrieved May 23, 2026, from https://kafka.apache.org/11/getting-started/introduction/

Benavides, L. M. C., Tamayo Arias, J. A., Arango Serna, M. D., Branch Bedoya, J. W., & Burgos, D. (2020). Digital transformation in higher education institutions: A systematic literature review. *Sensors, 20*(11), 3291. https://doi.org/10.3390/s20113291

Montesi, F., & Weber, J. (2016). *Circuit breakers, discovery, and API gateways in microservices*. arXiv. https://arxiv.org/abs/1609.05830

Nebati, E. E. (2023). Akıllı kampüs model önerisi. *İstanbul Sabahattin Zaim Üniversitesi Fen Bilimleri Enstitüsü Dergisi, 5*(1), 32-45. https://doi.org/10.47769/izufbed.1360200

Omotayo, T., Awuzie, B., Egbelakin, T., Obi, L., & Ogunnusi, M. (2023). The making of smart campus: A review and conceptual framework. *Buildings, 13*(4), 891. https://doi.org/10.3390/buildings13040891

OpenZipkin. (n.d.). *Architecture*. Retrieved May 23, 2026, from https://zipkin.io/pages/architecture.html

Spring Cloud Gateway. (n.d.). *Spring Cloud Gateway reference documentation*. Retrieved May 23, 2026, from https://docs.spring.io/spring-cloud-gateway/reference/index.html

Spring Cloud Netflix. (n.d.). *Spring Cloud Netflix reference documentation*. Retrieved May 23, 2026, from https://docs.spring.io/spring-cloud-netflix/docs/current/reference/html/

Söylemez, M., Tekinerdogan, B., & Tarhan, A. K. (2022). Challenges and solution directions of microservice architectures: A systematic literature review. *Applied Sciences, 12*(11), 5507. https://doi.org/10.3390/app12115507
