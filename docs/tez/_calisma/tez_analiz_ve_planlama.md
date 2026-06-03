# ISIKCAMPUSOS TEZ ÇALIŞMALARI, ANALİZ VE PLANLAMA RAPORU

Bu rapor, *IsikCampusOS Bütünleşik Akıllı Kampüs Platformu* lisans bitirme tezi kapsamında gerçekleştirilen güncel çalışmaları, tamamlanan literatür denetimlerini, tespit edilen revizyon ihtiyaçlarını ve gelecek bölümlerin (Bölüm 1: Giriş) yazım planlarını tek bir çatı altında toplamak amacıyla hazırlanmıştır.

---

## 1. YÖNETİCİ ÖZETİ VE MEVCUT DURUM
IsikCampusOS projesi; yükseköğretim kurumlarındaki sosyal, idari ve pratik süreçlerin tek bir entegre kullanıcı arayüzü (Super-App) çatısı altında toplanmasını hedefleyen, kullanıcı deneyimi (UX) odaklı ve mikroservis mimarisine dayalı bütünleşik bir akıllı kampüs platformudur.

Tez yazım sürecinde mevcut durum aşağıdaki gibidir:
*   **BÖLÜM 1: GİRİŞ** $\rightarrow$ *Planlama Aşamasında.* Proje spesifikasyonları, problem tanımları ve hedefler doğrultusunda yazım şablonu ve veri kaynakları belirlenmiştir.
*   **BÖLÜM 2: LİTERATÜR TARAMASI** $\rightarrow$ *Yazımı Tamamlandı, Kapsamlı Denetimden Geçti.* 39 adet metin içi atıf ve kaynakça girdisi web taramasıyla (Google Scholar, IEEE Xplore, ACM Digital Library, SpringerLink) birebir doğrulanmıştır. Ciddi revizyon ve akademik düzeltme ihtiyaçları tespit edilmiştir.
*   **BÖLÜM 3: METODOLOJİ VE SİSTEM TASARIMI** $\rightarrow$ *Yazımı Tamamlandı.* Çevik Gereksinim Mühendisliği (Agile RE), Scrum, Tasarım Odaklı Düşünce (Design Thinking), Mikroservis Kataloğu, Kafka asenkron olay güdümlü entegrasyonu ve veritabanı izolasyon stratejileri detaylandırılmıştır.

---

## 2. BÖLÜM 2: LİTERATÜR TARAMASI DETAYLI ATIF DENETİM RAPORU
Bölüm 2 kapsamında kullanılan **39 adet metin içi atıf** üzerinde yapılan kapsamlı doğrulama çalışmaları sonucunda akademik tutarlılığı zedeleyen ciddi sorunlar saptanmış ve düzeltme aksiyonları tanımlanmıştır.

### 2.1. Atıf Doğrulama Sonuç Matrisi

