package com.isik.kampusos.tesis.repository;

import com.isik.kampusos.tesis.model.TesisKaynagi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TesisKaynagiDeposu extends JpaRepository<TesisKaynagi, String> {
    List<TesisKaynagi> findByTesisIdAndSilinmeTarihiIsNullOrderByAdAsc(String tesisId);

    Optional<TesisKaynagi> findByIdAndSilinmeTarihiIsNull(String id);

    boolean existsByTesisIdAndKaynakKoduAndSilinmeTarihiIsNull(String tesisId, String kaynakKodu);
}
