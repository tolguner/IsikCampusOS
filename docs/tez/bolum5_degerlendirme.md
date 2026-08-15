# BÖLÜM 5: DEĞERLENDİRME VE SONUÇLAR (EVALUATION AND RESULTS)

Bu bölümde, geliştirilen IsikCampusOS platformunun başlangıçta belirlenen amaç ve gereksinimler karşısında değerlendirilmesi sunulmaktadır. Değerlendirme; platformun karşıladığı işlevsel gereksinimlerin, tasarım hedeflerinin ve seçilen mimari kararların sonuçları üzerinden yürütülmüştür. Ardından, elde edilen sonuçlar literatür ve proje hedefleri ışığında tartışılmakta; platformun güçlü yönleri ile sınırları ortaya konmaktadır.

## 5.1. Sonuçlar

### 5.1.1. İşlevsel Gereksinimlerin Karşılanması

Projenin temel çıktısı, Bölüm 1'de tanımlanan problemi — kampüs içi sosyal ve pratik süreçlerin dağınık, denetimsiz kanallara bırakılmış olmasını — tek bir kapalı platform altında çözen, çalışır bir bütünleşik sistemdir. Bölüm 3 ve 4'te tasarımı ve gerçekleştirimi sunulan platform, başlangıçta hedeflenen çekirdek işlevsel kapsamı karşılamış; projenin tam vizyonundaki proje eşleştirme ve mikro iş modülleri ise tasarım düzeyinde ele alınarak gelecek çalışmaya bırakılmıştır. Gereksinimlerin karşılanma durumu Tablo 5.1'de özetlenmiştir.

> **[TABLO 5.1 — İşlevsel Gereksinimlerin Karşılanma Durumu]** Aşağıdaki tablo doğrudan kullanılabilir.

| Gereksinim | Karşılanma Durumu |
|------------|-------------------|
| Üniversite e-postası ile güvenli kimlik doğrulama ve rol bazlı erişim | Karşılandı |
| Tek oturumla tüm modüllere erişim (SSO deneyimi) | Karşılandı |
| Otomatik profil oluşturma ve profil yönetimi | Karşılandı |
| Kulüp ve etkinlik yönetimi, SKS onay akışı, RSVP ve bekleme listesi | Karşılandı |
| Etkinlik QR check-in ve sertifika üretimi | Karşılandı |
| Çakışmasız tesis rezervasyonu ve yoklama | Karşılandı |
| Yemek sipariş, durum takibi ve işletme yönetimi (menü, kampanya, ciro) | Karşılandı |
| Planlı paylaşımlı yolculuk (hibrit konum, ilan arama, doğrulama, çift yönlü puan) | Karşılandı |
| Gerçek zamanlı in-app bildirim (SSE) ve okundu takibi | Karşılandı |
| Bağlam temelli platform içi mesajlaşma | Karşılandı |
| Etiket tabanlı proje eşleştirme (ProjectMatch) | Tasarlandı (gerçekleştirim gelecek çalışma) |
| İki taraflı mikro iş pazarı ve çift yönlü itibar (MicroJob) | Tasarlandı (gerçekleştirim gelecek çalışma) |

### 5.1.2. Tasarım Hedeflerinin Karşılanması

İşlevselliğin ötesinde, platform Bölüm 1 ve 2'de ortaya konan üst düzey tasarım hedeflerini de karşılamıştır:

- **Bütünleştirme (tek duraklı hizmet):** Daha önce ayrı kanallara dağılmış olan kulüp, tesis, yemek ve ulaşım süreçleri, ortak bir bildirim ve mesajlaşma katmanıyla birlikte tek bir arayüz ve tek bir kimlik altında toplanmıştır; proje eşleştirme ve mikro iş süreçleri ise aynı omurgaya eklenecek biçimde tasarlanmıştır. Böylece öğrencinin farklı sistemler arasında geçiş yapma ve tekrar tekrar kimlik doğrulama ihtiyacı ortadan kaldırılmıştır.
- **Bilişsel yükün azaltılması:** Tüm modüllerin ortak bir tasarım dili, ortak bileşenler ve tutarlı etkileşim kalıpları üzerine kurulması, modüller arası geçiş maliyetini en aza indirme hedefini desteklemiştir (Sweller, 1988; Norman, 2004).
- **Kapalı topluluk güveni:** Platforma yalnızca doğrulanmış üniversite üyelerinin erişebilmesi ve özellikle akranlar arası (P2P) etkileşim içeren paylaşımlı yolculuk modülünde çift yönlü puanlama/itibar mekanizmasının kullanılması (ve aynı yaklaşımın mikro iş tasarımına taşınması), güvenli bir etkileşim ortamı hedefini karşılamıştır (ter Huurne vd., 2017).

### 5.1.3. Mimari Kararların Sonuçları

Seçilen mikroservis mimarisi, projenin modüler biçimde geliştirilebilmesini somut olarak mümkün kılmıştır. Her modülün bağımsız bir servis olarak ele alınması sayesinde, yeni bir modül eklenirken mevcut servisler etkilenmemiş; her servis kendi veri tabanı ve domain mantığıyla yalıtılmış biçimde geliştirilebilmiştir. API Gateway üzerinden merkezî kimlik doğrulama, güvenlik mantığının tek bir noktada toplanmasını sağlayarak servislerdeki kod tekrarını önlemiştir. Apache Kafka tabanlı olay güdümlü iletişim ise servisleri gevşek bağlı tutarak, bir servisteki işlemin diğer servisin kullanılabilirliğine sıkı biçimde bağımlı olmasını engellemiştir.

