package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.Satici;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SaticiDeposu extends JpaRepository<Satici, String> {
    List<Satici> findByDurumOrderByAdAsc(Satici.SaticiDurumu durum);
    Optional<Satici> findByYoneticiKullaniciId(String yoneticiKullaniciId);
}
