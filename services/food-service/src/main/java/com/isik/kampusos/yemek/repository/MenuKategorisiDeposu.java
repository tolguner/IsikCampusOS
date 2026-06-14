package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.MenuKategorisi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuKategorisiDeposu extends JpaRepository<MenuKategorisi, String> {
    List<MenuKategorisi> findBySaticiIdOrderBySiralamaAscAdAsc(String saticiId);
    Optional<MenuKategorisi> findByIdAndSaticiId(String id, String saticiId);
    boolean existsBySaticiIdAndAdIgnoreCase(String saticiId, String ad);
}