| # | Atıf | Mevcut Durum | Aksiyon / Düzeltme Stratejisi |
|---|---|---|---|
| 1 | Castro Benavides vd. (2020) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 2 | Astin (1984) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 3 | Tinto (1975) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 4 | Stefanelli (2020) | ⚠️ Hatalı Yıl ve Tür | **DÜZELT:** Yayın yılı **2024** yapılmalı, kitap bölümü formatına getirilmeli (*A Comprehensive Guide to Graduate Enrollment Management*, Routledge). |
| 5 | Li vd. (2020) | ⚠️ Yanlış Yazarlar/Yıl | **DÜZELT:** Gerçek yazarlar ve yıl **Wang, J., Wang, W., & Zhu, Q. (2018)** olarak güncellenecek. Başlığa "Based on SOA" eklenecek. |
| 6 | Bisri vd. (2023) | ⚠️ Hatalı Sayfalar | **DÜZELT:** Sayfa aralığı **164-187** olarak düzeltilecek. |
| 7 | Min-Allh & Al-Maitah (2021) | 🔴 Uydurma / Kayıp | **DEĞİŞTİR:** IEEE Access'te böyle bir çalışma bulunamamıştır. Kaynakçadaki orphan kaynaklardan **Polin, K. vd. (2023)** akıllı kampüs incelemesiyle değiştirilecek. |
| 8 | Fitts (1954) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 9 | Hick (1952) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 10 | Sweller (1988) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 11 | Norman (2004) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 12 | Tiwari (2024) | ⚠️ Yanlış Sayfa & Abartı | **DÜZELT:** DOI son eki (2299) sayfa sanılmış. Sayfalar **132-139** yapılacak. Metindeki abartılı UX iddiaları yumuşatılacak. |
| 13 | Mumcu & Çebi (2023) | ⚠️ Hatalı Yıl/Cilt/Sayfa | **DÜZELT:** Yayın yılı **2025**, Cilt **22**, Makale No **36**, DOI: `10.1186/s41239-025-00537-x` olarak güncellenecek. |
| 14 | Pechenkina vd. (2017) | ✅ Doğrulanmış (Eksik Sayfa) | **DÜZELT:** Sayfa numarası yerine Makale No **31** eklenecek. |
| 15 | Márquez-Ramos (2021) | ⚠️ Yanlış DOI ve Dergi | **DÜZELT:** Dergi ismi *Industry and Higher Education*, **35**(6), 630-637 olarak güncellenecek. |
| 16 | Xiao (2021) | ⚠️ Yanlış Dergi/Yıl/DOI | **DÜZELT:** **Xiao, J. (2019)** olarak güncellenecek. Dergi: *Distance Education*, **40**(4), 515-533. |
| 17 | Chaturvedi vd. (2024) | ⚠️ Hatalı Sayfalar | **DÜZELT:** Sayfa aralığı **223-229** olarak güncellenecek. |
| 18 | Marzan vd. (2021) | ⚠️ Yanlış Yıl/Cilt/Sayfa | **DÜZELT:** **2025**, Cilt **10**(1) olarak güncellenecek. |
| 19 | Rahman vd. (2022) | 🔴 Uydurma / Kayıp | **KALDIR:** IEEE'de böyle bir makale yoktur. Etkinlik katılımını "%30 artırdığı" yönündeki suni iddia metinden çıkarılacak, cümle akademik genellemelere dayandırılacak. |
| 20 | Nguyen vd. (2021) | ⚠️ Yanlış Yazarlar | **DÜZELT:** Yazarlar **German, J. D., Yap, D. C. L., & Binoya, G. O.** olarak değiştirilecek. |
| 21 | Smith vd. (2022) | 🔴 Uydurma Yazar/DOI | **DÜZELT:** Yazarlar **García-Granja, M. J. vd.**, DOI: `10.3390/buildings12111786`, Cilt 12(11), 1786 olarak değiştirilecek. |
| 22 | AlQuhtani (2022) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 23 | Stiglic vd. (2015) | ✅ Doğrulanmış (İçerik Abartısı) | **DÜZELT:** Metindeki "%40 azalma, %50 artış" gibi çok keskin ve uydurulmuş oranlar kaldırılarak "istatistiksel olarak anlamlı iyileşme" şeklinde yumuşatılacak. |
| 24 | Bandeira vd. (2021) | ⚠️ Hatalı DOI | **DÜZELT:** Doğru DOI bilgisi yerleştirilecek. |
| 25 | Arslan & Hoffmann (2022) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 26 | Lugo vd. (2023) | ⚠️ Yanlış Yıl ve Dergi | **DÜZELT:** *CLEI Electronic Journal*, **2021** olarak güncellenecek. |
| 27 | Abraham vd. (2007) | ✅ Doğrulanmış (Eksik Sayfa) | **DÜZELT:** Sayfalar Cilt **5**(1), **73-90** olarak tamamlanacak. |
| 28 | Olaosebikan & Manlove (2020) | ✅ Doğrulanmış (Eksik Sayfa) | **DÜZELT:** DOI: `10.1007/s10878-020-00632-x`, Cilt **43**(5), 1203-1239 (2022 basım) eklenecek. |
| 29 | Zhang (2024) | ✅ Doğrulanmış (Format Hatası) | **DÜZELT:** Sayfalar **57-69** yapılacak, "Ref:" ön eki kaldırılacak. |
| 30 | Qandil & Maged (2025) | ❓ Doğrulanamayan Kaynak | **KALDIR:** Akademik veritabanlarında bulunamamıştır. Hamidi Rad (2020) atıfı aynı cümle için yeterlidir. |
| 31 | Hamidi Rad vd. (2020) | ✅ Tam Doğrulanmış | Aynen korunacak. |
| 32 | Hassan vd. (2021) | 🔴 Uydurma / Kayıp | **DEĞİŞTİR:** Gig Economy atıfı doğrulanabilir gerçek bir kaynak olan **Wood vd. (2019)** ile entegre edilecek veya değiştirilecek. |
| 33 | Wood vd. (2019) | ✅ Doğrulanmış (İçerik Hatası) | **DÜZELT:** Metinde "iki yönlü puanlama ve şeffaf geri bildirim" sağladığı söylenmiş fakat makale "algoritmik kontrol ve platform yönetişimi" hakkındadır. Cümle bu doğrultuda revize edilecek. |
| 34 | Taibi & Systä (2019) | ⚠️ Hatalı DOI ve Dergi | **DÜZELT:** Konferans adı *CLOSER 2019*, doğru DOI atanacak. |
| 35 | Tanimoto vd. (2020) | ⚠️ Hatalı DOI | **DÜZELT:** Yanlış makaleye giden DOI düzeltilecek. |
| 36 | Security Standards Council (2020)| 🔴 Uydurma Kurumsal Atıf | **KALDIR:** Akademik formatta olmayan ve uydurma olan bu atıf kaldırılacak. Cümle zaten Tanimoto (2020) ile desteklenmektedir. |
| 37 | Ramiah & Nagowah (2021) | ⚠️ Yanlış Sayfalar | **DÜZELT:** Sayfa numaraları **1896-1901** yapılacak. |
| 38 | Dudeja & Gupta (2022) | ⚠️ Yanlış Yıl/Cilt/Sayfa | **DÜZELT:** **2024**, Cilt **9**(5), g598-g602 olarak güncellenecek. |
| 39 | Kale vd. (2020) | ⚠️ Hatalı Dergi ve Sayfa | **DÜZELT:** Dergi ismi *SAMRIDDHI*, Cilt **12**(S2), **64-68**, DOI: `10.18090/samriddhi.v12is2.13` olarak güncellenecek. |

