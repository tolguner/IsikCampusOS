package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.Kampanya;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KampanyaDeposu extends JpaRepository<Kampanya, String> {
    List<Kampanya> findBySaticiIdOrderByOlusturulmaTarihiDesc(String saticiId);
    List<Kampanya> findBySaticiIdAndAktifTrue(String saticiId);
}
