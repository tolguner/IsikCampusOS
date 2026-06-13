package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.YolculukPuani;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface YolculukPuaniDeposu extends JpaRepository<YolculukPuani, String> {
    boolean existsByTalepIdAndVerenKullaniciId(String talepId, String verenKullaniciId);
}
