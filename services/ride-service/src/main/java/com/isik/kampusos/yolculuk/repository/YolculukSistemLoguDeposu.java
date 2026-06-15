package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.YolculukSistemLogu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YolculukSistemLoguDeposu extends JpaRepository<YolculukSistemLogu, String> {
    List<YolculukSistemLogu> findAllByOrderByOlusturulmaTarihiDesc();
}
