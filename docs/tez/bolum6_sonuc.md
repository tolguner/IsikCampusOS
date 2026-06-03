# BÖLÜM 6: SONUÇ VE GELECEK YÖNELİMLERİ (CONCLUSION AND FUTURE DIRECTIONS)

Bu bölümde, çalışmanın geneli özetlenmekte; ulaşılan sonuçlar ana hatlarıyla değerlendirilmekte ve elde edilen katkılar ortaya konmaktadır. Ardından çalışmanın sınırlılıkları tanımlanmakta ve bu sınırlılıkların aşılmasına yönelik gelecek çalışma önerileri sunulmaktadır.

## 6.1. Genel Sonuç

Bu tez çalışmasında, üniversite öğrencilerinin ve personelinin akademik olmayan sosyal ve pratik ihtiyaçlarının dağınık, denetimsiz ve birbirinden kopuk kanallara bırakılmış olması problemi ele alınmış; bu problemi tek bir kapalı, güvenli ve tutarlı dijital platform altında çözen IsikCampusOS bütünleşik kampüs platformu tasarlanmış ve geliştirilmiştir.

Çalışma, kampüs yaşamının altı farklı domainini — kulüp ve etkinlik yönetimi, spor tesisleri rezervasyonu, çevrimiçi yemek siparişi, planlı paylaşımlı yolculuk, beceri tabanlı proje eşleştirme ve kampüs içi mikro iş pazarı — ortak bir altyapı üzerinde birleştirmiştir. Bölüm 2'de incelenen literatür, kampüs dijitalleşmesinin çoğunlukla parçalı kaldığını ve bu domainleri bütünsel biçimde bir araya getiren uygulamaların sınırlı olduğunu ortaya koymuştu. Bu çalışma, söz konusu boşluğa somut bir yanıt üreterek, birbirinden farklı süreçlerin tek bir kullanıcı deneyimi ve ortak bir güvenlik omurgası altında bütünleştirilebileceğini göstermiştir.

Teknik açıdan platform; mikroservis mimarisi, API Gateway üzerinden merkezî kimlik doğrulama, servis keşfi, olay güdümlü asenkron iletişim ve servis başına veri tabanı izolasyonu gibi modern dağıtık sistem yaklaşımlarını gerçek bir bağlamda bir arada uygulamıştır. Bu yaklaşımların ölçülü ve gerekçeli biçimde kullanılması — örneğin servis sayısının domain sınırlarıyla sınırlandırılması ve bildirim gibi tek tüketicili işlevlerin ayrı servise bölünmemesi — mimari karmaşıklığın kontrol altında tutulmasını sağlamıştır.

Çalışmanın özgün değeri iki düzeyde ortaya çıkmaktadır. Birincisi, üretilen çalışan yazılımın kendisidir; ikincisi ve daha kalıcı olanı ise, kampüs süreçlerinin bütünleştirilmesine ilişkin sunduğu, gerekçelendirilmiş ve genişletilebilir mimari modeldir. Paylaşımlı yolculuk ve mikro iş gibi modüllerin ticari uygulamaların birebir kopyası olmak yerine üniversite bağlamına uyarlanması (kapalı topluluk güveni, hibrit konum modeli, ücretli/gönüllü ayrımı, çift yönlü itibar) ve eğitim bilimleri ile insan-bilgisayar etkileşimi kuramlarıyla (Astin, 1984; Tinto, 1975; Sweller, 1988; Norman, 2004) ilişkilendirilmesi, çalışmayı salt bir yazılım geliştirme egzersizinin ötesine taşımaktadır.

## 6.2. Çalışmanın Sınırlılıkları

Çalışmanın sonuçları, belirli sınırlar çerçevesinde değerlendirilmelidir.

**Saha doğrulamasının bulunmaması.** Platform, gerçek bir kullanıcı kitlesiyle saha ortamında test edilmemiştir. Dolayısıyla benimsenme oranı, kullanıcı memnuniyeti, gerçek kullanım yoğunluğu ve sistem performansına ilişkin nicel kanıtlar bu çalışmanın kapsamında yer almamaktadır. Değerlendirme, işlevsel doğrulama ve senaryo temelli inceleme ile sınırlı tutulmuştur.

