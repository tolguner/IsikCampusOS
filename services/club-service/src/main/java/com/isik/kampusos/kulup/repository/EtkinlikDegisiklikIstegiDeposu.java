package com.isik.kampusos.kulup.repository;
 
import com.isik.kampusos.kulup.model.EtkinlikDegisiklikIstegi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Collection;
import java.util.List;
import java.util.Optional;
 
@Repository
public interface EtkinlikDegisiklikIstegiDeposu extends JpaRepository<EtkinlikDegisiklikIstegi, String> {
    List<EtkinlikDegisiklikIstegi> findByDurumInOrderByOlusturulmaTarihiDesc(Collection<EtkinlikDegisiklikIstegi.DegisiklikDurumu> durumlar);
    Optional<EtkinlikDegisiklikIstegi> findFirstByEtkinlik_IdAndDurumOrderByOlusturulmaTarihiDesc(String etkinlikId, EtkinlikDegisiklikIstegi.DegisiklikDurumu durum);
}
