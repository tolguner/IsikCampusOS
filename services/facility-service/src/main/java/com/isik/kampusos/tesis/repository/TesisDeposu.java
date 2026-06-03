package com.isik.kampusos.tesis.repository;

import com.isik.kampusos.tesis.model.Tesis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TesisDeposu extends JpaRepository<Tesis, String> {
    List<Tesis> findBySilinmeTarihiIsNullOrderByAdAsc();

    Optional<Tesis> findByIdAndSilinmeTarihiIsNull(String id);

    Optional<Tesis> findByAdAndSilinmeTarihiIsNull(String ad);
}
