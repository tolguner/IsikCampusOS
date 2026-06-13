package com.isik.kampusos.ortak.guvenlik;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Key;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Tum alt servisler tarafindan paylasilan JWT kimlik dogrulama filtresi.
 *
 * <p>Iki kaynagi sirayla degerlendirir:
 * <ol>
 *   <li>API Gateway tarafindan eklenen {@code X-User-Id} / {@code X-User-Roles} basliklari.</li>
 *   <li>Dogrudan gelen {@code Authorization: Bearer <token>} basligi (gateway atlandiginda).</li>
 * </ol>
 * Bu sayede istek hem gateway uzerinden hem de dogrudan geldiginde kimlik baglami kurulur.
 */
@Component
public class JwtKimlikFiltresi extends OncePerRequestFilter {

    @Value("${security.jwt.secret}")
    private String secret;

    private Key imzaAnahtari;

    @PostConstruct
    public void init() {
        this.imzaAnahtari = Keys.hmacShaKeyFor(secret.getBytes());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Once gateway basliklari
        String gatewayKullaniciId = request.getHeader("X-User-Id");
        String gatewayRoller = request.getHeader("X-User-Roles");

        if (gatewayKullaniciId != null && !gatewayKullaniciId.isBlank()) {
            kimligiAyarla(gatewayKullaniciId, gatewayRoller);
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Dogrudan Bearer token
        String yetkiBasligi = request.getHeader("Authorization");
        if (yetkiBasligi == null || !yetkiBasligi.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(imzaAnahtari)
                    .build()
                    .parseClaimsJws(yetkiBasligi.substring(7))
                    .getBody();

            String kullaniciId = claims.getSubject();
            String roller = (String) claims.get("roles");
            if (kullaniciId != null && roller != null) {
                kimligiAyarla(kullaniciId, roller);
            }
        } catch (Exception e) {
            // Gecersiz token — kimlik kurulmaz, guvenlik zinciri reddeder
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private void kimligiAyarla(String kullaniciId, String roller) {
        List<SimpleGrantedAuthority> yetkiler = List.of();
        if (roller != null && !roller.isBlank()) {
            yetkiler = Arrays.stream(roller.split(","))
                    .map(String::trim)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }
        UsernamePasswordAuthenticationToken kimlik =
                new UsernamePasswordAuthenticationToken(kullaniciId, null, yetkiler);
        SecurityContextHolder.getContext().setAuthentication(kimlik);
    }
}
