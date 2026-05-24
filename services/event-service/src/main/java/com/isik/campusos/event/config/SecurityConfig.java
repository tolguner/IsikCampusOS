package com.isik.campusos.event.config;

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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Event Service güvenlik yapılandırması.
 *
 * Rol tabanlı erişim kontrolü:
 * - GET /api/v1/events → Kimlik doğrulayan herkes (STUDENT, REGISTRAR, vb.)
 * - POST /api/v1/events/draft → Kimlik doğrulayan herkes (club admin kontrolü
 * servis katmanında)
 * - POST /{id}/approve → Yalnızca ROLE_SKS_ADMIN veya ROLE_ADMIN
 * - POST /{id}/rsvp → Yalnızca ROLE_STUDENT
 * - POST /{id}/checkin/{uid} → Kimlik doğrulayan herkes (club admin kontrolü
 * servis katmanında)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Yayınlanmış etkinlikleri herkes görebilir (authenticated)
                        .requestMatchers(HttpMethod.GET, "/api/v1/events").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/**").authenticated()

                        // Kulüp listeleme — authenticated
                        .requestMatchers(HttpMethod.GET, "/api/v1/clubs/**").authenticated()

                        // Etkinlik onaylama — yalnızca SKS_ADMIN veya ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/v1/events/*/approve")
                        .hasAnyAuthority("ROLE_SKS_ADMIN", "ROLE_ADMIN")

                        // Etkinlik oluşturma, RSVP, checkin — authenticated
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:8080",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:8080"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        return new UrlBasedCorsConfigurationSource() {
            {
                registerCorsConfiguration("/**", config);
            }
        };
    }
}
