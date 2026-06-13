package com.isik.kampusos.yolculuk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.yolculuk", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
public class YolculukUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(YolculukUygulamasi.class, args);
    }
}
