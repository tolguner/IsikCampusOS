package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.SaticiDegisiklikIstegi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaticiDegisiklikIstegiDeposu extends JpaRepository<SaticiDegisiklikIstegi, String> {
    List<SaticiDegisiklikIstegi> findBySaticiIdOrderByOlusturulmaTarihiDesc(String saticiId);
    List<SaticiDegisiklikIstegi> findByDurumOrderByOlusturulmaTarihiDesc(SaticiDegisiklikIstegi.Durum durum);
    List<SaticiDegisiklikIstegi> findByGrupIdOrderByOlusturulmaTarihiAsc(String grupId);
}
