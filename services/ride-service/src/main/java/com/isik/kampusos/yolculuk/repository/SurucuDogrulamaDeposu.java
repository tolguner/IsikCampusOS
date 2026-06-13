package com.isik.kampusos.yolculuk.repository;

import com.isik.kampusos.yolculuk.model.SurucuDogrulama;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurucuDogrulamaDeposu extends JpaRepository<SurucuDogrulama, String> {
    Optional<SurucuDogrulama> findByKullaniciId(String kullaniciId);

    List<SurucuDogrulama> findByDurumOrderByOlusturulmaTarihiAsc(SurucuDogrulama.DogrulamaDurumu durum);

    boolean existsByKullaniciIdAndDurum(String kullaniciId, SurucuDogrulama.DogrulamaDurumu durum);
}
