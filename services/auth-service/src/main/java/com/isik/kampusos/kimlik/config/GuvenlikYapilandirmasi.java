package com.isik.kampusos.kimlik.config;
 
import com.isik.kampusos.ortak.guvenlik.JwtKimlikFiltresi;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class GuvenlikYapilandirmasi {

    private final JwtKimlikFiltresi jwtKimlikFiltresi;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — giriş ve şifre sıfırlama
                .requestMatchers(
                    "/api/v1/kimlik/giris",
                    "/api/v1/kimlik/sifremi-unuttum",
                    "/api/v1/kimlik/sifre-sifirla",
                    "/api/v1/kimlik/eposta-dogrula",
                    "/api/v1/sertifikalar/**"
                ).permitAll()
                // Authenticated endpoints
                .requestMatchers(
                    "/api/v1/kimlik/sifre-degistir",
                    "/api/v1/kimlik/dogrulama-kodu-gonder"
                ).authenticated()
                // Internal: diğer servisler toplu kullanıcı bilgisi çeker
                .requestMatchers("/api/v1/kullanicilar/**").authenticated()
                // Öğrenci yönetimi
                .requestMatchers(HttpMethod.GET, "/api/v1/ogrenciler/**")
                    .hasAnyAuthority("ROLE_REGISTRAR", "ROLE_SKS_ADMIN")
                .requestMatchers("/api/v1/ogrenciler/**").hasAuthority("ROLE_REGISTRAR")
                // İşletme sahibi: personel (ROLE_VENDOR_STAFF) hesap oluşturma/silme (food köprüsü)
                .requestMatchers("/api/v1/kimlik/isletme-personeli/**").hasAuthority("ROLE_VENDOR_ADMIN")
                // Destek Hizmetleri Müdürlüğü işletme yönetimi için sahip (VENDOR_ADMIN) hesabı yönetir.
                // Servis tarafında YALNIZ VENDOR_ADMIN ile sınırlanır (rolDogrula/vendor kapsam kontrolü).
                // Bu matcher jenerik /yonetim/** kuralından ÖNCE gelmeli.
                .requestMatchers("/api/v1/yonetim/kullanicilar/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPPORT_SERVICES_ADMIN")
                // Sistem yöneticisi: tüm kullanıcı/rol yönetimi (denetim günlükleri vb.)
                .requestMatchers("/api/v1/yonetim/**").hasAuthority("ROLE_ADMIN")
                // Diğer tüm istekler authenticated olmalı
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtKimlikFiltresi, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
