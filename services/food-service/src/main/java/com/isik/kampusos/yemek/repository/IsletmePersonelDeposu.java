package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.IsletmePersoneli;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IsletmePersonelDeposu extends JpaRepository<IsletmePersoneli, String> {
    List<IsletmePersoneli> findBySaticiIdOrderByOlusturulmaTarihiDesc(String saticiId);
    Optional<IsletmePersoneli> findByKullaniciId(String kullaniciId);
    Optional<IsletmePersoneli> findBySaticiIdAndKullaniciId(String saticiId, String kullaniciId);
    boolean existsByKullaniciId(String kullaniciId);
}
