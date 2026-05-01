# IsikCampusOS Development Log

Bu doküman, projede adım adım yapılan tüm kod değişikliklerini ve komut geçmişini kronolojik olarak takip etmek için oluşturulmuştur.

## [2026-04-25] Aşama 1-3: Altyapı, Gateway ve Core Servisler
- **Infra:** `docker-compose.infra.yml` ve çoklu PostgreSQL için `init.sql` oluşturuldu.
- **Root POM:** Projedeki tüm modülleri yönetmek için `isikcampusos-parent` POM dosyası oluşturuldu.
- **Service Registry:** `eureka-server` modülü eklendi.
- **Gateway:** `api-gateway` modülü eklendi. JWT doğrulama için `AuthenticationFilter` ve `JwtUtil` sınıfları yazıldı. `X-User-Id` başlığı downstream servislere eklendi.
- **Auth Service:** PostgreSQL bağlantısı kuruldu. `User` entity, `AuthService`, Bcrypt ve JWT üretimi yazıldı. Kayıt sonrası `user.registered` Kafka olayı fırlatıldı.
- **Profile Service:** `Profile` entity eklendi. Kafka `UserEventConsumer` yazıldı. `/me` endpointleri oluşturuldu.
- **Maven Wrapper:** Sistem başarıyla derlendi.

## [2026-04-25] Aşama 5: Event Modülü Başlangıcı
- **Event Service Altyapısı:** Parent POM'a eklendi. Spring Boot proje iskeleti (`pom.xml`, `application.yml`, `EventServiceApplication.java`) oluşturuldu. Postgres DB (`event_db`) ve Kafka bağlantı ayarları eklendi.
- **Gateway Güncellemesi:** API Gateway rotalarına (routes) `/api/v1/events/**` eklendi ve `AuthenticationFilter` JWT doğrulaması üzerinden geçecek şekilde yetkilendirildi.
- **Event Modeli ve DB:** Veritabanı tabloları için `Club`, `Event`, `ClubMember` ve `Rsvp` entity'leri oluşturuldu. İlgili Repository interfaceleri yazıldı.
- **İş Mantığı (Service & Controller):** Kulüp adminlerinin etkinlik taslağı (DRAFT) oluşturması, bunu SKS onayına göndermesi ve SKS Admininin bunu yayınlaması akışlarını içeren `EventService` yazıldı. Etkinlik yayınlandığında Kafka'ya `event.published` olayı fırlatıldı.
- **Genişletilmiş RSVP & Waitlist Motoru:** `EventRsvpService` oluşturuldu. Sınırsız kapasite, sınırlı kapasite ve sınırlı/sınırsız bekleme listesi (Waitlist) mantığı kodlandı. Bir öğrenci RSVP iptal ettiğinde bekleme listesindeki ilk öğrenci otomatik olarak (auto-promote) ana listeye atanır ve Kafka'ya `event.rsvp.promoted` mesajı gönderilir.
- **Kulüp Katılım ve Yoklama (Check-in):** Öğrencilerin onay beklemeden kulüplere üye olabilmesi için `/api/v1/clubs/{clubId}/join` uç noktası yazıldı. Kulüp adminlerinin etkinlik günü katılımcıları işaretleyebilmesi için `checkInUser` fonksiyonu eklendi.
- **REST Uçları & Gateway:** API Gateway rotalarına `/api/v1/clubs/**` da eklendi ve tüm REST uçları `EventController` ile dışa açıldı.

## [2026-04-25] Aşama 6: Frontend Entegrasyonu Başlangıcı
- **Proje Kurulumu:** Monorepo yapısı dahilinde `frontend` klasöründe React + TypeScript + Vite projesi oluşturuldu.
- **Kütüphaneler:** Modern arayüz tasarımı için `tailwindcss`, `framer-motion`, `lucide-react`, `zustand` ve `react-router-dom` entegre edildi.
- **Tema ve Stiller:** Kullanıcının istediği karanlık/aydınlık (Dark/Light) tema geçişini sağlamak ve kavisli, glassmorphism içeren "premium" tasarımı yansıtmak amacıyla `tailwind.config.js` ve `index.css` dosyalarına dinamik CSS değişkenleri (`--color-primary`, `--color-bg` vb.) eklendi.
- **Auth (Kimlik Doğrulama) UI & Entegrasyonu:** `Zustand` ile `authStore.ts` oluşturularak Axios üzerinden API Gateway'in (`http://localhost:8080/api/v1/auth`) Login ve Register uç noktalarıyla iletişim kuruldu.
- **Sayfalar:** Premium tasarımlı, şifre ve e-posta ikonları içeren, Framer Motion ile süzülerek açılan `Login.tsx` ve `Register.tsx` ekranları tasarlandı. `App.tsx` içerisinde sayfa yönlendirmeleri (Protected Routes) ve oturum açılınca görünen ana Dashboard arayüzü kuruldu. Çıkış yap (Logout) butonu Navbar'a eklendi.
- **Dokümantasyon Revizyonu:** Mimari strateji gereği `roadmap.md` ve `implementation-readiness.md` dosyaları, Backend ve Frontend'in her modülde paralel (full-stack) yürütülmesini içerecek şekilde güncellendi.
