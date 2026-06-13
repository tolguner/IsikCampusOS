package com.isik.kampusos.gecit.filter;
 
import com.isik.kampusos.gecit.util.JwtAraci;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
 
import java.util.List;
 
@Component
public class KimlikDogrulamaGatewayFilterFactory extends AbstractGatewayFilterFactory<KimlikDogrulamaGatewayFilterFactory.Yapilandirma> {
 
    @Autowired
    private JwtAraci jwtAraci;
 
    public KimlikDogrulamaGatewayFilterFactory() {
        super(Yapilandirma.class);
    }
 
    @Override
    public GatewayFilter apply(Yapilandirma yapilandirma) {
        return ((exchange, chain) -> {
            List<String> yetkiBasliklari = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
            if (yetkiBasliklari == null || yetkiBasliklari.isEmpty()) {
                return hataDon(exchange, "Yetki başlığı eksik", HttpStatus.UNAUTHORIZED);
            }
            
            String yetkiBasligi = yetkiBasliklari.get(0);
            if (yetkiBasligi != null && yetkiBasligi.startsWith("Bearer ")) {
                yetkiBasligi = yetkiBasligi.substring(7);
            } else {
                return hataDon(exchange, "Geçersiz yetki başlığı formatı", HttpStatus.UNAUTHORIZED);
            }
 
            try {
                // Token doğrula
                jwtAraci.validateToken(yetkiBasligi);
 
                // Talepleri (claims) çıkar
                Claims claims = jwtAraci.getClaims(yetkiBasligi);
                String kullaniciId = claims.getSubject();
                String roller = claims.get("roles", String.class);
 
                // İsteği alt servisler için başlıklarla zenginleştir
                exchange = exchange.mutate()
                        .request(r -> r.header("X-User-Id", kullaniciId)
                                       .header("X-User-Roles", roller))
                        .build();
 
            } catch (Exception e) {
                return hataDon(exchange, "Yetkisiz erişim", HttpStatus.UNAUTHORIZED);
            }
            
            return chain.filter(exchange);
        });
    }
 
    private Mono<Void> hataDon(ServerWebExchange exchange, String hataMesaji, HttpStatus httpStatus) {
        exchange.getResponse().setStatusCode(httpStatus);
        return exchange.getResponse().setComplete();
    }
 
    public static class Yapilandirma {
        // Boş yapılandırma sınıfı
    }
}
