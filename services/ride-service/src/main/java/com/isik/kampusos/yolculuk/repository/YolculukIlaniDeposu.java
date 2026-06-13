package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.YolculukIlani;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface YolculukIlaniDeposu extends JpaRepository<YolculukIlani, String> {
    List<YolculukIlani> findByKalkisZamaniBetweenAndDurumInOrderByKalkisZamaniAsc(
            LocalDateTime baslangic, LocalDateTime bitis, Collection<YolculukIlani.IlanDurumu> durumlar);

    List<YolculukIlani> findBySurucuKullaniciIdOrderByKalkisZamaniDesc(String surucuKullaniciId);
}
