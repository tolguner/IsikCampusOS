package com.isik.campusos.gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;

import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

@Component
public class JwtUtil {

    @Value("${security.jwt.secret}")
    private String secret;

    private Key signKey;

    @PostConstruct
    public void init() {
        this.signKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public void validateToken(final String token) {
        Jwts.parserBuilder().setSigningKey(signKey).build().parseClaimsJws(token);
    }

    public Claims getClaims(final String token) {
        return Jwts.parserBuilder().setSigningKey(signKey).build().parseClaimsJws(token).getBody();
    }

}
