package com.isik.kampusos.tesis.repository;

import com.isik.kampusos.tesis.model.TesisPolitikasi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TesisPolitikasiDeposu extends JpaRepository<TesisPolitikasi, String> {
    Optional<TesisPolitikasi> findByTesisIdAndSilinmeTarihiIsNull(String tesisId);
}
