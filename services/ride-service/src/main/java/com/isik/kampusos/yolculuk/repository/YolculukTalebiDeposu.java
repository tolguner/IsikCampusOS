package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.YolculukTalebi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface YolculukTalebiDeposu extends JpaRepository<YolculukTalebi, String> {
    List<YolculukTalebi> findByYolcuKullaniciIdOrderByOlusturulmaTarihiDesc(String yolcuKullaniciId);

    List<YolculukTalebi> findByIlanIdInOrderByOlusturulmaTarihiDesc(Collection<String> ilanIdleri);

    Optional<YolculukTalebi> findByIlanIdAndYolcuKullaniciIdAndDurumIn(
            String ilanId, String yolcuKullaniciId, Collection<YolculukTalebi.TalepDurumu> durumlar);
}
