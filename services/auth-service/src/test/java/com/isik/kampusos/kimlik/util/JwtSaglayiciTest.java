package com.isik.kampusos.kimlik.util;

import com.isik.kampusos.kimlik.model.Kullanici;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * JWT üretiminin kritik davranışlarını doğrular: konu (kullanıcı id), roller talebi
 * ve süre dolumu. Saf birim test — Spring bağlamı veya DB gerektirmez.
 */
class JwtSaglayiciTest {

    private static final String SECRET =
            "test_jwt_gizli_anahtari_en_az_altmis_dort_karakter_uzunlugunda_olmali_1234567890";

    private JwtSaglayici jwtSaglayici;
    private Key dogrulamaAnahtari;

    @BeforeEach
    void hazirla() {
        jwtSaglayici = new JwtSaglayici();
        ReflectionTestUtils.setField(jwtSaglayici, "secret", SECRET);
        ReflectionTestUtils.setField(jwtSaglayici, "expirationTime", 3_600_000L);
        jwtSaglayici.init();
        dogrulamaAnahtari = Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    @Test
    void tokenUret_konuVeRolleriDogruYazmali() {
        Kullanici kullanici = Kullanici.builder()
                .id("kullanici-123")
                .roller("ROLE_ADMIN")
                .build();

        String token = jwtSaglayici.tokenUret(kullanici);

        Claims talepler = Jwts.parserBuilder().setSigningKey(dogrulamaAnahtari).build()
                .parseClaimsJws(token).getBody();

        assertThat(talepler.getSubject()).isEqualTo("kullanici-123");
        assertThat(talepler.get("roles", String.class)).isEqualTo("ROLE_ADMIN");
        assertThat(talepler.getExpiration()).isAfter(talepler.getIssuedAt());
    }

    @Test
    void suresiDolmusToken_parseEdilirkenExpiredJwtExceptionVermeli() {
        ReflectionTestUtils.setField(jwtSaglayici, "expirationTime", -1_000L);
        jwtSaglayici.init();

        Kullanici kullanici = Kullanici.builder()
                .id("kullanici-1")
                .roller("ROLE_STUDENT")
                .build();
        String token = jwtSaglayici.tokenUret(kullanici);

        assertThatThrownBy(() -> Jwts.parserBuilder().setSigningKey(dogrulamaAnahtari).build()
                .parseClaimsJws(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void farkliGizliAnahtarlaUretilenTokenDogrulanmamali() {
        Key baskaAnahtar = Keys.hmacShaKeyFor(
                "tamamen_baska_bir_gizli_anahtar_yine_altmis_dort_karakter_uzunlukta_0987".getBytes());
        Kullanici kullanici = Kullanici.builder().id("u").roller("ROLE_STUDENT").build();
        String token = jwtSaglayici.tokenUret(kullanici);

        assertThatThrownBy(() -> Jwts.parserBuilder().setSigningKey(baskaAnahtar).build()
                .parseClaimsJws(token))
                .isInstanceOf(io.jsonwebtoken.security.SignatureException.class);
    }
}