Bu mimari yaklaşımın bilinen bedeli, dağıtık sistemlerin getirdiği operasyonel karmaşıklıktır (Blinowski vd., 2022). Bu karmaşıklık, servis sayısının domain sınırlarıyla ölçülü tutulması ve bir sorumluluğun ancak birden çok üreticisi/tüketicisi ortaya çıktığında ayrı servise taşınması (bildirim işlevinin `notification-service`e ayrılmasında olduğu gibi) gibi bilinçli kararlarla yönetilmiştir.

### 5.1.4. Değerlendirme Yöntemine İlişkin Not

Bu çalışmanın değerlendirmesi, geliştirilen sistemin belirlenen gereksinimleri ve tasarım hedeflerini karşılama düzeyi üzerinden, işlevsel doğrulama ve senaryo temelli inceleme yöntemiyle yürütülmüştür. Platformun gerçek kullanıcı kitlesiyle saha ortamında ölçülmesi (kullanım istatistikleri, memnuniyet anketleri, performans karşılaştırmaları gibi nicel veriler) bu tezin kapsamı dışında tutulmuş; bu tür ampirik değerlendirme, Bölüm 6'da gelecek çalışma olarak önerilmiştir. Bu yaklaşım, çalışmanın bir sistem tasarımı ve geliştirme projesi niteliğiyle tutarlıdır.

## 5.2. Tartışma

### 5.2.1. Bulguların Yorumlanması

Elde edilen sonuçlar, kampüs içi dağınık süreçlerin tek bir platformda bütünleştirilmesinin teknik olarak uygulanabilir olduğunu göstermektedir. Bölüm 2'de incelenen literatür, kampüs dijitalleşmesinin çoğunlukla parçalı kaldığını ve bütünsel uygulamaların sınırlı olduğunu ortaya koymuştu (Castro Benavides vd., 2020; Polin vd., 2023). Bu çalışma, söz konusu boşluğa somut bir yanıt üreterek; kulüp, tesis, yemek ve ulaşım gibi birbirinden farklı domainleri — ve aynı omurgaya eklenmek üzere tasarlanan proje eşleştirme ile mikro iş modüllerini — tek bir tutarlı kullanıcı deneyimi ve ortak bir güvenlik omurgası altında birleştiren bir mimarinin kurulabileceğini göstermiştir.

Platformun en belirgin katkısı, modüllerin birbirinden yalıtılmış teknik parçalar olarak değil; ortak altyapıyı (kimlik, profil, bildirim, mesajlaşma, etiket sistemi) paylaşan bir bütünün parçaları olarak tasarlanmasıdır. Örneğin bildirim işlevinin tek bir servise toplanarak kulüp, tesis, yemek ve yolculuk modülleri tarafından olay güdümlü biçimde ortak kullanılması, hem geliştirme tekrarını önlemiş hem de kullanıcı açısından tutarlı tek bir bildirim deneyimi sağlamıştır. Benzer biçimde, kullanıcı kaydı gibi bir olayın birden çok servisi (profil oluşturma) tetiklemesi, bütünleşik platform vizyonunun teknik düzeydeki karşılığını oluşturmuştur.

### 5.2.2. Güçlü Yönler

Çalışmanın öne çıkan güçlü yönleri şunlardır:

- **Gerçek bir kampüs problemine domain-odaklı yaklaşım:** Platform, yüzeysel bir kayıt-okuma (CRUD) uygulamasının ötesinde; SKS onay akışı, kapasite/bekleme listesi yönetimi, rezervasyon çakışma kontrolü ve çift yönlü itibar gibi gerçek iş kurallarını modellemiştir.
- **Modern ve ölçeklenebilir mimari:** Mikroservisler, API Gateway, servis keşfi ve olay güdümlü iletişimin tek bir projede bir arada uygulanması, sistemin gelecekte yeni modüllerle genişlemesine olanak tanıyan sağlam bir temel oluşturmuştur.
- **Bağlama özgü uyarlama:** Paylaşımlı yolculuk modülü — ve tasarımı yapılan mikro iş modülü — mevcut ticari uygulamaların birebir kopyası olmak yerine üniversite bağlamına uyarlanmıştır (kapalı topluluk güveni, hibrit konum modeli, çift yönlü puanlama; mikro iş tasarımında ayrıca ücretli/gönüllü ayrımı). Bu uyarlamalar çalışmanın özgün değerini oluşturmaktadır.
- **Kullanıcı deneyimi tutarlılığı:** Tasarımın baştan itibaren bilişsel yük ve arayüz tutarlılığı ilkeleriyle ilişkilendirilmesi, teknik kararların kullanıcı odaklı bir çerçeveye oturtulmasını sağlamıştır.

Bütün olarak değerlendirildiğinde elde edilen bulgular, IsikCampusOS'un tanımlanan problemi karşıladığını ve belirlenen işlevsel ve tasarımsal hedefleri sağladığını göstermektedir. Çalışmanın değeri, yalnızca üretilen yazılımda değil; aynı zamanda kampüs süreçlerinin bütünleştirilmesine dair sunduğu gerekçelendirilmiş mimari modelde yatmaktadır. Çalışmanın sınırlılıkları ve bu sınırlılıkların işaret ettiği gelecek çalışma yönelimleri, bir sonraki bölümde ayrıntılı olarak ele alınmaktadır.
