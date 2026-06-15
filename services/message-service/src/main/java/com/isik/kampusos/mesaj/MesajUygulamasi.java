package com.isik.kampusos.mesaj;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.mesaj", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
public class MesajUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(MesajUygulamasi.class, args);
    }
}