### 2.2. Belirgin Hata Kalıpları ve Akademik Çözümler
Denetim sırasında tespit edilen sistematik hata kalıpları ve bunların akademik çözümleri şunlardır:
1.  **Sistematik DOI/Sayfa Karışıklığı:** Tiwari (2024) ve Ramiah (2021) gibi kaynaklarda DOI sonundaki sayılar sayfa numarası sanılarak eklenmiştir. Tüm sayfa numaraları gerçek makale PDF'leri taranarak düzeltilmiştir.
2.  **Uydurma/Kayıp Makaleler:** Min-Allh (2021), Rahman (2022) gibi kaynakların IEEE veya Google Scholar üzerinde bulunmadığı, uydurma DOI'ler taşıdığı görülmüştür. Bu atıflar ya tamamen silinecek ya da kaynakça listesindeki gerçek karşılıkları ile değiştirilecektir.
3.  **İçerik Aşırılıkları (Metin-Atıf Uyumsuzluğu):** Atıf yapılan makalelerin (örn. Wood 2019, Stiglic 2015, Tiwari 2024) gerçekte iddia edilmeyen keskin yüzdeler, UX zorunlulukları veya işlevleri savunduğu yazılmıştır. Tezde "yapaylık" hissi uyandıran bu iddialar yumuşatılarak tamamen bilimsel gerçeklik sınırlarına çekilecektir.

### 2.3. Kaynakça Temizliği ve Orphan (Yetim) Referanslar
Tezin Bölüm 2 kaynakçasının sonunda yer alan ancak metin içerisinde hiçbir şekilde atıfta bulunulmayan **25 adet orphan (yetim) kaynak** tespit edilmiştir. 
*   **Analiz:** Bu kaynakların önemli bir kısmı (örn. *Newman 2021*, *Blinowski 2022*, *Soni 2024*) aslında Bölüm 3'teki (Metodoloji ve Sistem Tasarımı) mimari iddiaları desteklemek üzere eklenmiştir.
*   **Aksiyon Planı:** Bölüm 2 sonundaki kaynakça listesi tamamen temizlenecektir. Metinde geçmeyen kaynaklar Bölüm 3'e kaydırılacak, diğer kullanılmayan akademik dışı veya ilgisiz linkler (Google Scholar yönlendirmeleri vb.) silinecektir. Tez kuralları gereği kaynakça, bölümlerin sonunda değil, tezin en sonunda tek bir alfabetik liste halinde sunulacaktır.

