package com.isik.kampusos.mesaj.repository;

import com.isik.kampusos.mesaj.model.Mesaj;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MesajDeposu extends JpaRepository<Mesaj, String> {
    List<Mesaj> findByKonusmaIdOrderByOlusturulmaTarihiAsc(String konusmaId);

    Mesaj findFirstByKonusmaIdOrderByOlusturulmaTarihiDesc(String konusmaId);

    long countByKonusmaIdAndGondericiKullaniciIdNotAndOlusturulmaTarihiAfter(
            String konusmaId, String gondericiKullaniciId, LocalDateTime sonra);

    long countByKonusmaIdAndGondericiKullaniciIdNot(String konusmaId, String gondericiKullaniciId);
}
