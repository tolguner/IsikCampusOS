package com.isik.kampusos.kimlik;
 
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.kafka.annotation.EnableKafka;
 
@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.kimlik", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
@EnableKafka
public class KimlikUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(KimlikUygulamasi.class, args);
    }
}