**Bilinçli kapsam sınırlaması.** Çalışma, sınırlı bir proje süresi içinde tutarlı bir derinliğe ulaşabilmek amacıyla kapsamı kasıtlı olarak sınırlandırmıştır. Gerçek finansal işlem ve ödeme ağ geçidi entegrasyonu, akademik bilgi sistemleriyle (SIS/LMS) canlı veri entegrasyonu, yerel (native) mobil uygulama ve fiziksel donanım/IoT bağlantıları kapsam dışında bırakılmıştır.

**Algoritmaların ölçeklenmemiş olması.** Paylaşımlı yolculuk modülündeki rota sapması optimizasyonu ile proje eşleştirme modülündeki kararlı eşleştirme yaklaşımı, tasarım ve modelleme düzeyinde ele alınmıştır. Bu algoritmaların büyük ölçekli ve gerçek veri üzerinde başarımının (çalışma süresi, eşleşme kalitesi) ölçülmesi gerçekleştirilmemiştir.

**Operasyonel olgunluk.** Platform, bir geliştirme ve demo ortamında çalışır durumdadır; üretim ölçeğinde dağıtım, yük altında dayanıklılık, kapsamlı otomatik test kapsamı ve sürekli izleme gibi operasyonel olgunluk unsurları tam olarak ele alınmamıştır.

## 6.3. Gelecek Çalışmalar

Yukarıda tanımlanan sınırlılıklar, doğrudan gelecek çalışma yönelimlerine işaret etmektedir.

**Saha çalışması ve ampirik değerlendirme.** En öncelikli gelecek çalışma, platformun gerçek öğrenci ve personel kitlesiyle pilot olarak devreye alınması ve nicel yöntemlerle değerlendirilmesidir. Kullanım istatistikleri, memnuniyet anketleri (örneğin teknoloji kabul modelleri temelinde), modüllerin benimsenme oranları ve mevcut dağınık yönteme kıyasla sağladığı zaman/verimlilik kazanımı ölçülebilir. Bu, çalışmanın işlevsel doğrulamasını ampirik kanıtla tamamlayacaktır.

**Algoritmaların geliştirilmesi ve değerlendirilmesi.** Eşleştirme ve optimizasyon gerektiren modüllerin algoritmaları, gerçek veya benzetilmiş (simüle edilmiş) büyük veri kümeleri üzerinde değerlendirilebilir. Paylaşımlı yolculukta rota ve trafik verisiyle eşleşme kalitesi, proje eşleştirmede ise farklı atama stratejilerinin (etiket örtüşmesi, kararlı eşleştirme) karşılaştırılması incelenebilir.

**Kapsamın genişletilmesi.** Bilinçli olarak kapsam dışı bırakılan alanlar ileride ele alınabilir: güvenli bir ödeme altyapısının entegrasyonu, akademik bilgi sistemleriyle (SIS/LMS) entegrasyon yoluyla daha zengin bir kullanıcı bağlamı, ve yerel mobil uygulama geliştirilerek anlık bildirim ve konum tabanlı özelliklerin güçlendirilmesi.

**Veri odaklı özellikler ve yönetişim.** Platformun ürettiği olay verileri temel alınarak, yöneticiler için analitik gösterge panelleri (kullanım, doluluk, katılım metrikleri) ve akranlar arası modüllerde içerik denetimi (moderation) yetenekleri geliştirilebilir. İlerleyen aşamada, öğrencilerin ilgi ve geçmiş etkinlik verilerine dayalı kişiselleştirilmiş öneri (etkinlik, proje, ilan önerisi) mekanizmaları araştırılabilir.

**Ölçeklenebilirlik ve operasyonel olgunluk.** Platformun üretim ortamına taşınması için kapsamlı otomatik test altyapısı, yük testleri, gözlemlenebilirlik (izleme ve uyarı) bileşenleri ve çoklu kampüs (multi-tenant) desteği gibi geliştirmeler hedeflenebilir. Böylece sistem, tek bir kurumdan çok sayıda kuruma uyarlanabilen bir "kampüs işletim sistemi" ürününe dönüşebilir.

Sonuç olarak, IsikCampusOS bu tez kapsamında tanımlanan problemi karşılayan, tasarım hedeflerini sağlayan ve genişlemeye açık bir temel olarak ortaya konmuştur. Burada sunulan mimari model ve gelecek çalışma yönelimleri, hem bu platformun olgunlaştırılması hem de benzer bağlamlarda bütünleşik kampüs sistemleri geliştirmek isteyen çalışmalar için bir başlangıç noktası sunmaktadır.
