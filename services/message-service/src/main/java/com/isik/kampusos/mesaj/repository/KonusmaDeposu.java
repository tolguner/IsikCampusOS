package com.isik.kampusos.mesaj.repository;

import com.isik.kampusos.mesaj.model.Konusma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KonusmaDeposu extends JpaRepository<Konusma, String> {
    Optional<Konusma> findByModulAndBaglamId(String modul, String baglamId);

    List<Konusma> findByKatilimcilarContainingOrderBySonMesajTarihiDesc(String kullaniciId);
}