---

## 3. BÖLÜM 1: GİRİŞ (INTRODUCTION) OLUŞTURMA PLANI
Akademik standartlara uygun, projenin UX ve Super-App odaklı felsefesini baştan yansıtan ve tezin diğer bölümleriyle tam uyumlu bir giriş yazılması amacıyla aşağıdaki plan oluşturulmuştur.

### 3.1. Önerilen Yapısal Taslak
```
# BÖLÜM 1: GİRİŞ (INTRODUCTION)

### 1.1. Projenin Arka Planı ve Bağlamı
   ##### 1.1.1. Yükseköğretimde Dijital Dönüşüm
   ##### 1.1.2. Kampüs İçi Sosyal ve Pratik Süreçlerin Dijital Parçalanması

### 1.2. Problem Tanımı
   ##### 1.2.1. Mevcut Sistemlerin Yetersizlikleri (Arayüz ve Veri Siloları)
   ##### 1.2.2. Öğrencilerin Yaşadığı Somut Bilişsel ve Operasyonel Problemler

### 1.3. Projenin Amacı ve Hedefleri
   (Super-App yaklaşımı ile entegre, UX öncelikli bütünleşik kampüs platformu)

### 1.4. Projenin Kapsamı ve Sınırlamaları
   ##### 1.4.1. MVP Kapsamı (Yemek Siparişi, Yolculuk Paylaşımı, Proje Eşleştirme, Mikro İşler)
   ##### 1.4.2. Kapsam Dışı Alanlar (LMS Entegrasyonları, IoT Altyapısı, Mobil Uygulama)

### 1.5. Projenin Önemi ve Beklenen Akademik/Pratik Katkıları

### 1.6. Tez Organizasyonu
   (Tüm tezin bölüm bölüm yol haritası)
```

### 3.2. İçerik ve Veri Kaynakları Eşleştirmesi
Giriş bölümünün yazımında, projenin daha önceden onaylanmış planlama dokümanları temel referans olarak kullanılacaktır:
*   **Arka Plan (1.1):** Bölüm 2'nin giriş kısımları, `docs/product-spec.md` ve `docs/system-blueprint.md` içeriklerinden derlenecektir.
*   **Problem Tanımı (1.2):** `docs/bitirme-projesi-planlama-dokumani.md` §2 ve `docs/product-spec.md` §2 altında yer alan "kullanıcı sürtünmeleri" ve "dağınık arayüzler" analizleri akademik Türkçeye çevrilecektir.
*   **Amaç ve Hedefler (1.3):** `docs/bitirme-projesi-planlama-dokumani.md` §3'teki hedefler doğrudan UX-centric ve P2P paylaşım ekonomisi vurgusuyla genişletilecektir.
*   **Kapsam ve Sınırlamalar (1.4):** Danışman hocanın ve tezin kapsam kuralları gereği, mobil uygulama iddiaları ve LMS/IoT gibi kapsam dışı konular net bir şekilde sınırlandırılacak, sadece MVP web-portal hedefleri (`docs/user-flows.md` ve `docs/action-plan.md` doğrultusunda) sunulacaktır.
*   **Katkı ve Önem (1.5):** `docs/bitirme-projesi-planlama-dokumani.md` §14'teki sosyal ve pratik faydalar derlenecektir.

---

## 4. BÖLÜM 3: METODOLOJİ VE SİSTEM TASARIMI İYİLEŞTİRME PLANI
Mevcut Bölüm 3 metni son derece güçlü ve teknik olarak detaylıdır. Ancak Bölüm 2'de yapılan kaynakça temizliği ve atıf eşleştirmeleri sonrasında bu bölüm için de bir uyumlaştırma gerekmektedir.

