package com.isik.kampusos.kimlik.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimOlusturmaTalebi;
import com.isik.kampusos.kimlik.dto.KullaniciYonetimYaniti;
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.repository.KullaniciDenetimGunluguDeposu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KullaniciYonetimServisiTest {

    @Test
    void rideAdminRoluPersonelYonetimindeOlusturulabilir() {
        KullaniciDeposu kullaniciDeposu = mock(KullaniciDeposu.class);
        KullaniciDenetimGunluguDeposu denetimDeposu = mock(KullaniciDenetimGunluguDeposu.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        @SuppressWarnings("unchecked")
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        KullaniciYonetimServisi servis = new KullaniciYonetimServisi(
                kullaniciDeposu,
                denetimDeposu,
                passwordEncoder,
                kafkaTemplate,
                new ObjectMapper()
        );

        KullaniciYonetimOlusturmaTalebi talep = new KullaniciYonetimOlusturmaTalebi();
        talep.setEposta("ride.admin@isikun.edu.tr");
        talep.setRoller("ROLE_RIDE_ADMIN");
        talep.setAd("Ride");
        talep.setSoyad("Admin");
        talep.setTcKimlikNo("12345678901");

        when(kullaniciDeposu.existsByEposta(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(kullaniciDeposu.save(any(Kullanici.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KullaniciYonetimYaniti yanit = servis.olustur(talep, "admin-id");

        assertThat(yanit.getRoller()).isEqualTo("ROLE_RIDE_ADMIN");
        assertThat(yanit.getEposta()).isEqualTo("ride.admin@isikun.edu.tr");
    }
}
