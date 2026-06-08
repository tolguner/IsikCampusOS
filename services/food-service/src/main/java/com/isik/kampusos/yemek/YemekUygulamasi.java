package com.isik.kampusos.yemek;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.yemek", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
public class YemekUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(YemekUygulamasi.class, args);
    }
}
