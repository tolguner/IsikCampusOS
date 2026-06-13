package com.isik.kampusos.tesis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = {"com.isik.kampusos.tesis", "com.isik.kampusos.ortak"})
@EnableDiscoveryClient
public class TesisServisiUygulamasi {

    public static void main(String[] args) {
        SpringApplication.run(TesisServisiUygulamasi.class, args);
    }
}
