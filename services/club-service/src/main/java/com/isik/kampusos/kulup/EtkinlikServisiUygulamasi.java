package com.isik.kampusos.kulup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.kulup", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
@EnableScheduling
public class EtkinlikServisiUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(EtkinlikServisiUygulamasi.class, args);
    }
}
