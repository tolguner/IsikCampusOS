package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.Arac;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AracDeposu extends JpaRepository<Arac, String> {
    List<Arac> findByKullaniciIdOrderByOlusturulmaTarihiDesc(String kullaniciId);
    List<Arac> findByDurumOrderByOlusturulmaTarihiAsc(Arac.AracDurumu durum);
    Optional<Arac> findByIdAndKullaniciId(String id, String kullaniciId);
    boolean existsByIdAndKullaniciIdAndDurum(String id, String kullaniciId, Arac.AracDurumu durum);
}
