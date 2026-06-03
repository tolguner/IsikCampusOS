package com.isik.kampusos.tesis.repository;

import com.isik.kampusos.tesis.model.RezervasyonYoklama;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RezervasyonYoklamaDeposu extends JpaRepository<RezervasyonYoklama, String> {
    Optional<RezervasyonYoklama> findByRezervasyonId(String rezervasyonId);
    boolean existsByRezervasyonId(String rezervasyonId);
}
