package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.YolculukSikayeti;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YolculukSikayetiDeposu extends JpaRepository<YolculukSikayeti, String> {
    List<YolculukSikayeti> findAllByOrderByOlusturulmaTarihiDesc();
}
