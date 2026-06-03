package com.isik.kampusos.gecit;
 
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
 
@SpringBootApplication
@EnableDiscoveryClient
public class GecitUygulamasi {
    public static void main(String[] args) {
        SpringApplication.run(GecitUygulamasi.class, args);
    }
}
