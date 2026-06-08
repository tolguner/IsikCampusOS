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
                        // Öğrenci siparişleri
                        .requestMatchers("/api/v1/siparisler/**").hasAuthority("ROLE_STUDENT")
                        // İşletme (satıcı yöneticisi)
                        .requestMatchers("/api/v1/satici/**").hasAuthority("ROLE_VENDOR_ADMIN")
                        // Sistem yöneticisi: satıcı kayıt yönetimi
                        .requestMatchers("/api/v1/yonetim/saticilar/**").hasAuthority("ROLE_ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtKimlikFiltresi, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
