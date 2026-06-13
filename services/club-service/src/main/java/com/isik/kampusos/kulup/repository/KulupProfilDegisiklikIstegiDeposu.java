package com.isik.kampusos.kulup.repository;
 
import com.isik.kampusos.kulup.model.KulupProfilDegisiklikIstegi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Collection;
import java.util.List;
import java.util.Optional;
 
@Repository
public interface KulupProfilDegisiklikIstegiDeposu extends JpaRepository<KulupProfilDegisiklikIstegi, String> {
    List<KulupProfilDegisiklikIstegi> findByDurumInOrderByOlusturulmaTarihiDesc(Collection<KulupProfilDegisiklikIstegi.DegisiklikDurumu> durumlar);
    Optional<KulupProfilDegisiklikIstegi> findFirstByKulup_IdAndDurumOrderByOlusturulmaTarihiDesc(String kulupId, KulupProfilDegisiklikIstegi.DegisiklikDurumu durum);
}