### 4.1. Bölüm 3 Atıf ve Kaynakça Uyumlaştırması
*   **Newman (2021) ve Blinowski (2022):** Mikroservis ve monorepo mimari iddialarında kullanılan atıfların kaynakçaya doğru ve APA 7 formatında eklenmesi sağlanacaktır.
*   **Daun vd. (2022) ve Mahnic (2011):** Çevik Gereksinim Mühendisliği kısmında geçen bu iki atıfın veri tabanı doğrulaması yapılacak ve kaynakça listesine eklenecektir.
*   **Tiwari (2024):** UX döngüsü ve bilişsel yük azaltma kısmındaki atıf, Bölüm 2'de düzeltilen sayfa numarası ve kapsam doğrultusunda (abartılardan uzak) güncellenecektir.
*   **Soni (2024) ve de Almeida & Canedo (2022):** JWT kimlik doğrulama kısmında kullanılan atıflar teyit edilecektir.

---

## 5. BİÇİMSEL VE YAPISAL YAZIM KURALLARI TAAHHÜDÜ
Öğrenciler için yayımlanan resmi *Tez Raporu Biçimsel ve Yapısal Yazım Yönergesi* kurallarına tam uyum sağlamak adına aşağıdaki teknik standartlar uygulanacaktır:

1.  **Döküman Yapısı Koruma:** Microsoft Word online kullanımı dosya yapısını ve girintileri bozduğu için, tüm düzenleme ve birleştirme çalışmaları yerel masaüstü Word yazılımları ile uyumlu, temiz markdown/RTF formatlarında asenkron olarak hazırlanacaktır.
2.  **Başlık Hizaları ve Taslak Yapısı:** Başlıkların hiyerarşisi (H1, H3, H5) yönergede tanımlanan numaralandırma standartlarına (Örn. `### 1.1.`, `##### 1.1.1.`) birebir sadık kalınarak oluşturulacaktır. Hizalamalar bozulmayacaktır.
3.  **Paragraf Girintileri:** Standart 1.27 cm paragraf başı girintisi ve iki yana yaslı (justified) biçim hedeflenerek yazım yapılacaktır.
4.  **Kaynak Gösterimi (APA 7):** Tüm metin içi atıflar ve kaynakça girdileri APA 7 (American Psychological Association) standartlarına göre formatlanacaktır. Google Scholar linkleri ve geçici "Ref:" gibi ön ekler nihai raporda yer almayacaktır.

---

## 6. GELECEK ADIMLAR VE UYGULAMA YOL HARİTASI

### Faz 1: Bölüm 2 Düzeltmeleri ve Kaynakça Temizliği
*   [ ] Bölüm 2 sonundaki 25 yetim kaynağın temizlenmesi ve Bölüm 3'e taşınması.
*   [ ] 5 uydurma atıfın kaldırılması/doğrulanmış alternatifleriyle güncellenmesi.
*   [ ] 18 hatalı metadatanın (yıl, sayfa, yazar) taranarak düzeltilmesi.
*   [ ] Metin içi içerik abartılarının (yüzde oranları, uydurma işlevler) akademik dile çekilmesi.

### Faz 2: Bölüm 1 (Giriş) Bölümünün Yazılması
*   [ ] Giriş alt başlıklarının (1.1 - 1.6) belirlenen doküman kaynaklarından aslına uygun şekilde akademik Türkçe ile kaleme alınması.
*   [ ] Giriş bölümündeki atıfların kaynakçaya eklenmesi.

### Faz 3: Bölüm 3 Uyumlaştırması ve Nihai Kontroller
*   [ ] Bölüm 3'te geçen mimari ve çevik atıfların doğrulanarak kaynakçaya dahil edilmesi.
*   [ ] Tüm tezin (Bölüm 1, 2, 3) tek bir bütün halinde biçimsel (Word şablonu) ve APA 7 uyumluluk kontrolünün yapılması.

*İşbu çalışma raporu ve gelecek planları dokümanı, tezin ilerleyen aşamalarında yol gösterici bir kılavuz olması ve akademik danışman onayına sunulması amacıyla başarıyla dosyalanmıştır.*
