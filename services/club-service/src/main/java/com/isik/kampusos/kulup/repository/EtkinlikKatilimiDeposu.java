package com.isik.kampusos.kulup.repository;

import com.isik.kampusos.kulup.model.EtkinlikKatilimi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EtkinlikKatilimiDeposu extends JpaRepository<EtkinlikKatilimi, String> {
    List<EtkinlikKatilimi> findByEtkinlikId(String etkinlikId);
    List<EtkinlikKatilimi> findByKullaniciIdOrderByOlusturulmaTarihiDesc(String kullaniciId);
    Optional<EtkinlikKatilimi> findByEtkinlikIdAndKullaniciId(String etkinlikId, String kullaniciId);
    Optional<EtkinlikKatilimi> findByEtkinlikIdAndYoklamaBelirteci(String etkinlikId, String yoklamaBelirteci);
    List<EtkinlikKatilimi> findByEtkinlikIdAndDurumOrderByOlusturulmaTarihiAsc(String etkinlikId, EtkinlikKatilimi.KatilimDurumu durum);
    List<EtkinlikKatilimi> findByEtkinlikIdAndDurumInOrderByOlusturulmaTarihiAsc(String etkinlikId, List<EtkinlikKatilimi.KatilimDurumu> durumlar);
}
