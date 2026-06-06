package com.isik.kampusos.bildirim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.bildirim", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
@EnableKafka
public class BildirimUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(BildirimUygulamasi.class, args);
    }
}
