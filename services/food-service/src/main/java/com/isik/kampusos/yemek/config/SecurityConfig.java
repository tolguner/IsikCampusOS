package com.isik.kampusos.yemek.config;

import com.isik.kampusos.ortak.guvenlik.JwtKimlikFiltresi;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtKimlikFiltresi jwtKimlikFiltresi;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Satıcı/menü görüntüleme: tüm kimliği doğrulanmış kullanıcılar
                        .requestMatchers(HttpMethod.GET, "/api/v1/saticilar", "/api/v1/saticilar/**").authenticated()
                        // Öğrenci siparişleri + favorileri
                        .requestMatchers("/api/v1/siparisler/**").hasAuthority("ROLE_STUDENT")
                        .requestMatchers("/api/v1/favoriler/**").hasAuthority("ROLE_STUDENT")
                        // İşletme siparişleri: sahip VE personel (sıra önemli — genel kuraldan önce)
                        .requestMatchers("/api/v1/satici/siparisler/**")
                            .hasAnyAuthority("ROLE_VENDOR_ADMIN", "ROLE_VENDOR_STAFF")
                        // Personel kendi işletmesini ve rolünü görebilsin
                        .requestMatchers(HttpMethod.GET, "/api/v1/satici", "/api/v1/satici/personel/benim-rol")
                            .hasAnyAuthority("ROLE_VENDOR_ADMIN", "ROLE_VENDOR_STAFF")
                        // İşletme yönetimi (menü/ayar/kampanya/çalışma saati/personel/ciro): yalnız sahip
                        .requestMatchers("/api/v1/satici/**").hasAuthority("ROLE_VENDOR_ADMIN")
                        // Destek Hizmetleri Müdürlüğü: işletme kayıt yönetimi
                        .requestMatchers("/api/v1/yonetim/saticilar/**").hasAuthority("ROLE_SUPPORT_SERVICES_ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtKimlikFiltresi, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
