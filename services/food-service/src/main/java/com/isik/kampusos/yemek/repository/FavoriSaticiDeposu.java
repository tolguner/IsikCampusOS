package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.FavoriSatici;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriSaticiDeposu extends JpaRepository<FavoriSatici, String> {
    List<FavoriSatici> findByKullaniciId(String kullaniciId);
    Optional<FavoriSatici> findByKullaniciIdAndSaticiId(String kullaniciId, String saticiId);
    boolean existsByKullaniciIdAndSaticiId(String kullaniciId, String saticiId);
    void deleteBySaticiId(String saticiId);
}
