package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.DenetimGunlugu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DenetimGunluguDeposu extends JpaRepository<DenetimGunlugu, String> {
    List<DenetimGunlugu> findTop500ByOrderByOlusturulmaTarihiDesc();
}
