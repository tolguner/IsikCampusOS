package com.isik.kampusos.kimlik.repository;

import com.isik.kampusos.kimlik.model.KullaniciDenetimGunlugu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KullaniciDenetimGunluguDeposu extends JpaRepository<KullaniciDenetimGunlugu, String> {
    /** Sistem yöneticisi log görüntüleyici: en yeni 500 kullanıcı işlemi. */
    List<KullaniciDenetimGunlugu> findTop500ByOrderByOlusturulmaTarihiDesc();
}
