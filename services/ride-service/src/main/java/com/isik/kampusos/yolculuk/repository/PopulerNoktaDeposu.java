package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.PopulerNokta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PopulerNoktaDeposu extends JpaRepository<PopulerNokta, String> {
    List<PopulerNokta> findByAktifTrueOrderByKullanimSayisiDesc();
}
