package com.isik.kampusos.mesaj.config;

import com.isik.kampusos.ortak.guvenlik.JwtKimlikFiltresi;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                        // Servisler-arası (cluster-içi) konuşma açma/kapatma; gateway'e açılmaz.
                        .requestMatchers("/api/v1/internal/**").permitAll()
                        // Mesajlaşma uçları: katılımcı olan herhangi bir kimliği doğrulanmış kullanıcı.
                        .requestMatchers("/api/v1/mesajlar/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtKimlikFiltresi, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
