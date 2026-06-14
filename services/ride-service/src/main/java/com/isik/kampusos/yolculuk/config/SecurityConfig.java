package com.isik.kampusos.yolculuk.config;

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
                        .requestMatchers("/api/v1/yolculuk-yonetim/**").hasAnyAuthority("ROLE_RIDE_ADMIN", "ROLE_BUILDING_SUPPORT_ADMIN", "ROLE_ADMIN")
                        .requestMatchers("/api/v1/yolculuklar/**").hasAuthority("ROLE_STUDENT")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtKimlikFiltresi, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
