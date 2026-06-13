package com.isik.kampusos.kimlik.util;
 
import com.isik.kampusos.kimlik.model.Kullanici;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
 
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
 
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
 
@Component
public class JwtSaglayici {
 
    @Value("${security.jwt.secret}")
    private String secret;
 
    @Value("${security.jwt.expiration}")
    private long expirationTime;
 
    private Key signKey;
 
    @PostConstruct
    public void init() {
        this.signKey = Keys.hmacShaKeyFor(secret.getBytes());
    }
 
    public String tokenUret(Kullanici kullanici) {
        Map<String, Object> talepler = new HashMap<>();
        talepler.put("roles", kullanici.getRoller());
        return tokenOlustur(talepler, kullanici.getId());
    }
 
    private String tokenOlustur(Map<String, Object> talepler, String konu) {
        return Jwts.builder()
                .setClaims(talepler)
                .setSubject(konu)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(signKey)
                .compact();
    }
}
